using BudgetPlanner.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BudgetPlanner.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly ILogger<UsersController> _logger;

    public UsersController(ILogger<UsersController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Get current user profile
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<User>> GetCurrentUser()
    {
        // TODO: Implement - get from DynamoDB
        return Ok(new User());
    }

    /// <summary>
    /// Update user profile
    /// </summary>
    [HttpPut("me")]
    public async Task<ActionResult<User>> UpdateCurrentUser([FromBody] User user)
    {
        // TODO: Implement - update in DynamoDB
        return Ok(user);
    }
}
