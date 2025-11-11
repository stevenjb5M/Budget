using BudgetPlanner.Models;
using BudgetPlanner.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BudgetPlanner.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BudgetsController : ControllerBase
{
    private readonly ILogger<BudgetsController> _logger;
    private readonly IDynamoDBService _dynamoDBService;

    public BudgetsController(ILogger<BudgetsController> logger, IDynamoDBService dynamoDBService)
    {
        _logger = logger;
        _dynamoDBService = dynamoDBService;
    }

    private string GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value ?? "";
    }

    /// <summary>
    /// Get all budgets for current user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Budget>>> GetBudgets()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var budgets = await _dynamoDBService.GetBudgetsByUserAsync(userId);
        return Ok(budgets);
    }

    /// <summary>
    /// Get a specific budget
    /// </summary>
    [HttpGet("{budgetId}")]
    public async Task<ActionResult<Budget>> GetBudget(string budgetId)
    {
        var budget = await _dynamoDBService.GetBudgetAsync(budgetId);
        if (budget == null)
        {
            return NotFound();
        }

        // Ensure the budget belongs to the current user
        var userId = GetUserId();
        if (budget.UserId != userId)
        {
            return Forbid();
        }

        return Ok(budget);
    }

    /// <summary>
    /// Create a new budget
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Budget>> CreateBudget([FromBody] Budget budget)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        budget.UserId = userId; // Set the user ID
        budget.Id = Guid.NewGuid().ToString(); // Generate new ID

        var createdBudget = await _dynamoDBService.CreateBudgetAsync(budget);
        return CreatedAtAction(nameof(GetBudget), new { budgetId = createdBudget.Id }, createdBudget);
    }

    /// <summary>
    /// Update a budget
    /// </summary>
    [HttpPut("{budgetId}")]
    public async Task<ActionResult<Budget>> UpdateBudget(string budgetId, [FromBody] Budget budget)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Verify the budget exists and belongs to the user
        var existingBudget = await _dynamoDBService.GetBudgetAsync(budgetId);
        if (existingBudget == null)
        {
            return NotFound();
        }

        if (existingBudget.UserId != userId)
        {
            return Forbid();
        }

        budget.Id = budgetId; // Ensure ID matches
        budget.UserId = userId; // Ensure user ID matches

        var updatedBudget = await _dynamoDBService.UpdateBudgetAsync(budget);
        return Ok(updatedBudget);
    }

    /// <summary>
    /// Delete a budget
    /// </summary>
    [HttpDelete("{budgetId}")]
    public async Task<IActionResult> DeleteBudget(string budgetId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Verify the budget exists and belongs to the user
        var existingBudget = await _dynamoDBService.GetBudgetAsync(budgetId);
        if (existingBudget == null)
        {
            return NotFound();
        }

        if (existingBudget.UserId != userId)
        {
            return Forbid();
        }

        await _dynamoDBService.DeleteBudgetAsync(budgetId);
        return NoContent();
    }
}
