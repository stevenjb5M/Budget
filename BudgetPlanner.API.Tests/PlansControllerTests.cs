using BudgetPlanner.Controllers;
using BudgetPlanner.Models;
using BudgetPlanner.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using Xunit;

namespace BudgetPlanner.API.Tests;

public class PlansControllerTests
{
    private readonly Mock<ILogger<PlansController>> _loggerMock;
    private readonly Mock<IDynamoDBService> _dynamoDBServiceMock;
    private readonly PlansController _controller;

    public PlansControllerTests()
    {
        _loggerMock = new Mock<ILogger<PlansController>>();
        _dynamoDBServiceMock = new Mock<IDynamoDBService>();
        _controller = new PlansController(_loggerMock.Object, _dynamoDBServiceMock.Object);
    }

    private void SetupUserClaims(string userId = "user-1")
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId)
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    [Fact]
    public async Task GetPlans_Unauthorized_WhenNoUser()
    {
        // Arrange
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
        };

        // Act
        var result = await _controller.GetPlans();

        // Assert
        Assert.IsType<UnauthorizedResult>(result.Result);
    }

    [Fact]
    public async Task GetPlans_ReturnsList_WhenUserPresent()
    {
        // Arrange
        SetupUserClaims("user-1");
        var plans = new List<Plan> { new Plan { Id = "p1", UserId = "user-1", Name = "Plan 1" } };
        _dynamoDBServiceMock.Setup(x => x.GetPlansByUserAsync("user-1")).ReturnsAsync(plans);

        // Act
        var result = await _controller.GetPlans();

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsAssignableFrom<IEnumerable<Plan>>(ok.Value);
        Assert.Single(returned);
    }

    [Fact]
    public async Task GetPlan_NotFound_WhenMissing()
    {
        // Arrange
        SetupUserClaims("user-1");
        _dynamoDBServiceMock.Setup(x => x.GetPlanAsync("missing")).ReturnsAsync((Plan?)null);

        // Act
        var result = await _controller.GetPlan("missing");

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetPlan_Forbid_WhenDifferentUser()
    {
        // Arrange
        SetupUserClaims("user-1");
        var plan = new Plan { Id = "p1", UserId = "other-user", Name = "Other" };
        _dynamoDBServiceMock.Setup(x => x.GetPlanAsync("p1")).ReturnsAsync(plan);

        // Act
        var result = await _controller.GetPlan("p1");

        // Assert
        Assert.IsType<ForbidResult>(result.Result);
    }

    [Fact]
    public async Task CreatePlan_AssignsUserId_And_ReturnsCreated()
    {
        // Arrange
        SetupUserClaims("user-1");
        var input = new Plan { Name = "New Plan" };
        var created = new Plan { Id = "new-id", UserId = "user-1", Name = "New Plan" };
        _dynamoDBServiceMock.Setup(x => x.CreatePlanAsync(It.IsAny<Plan>())).ReturnsAsync(created);

        // Act
        var result = await _controller.CreatePlan(input);

        // Assert
        var createdAt = Assert.IsType<CreatedAtActionResult>(result.Result);
        var returned = Assert.IsType<Plan>(createdAt.Value);
        Assert.Equal("user-1", returned.UserId);
        Assert.Equal("new-id", returned.Id);
    }

    [Fact]
    public async Task UpdatePlan_ReturnsOk_WhenValid()
    {
        // Arrange
        SetupUserClaims("user-1");
        var existing = new Plan { Id = "p1", UserId = "user-1", Name = "Old" };
        _dynamoDBServiceMock.Setup(x => x.GetPlanAsync("p1")).ReturnsAsync(existing);
        _dynamoDBServiceMock.Setup(x => x.UpdatePlanAsync(It.IsAny<Plan>())).ReturnsAsync((Plan p) => p);

        var update = new Plan { Name = "Updated" };

        // Act
        var result = await _controller.UpdatePlan("p1", update);

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<Plan>(ok.Value);
        Assert.Equal("p1", returned.Id);
        Assert.Equal("user-1", returned.UserId);
        Assert.Equal("Updated", returned.Name);
    }

    [Fact]
    public async Task DeletePlan_ReturnsNoContent_WhenValid()
    {
        // Arrange
        SetupUserClaims("user-1");
        var existing = new Plan { Id = "p1", UserId = "user-1", Name = "ToDelete" };
        _dynamoDBServiceMock.Setup(x => x.GetPlanAsync("p1")).ReturnsAsync(existing);
        _dynamoDBServiceMock.Setup(x => x.DeletePlanAsync("p1")).Returns(Task.CompletedTask);

        // Act
        var result = await _controller.DeletePlan("p1");

        // Assert
        Assert.IsType<NoContentResult>(result);
        _dynamoDBServiceMock.Verify(x => x.DeletePlanAsync("p1"), Times.Once);
    }

    [Fact]
    public async Task GetPlan_ReturnsOk_WhenBelongsToUser()
    {
        // Arrange
        SetupUserClaims("user-1");
        var plan = new Plan { Id = "p1", UserId = "user-1", Name = "Plan 1" };
        _dynamoDBServiceMock.Setup(x => x.GetPlanAsync("p1")).ReturnsAsync(plan);

        // Act
        var result = await _controller.GetPlan("p1");

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<Plan>(ok.Value);
        Assert.Equal("p1", returned.Id);
        Assert.Equal("user-1", returned.UserId);
    }

    [Fact]
    public async Task UpdatePlan_NotFound_WhenMissing()
    {
        // Arrange
        SetupUserClaims("user-1");
        _dynamoDBServiceMock.Setup(x => x.GetPlanAsync("missing")).ReturnsAsync((Plan?)null);

        // Act
        var result = await _controller.UpdatePlan("missing", new Plan());

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task UpdatePlan_Forbid_WhenDifferentUser()
    {
        // Arrange
        SetupUserClaims("user-1");
        var existing = new Plan { Id = "p1", UserId = "other-user", Name = "Other" };
        _dynamoDBServiceMock.Setup(x => x.GetPlanAsync("p1")).ReturnsAsync(existing);

        // Act
        var result = await _controller.UpdatePlan("p1", new Plan());

        // Assert
        Assert.IsType<ForbidResult>(result.Result);
    }

    [Fact]
    public async Task CreatePlan_Unauthorized_WhenNoUser()
    {
        // Arrange
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
        };

        // Act
        var result = await _controller.CreatePlan(new Plan { Name = "X" });

        // Assert
        Assert.IsType<UnauthorizedResult>(result.Result);
    }

    [Fact]
    public async Task DeletePlan_NotFound_WhenMissing()
    {
        // Arrange
        SetupUserClaims("user-1");
        _dynamoDBServiceMock.Setup(x => x.GetPlanAsync("missing")).ReturnsAsync((Plan?)null);

        // Act
        var result = await _controller.DeletePlan("missing");

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task DeletePlan_Forbid_WhenDifferentUser()
    {
        // Arrange
        SetupUserClaims("user-1");
        var existing = new Plan { Id = "p1", UserId = "other-user", Name = "Other" };
        _dynamoDBServiceMock.Setup(x => x.GetPlanAsync("p1")).ReturnsAsync(existing);

        // Act
        var result = await _controller.DeletePlan("p1");

        // Assert
        Assert.IsType<ForbidResult>(result);
    }
}
