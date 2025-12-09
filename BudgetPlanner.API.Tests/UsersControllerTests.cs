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

public class UsersControllerTests
{
    private readonly Mock<ILogger<UsersController>> _loggerMock;
    private readonly Mock<IDynamoDBService> _dynamoDBServiceMock;
    private readonly UsersController _controller;

    public UsersControllerTests()
    {
        _loggerMock = new Mock<ILogger<UsersController>>();
        _dynamoDBServiceMock = new Mock<IDynamoDBService>();
        _controller = new UsersController(_loggerMock.Object, _dynamoDBServiceMock.Object);
    }

    private void SetupUserClaims(string userId = "test-user-id", string email = "test@example.com", string name = "Test User")
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim("email", email),
            new Claim("name", name),
            new Claim("birthdate", "1990-05-15")
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    [Fact]
    public async Task GetCurrentUser_WithValidUserId_ReturnsExistingUser()
    {
        // Arrange
        SetupUserClaims();
        var expectedUser = new User
        {
            Id = "test-user-id",
            Email = "test@example.com",
            DisplayName = "Test User",
            BirthdayString = "1990-05-15",
            RetirementAge = 65
        };

        _dynamoDBServiceMock.Setup(x => x.GetUserAsync("test-user-id"))
            .ReturnsAsync(expectedUser);

        // Act
        var result = await _controller.GetCurrentUser();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var user = Assert.IsType<User>(okResult.Value);
        Assert.Equal("test-user-id", user.Id);
        Assert.Equal("test@example.com", user.Email);
        Assert.Equal("Test User", user.DisplayName);
    }

    [Fact]
    public async Task GetCurrentUser_WithNonExistentUser_CreatesNewUser()
    {
        // Arrange
        SetupUserClaims();
        _dynamoDBServiceMock.Setup(x => x.GetUserAsync("test-user-id"))
            .ReturnsAsync((User?)null);

        var createdUser = new User
        {
            Id = "test-user-id",
            Email = "test@example.com",
            DisplayName = "Test User",
            BirthdayString = "1990-05-15",
            RetirementAge = 65
        };

        _dynamoDBServiceMock.Setup(x => x.CreateUserAsync(It.IsAny<User>()))
            .ReturnsAsync(createdUser);

        // Act
        var result = await _controller.GetCurrentUser();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var user = Assert.IsType<User>(okResult.Value);
        Assert.Equal("test-user-id", user.Id);
        Assert.Equal("test@example.com", user.Email);
        Assert.Equal("Test User", user.DisplayName);
        Assert.Equal("1990-05-15", user.BirthdayString);

        _dynamoDBServiceMock.Verify(x => x.CreateUserAsync(It.Is<User>(u =>
            u.Id == "test-user-id" &&
            u.Email == "test@example.com" &&
            u.DisplayName == "Test User" &&
            u.BirthdayString == "1990-05-15" &&
            u.RetirementAge == 65)), Times.Once);
    }

    [Fact]
    public async Task GetCurrentUser_WithMissingUserId_ReturnsUnauthorized()
    {
        // Arrange
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
        };

        // Act
        var result = await _controller.GetCurrentUser();

        // Assert
        Assert.IsType<UnauthorizedResult>(result.Result);
    }

    [Fact]
    public async Task GetCurrentUser_WithSubClaim_ReturnsUser()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim("sub", "test-user-id"),
            new Claim("email", "test@example.com"),
            new Claim("name", "Test User")
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        var expectedUser = new User
        {
            Id = "test-user-id",
            Email = "test@example.com",
            DisplayName = "Test User"
        };

        _dynamoDBServiceMock.Setup(x => x.GetUserAsync("test-user-id"))
            .ReturnsAsync(expectedUser);

        // Act
        var result = await _controller.GetCurrentUser();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var user = Assert.IsType<User>(okResult.Value);
        Assert.Equal("test-user-id", user.Id);
    }

    [Fact]
    public async Task GetCurrentUser_WithCustomBirthdayClaim_ParsesCorrectly()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "test-user-id"),
            new Claim("email", "test@example.com"),
            new Claim("name", "Test User"),
            new Claim("custom:birthday", "1985-12-25")
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        _dynamoDBServiceMock.Setup(x => x.GetUserAsync("test-user-id"))
            .ReturnsAsync((User?)null);

        var createdUser = new User
        {
            Id = "test-user-id",
            Email = "test@example.com",
            DisplayName = "Test User",
            BirthdayString = "1985-12-25",
            RetirementAge = 65
        };

        _dynamoDBServiceMock.Setup(x => x.CreateUserAsync(It.IsAny<User>()))
            .ReturnsAsync(createdUser);

        // Act
        var result = await _controller.GetCurrentUser();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var user = Assert.IsType<User>(okResult.Value);
        Assert.Equal("1985-12-25", user.BirthdayString);
    }

    [Fact]
    public async Task GetCurrentUser_WithGivenNameClaim_UsesGivenName()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "test-user-id"),
            new Claim("email", "test@example.com"),
            new Claim("given_name", "John"),
            new Claim("family_name", "Doe")
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        _dynamoDBServiceMock.Setup(x => x.GetUserAsync("test-user-id"))
            .ReturnsAsync((User?)null);

        var createdUser = new User
        {
            Id = "test-user-id",
            Email = "test@example.com",
            DisplayName = "John",
            RetirementAge = 65
        };

        _dynamoDBServiceMock.Setup(x => x.CreateUserAsync(It.IsAny<User>()))
            .ReturnsAsync(createdUser);

        // Act
        var result = await _controller.GetCurrentUser();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var user = Assert.IsType<User>(okResult.Value);
        Assert.Equal("John", user.DisplayName);
    }

    [Fact]
    public async Task UpdateCurrentUser_WithValidData_UpdatesUser()
    {
        // Arrange
        SetupUserClaims();
        var userToUpdate = new User
        {
            Id = "test-user-id",
            Email = "updated@example.com",
            DisplayName = "Updated User",
            RetirementAge = 70
        };

        var updatedUser = new User
        {
            Id = "test-user-id",
            Email = "updated@example.com",
            DisplayName = "Updated User",
            RetirementAge = 70,
            UpdatedAt = DateTime.UtcNow
        };

        _dynamoDBServiceMock.Setup(x => x.UpdateUserAsync(It.IsAny<User>()))
            .ReturnsAsync(updatedUser);

        // Act
        var result = await _controller.UpdateCurrentUser(userToUpdate);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var user = Assert.IsType<User>(okResult.Value);
        Assert.Equal("test-user-id", user.Id); // Should be overridden by authenticated user ID
        Assert.Equal("updated@example.com", user.Email);
        Assert.Equal("Updated User", user.DisplayName);
        Assert.Equal(70, user.RetirementAge);

        _dynamoDBServiceMock.Verify(x => x.UpdateUserAsync(It.Is<User>(u =>
            u.Id == "test-user-id" &&
            u.Email == "updated@example.com" &&
            u.DisplayName == "Updated User" &&
            u.RetirementAge == 70 &&
            u.UpdatedAt != default)), Times.Once);
    }

    [Fact]
    public async Task UpdateCurrentUser_WithMissingUserId_ReturnsUnauthorized()
    {
        // Arrange
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
        };

        var userToUpdate = new User { Email = "test@example.com" };

        // Act
        var result = await _controller.UpdateCurrentUser(userToUpdate);

        // Assert
        Assert.IsType<UnauthorizedResult>(result.Result);
    }

    [Fact]
    public async Task GetUserVersions_WithValidUserId_ReturnsExistingVersion()
    {
        // Arrange
        SetupUserClaims();
        var expectedVersion = new UserVersion
        {
            UserId = "test-user-id",
            GlobalVersion = 5,
            BudgetsVersion = 3,
            PlansVersion = 2,
            AssetsVersion = 4,
            DebtsVersion = 1
        };

        _dynamoDBServiceMock.Setup(x => x.GetUserVersionAsync("test-user-id"))
            .ReturnsAsync(expectedVersion);

        // Act
        var result = await _controller.GetUserVersions();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var version = Assert.IsType<UserVersion>(okResult.Value);
        Assert.Equal("test-user-id", version.UserId);
        Assert.Equal(5, version.GlobalVersion);
        Assert.Equal(3, version.BudgetsVersion);
        Assert.Equal(2, version.PlansVersion);
        Assert.Equal(4, version.AssetsVersion);
        Assert.Equal(1, version.DebtsVersion);
    }

    [Fact]
    public async Task GetUserVersions_WithNonExistentVersion_CreatesNewVersion()
    {
        // Arrange
        SetupUserClaims();
        _dynamoDBServiceMock.Setup(x => x.GetUserVersionAsync("test-user-id"))
            .ReturnsAsync((UserVersion?)null);

        var createdVersion = new UserVersion
        {
            UserId = "test-user-id",
            GlobalVersion = Constants.InitialVersion,
            BudgetsVersion = Constants.InitialVersion,
            PlansVersion = Constants.InitialVersion,
            AssetsVersion = Constants.InitialVersion,
            DebtsVersion = Constants.InitialVersion
        };

        _dynamoDBServiceMock.Setup(x => x.CreateUserVersionAsync(It.IsAny<UserVersion>()))
            .ReturnsAsync(createdVersion);

        // Act
        var result = await _controller.GetUserVersions();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var version = Assert.IsType<UserVersion>(okResult.Value);
        Assert.Equal("test-user-id", version.UserId);
        Assert.Equal(1, version.GlobalVersion);
        Assert.Equal(1, version.BudgetsVersion);
        Assert.Equal(1, version.PlansVersion);
        Assert.Equal(1, version.AssetsVersion);
        Assert.Equal(1, version.DebtsVersion);

        _dynamoDBServiceMock.Verify(x => x.CreateUserVersionAsync(It.Is<UserVersion>(v =>
            v.UserId == "test-user-id" &&
            v.GlobalVersion == 1 &&
            v.BudgetsVersion == 1 &&
            v.PlansVersion == 1 &&
            v.AssetsVersion == 1 &&
            v.DebtsVersion == 1)), Times.Once);
    }

    [Fact]
    public async Task GetUserVersions_WithMissingUserId_ReturnsUnauthorized()
    {
        // Arrange
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
        };

        // Act
        var result = await _controller.GetUserVersions();

        // Assert
        Assert.IsType<UnauthorizedResult>(result.Result);
    }
}