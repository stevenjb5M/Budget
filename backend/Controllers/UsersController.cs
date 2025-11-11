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
    /// Get current user profile (creates user if they don't exist)
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
            // User doesn't exist, create them automatically
            var claimsIdentity = User.Identity as ClaimsIdentity;
            var email = claimsIdentity?.FindFirst("email")?.Value ?? "";
            var name = claimsIdentity?.FindFirst("name")?.Value ??
                      claimsIdentity?.FindFirst("given_name")?.Value ?? "User";

            var newUser = new User
            {
                Id = userId,
                Email = email,
                DisplayName = name,
                Birthday = DateTime.Parse("1990-01-01"), // Default birthday
                RetirementAge = 65, // Default retirement age
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _logger.LogInformation($"Creating new user with ID: {userId}");
            user = await _dynamoDBService.CreateUserAsync(newUser);
            _logger.LogInformation($"Successfully created/retrieved user: {userId}");
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

    /// <summary>
    /// Get user version information for synchronization
    /// </summary>
    [HttpGet("versions")]
    public async Task<ActionResult<UserVersion>> GetUserVersions()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var userVersion = await _dynamoDBService.GetUserVersionAsync(userId);
        if (userVersion == null)
        {
            // Create initial version record if it doesn't exist
            userVersion = new UserVersion
            {
                UserId = userId,
                GlobalVersion = 1,
                BudgetsVersion = 1,
                PlansVersion = 1,
                AssetsVersion = 1,
                DebtsVersion = 1,
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };

            _logger.LogInformation($"Creating UserVersion for user: {userId}");
            userVersion = await _dynamoDBService.CreateUserVersionAsync(userVersion);
            _logger.LogInformation($"Successfully created/retrieved UserVersion for user: {userId}");
        }

        return Ok(userVersion);
    }
}
