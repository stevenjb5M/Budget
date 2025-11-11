using BudgetPlanner.Models;
using BudgetPlanner.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BudgetPlanner.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly ILogger<UsersController> _logger;
    private readonly IDynamoDBService _dynamoDBService;

    public UsersController(ILogger<UsersController> logger, IDynamoDBService dynamoDBService)
    {
        _logger = logger;
        _dynamoDBService = dynamoDBService;
    }

    private string GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value ?? "";
    }

    /// <summary>
    /// Get current user profile
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<User>> GetCurrentUser()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var user = await _dynamoDBService.GetUserAsync(userId);
        if (user == null)
        {
            return NotFound();
        }

        return Ok(user);
    }

    /// <summary>
    /// Update user profile
    /// </summary>
    [HttpPut("me")]
    public async Task<ActionResult<User>> UpdateCurrentUser([FromBody] User user)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        user.Id = userId; // Ensure the ID matches the authenticated user
        var updatedUser = await _dynamoDBService.UpdateUserAsync(user);
        return Ok(updatedUser);
    }
}
