using BudgetPlanner.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BudgetPlanner.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BudgetsController : ControllerBase
{
    private readonly ILogger<BudgetsController> _logger;

    public BudgetsController(ILogger<BudgetsController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Get all budgets for current user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Budget>>> GetBudgets()
    {
        // TODO: Implement - query DynamoDB
        return Ok(new List<Budget>());
    }

    /// <summary>
    /// Get a specific budget
    /// </summary>
    [HttpGet("{budgetId}")]
    public async Task<ActionResult<Budget>> GetBudget(string budgetId)
    {
        // TODO: Implement - get from DynamoDB
        return Ok(new Budget());
    }

    /// <summary>
    /// Create a new budget
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Budget>> CreateBudget([FromBody] Budget budget)
    {
        // TODO: Implement - save to DynamoDB
        return CreatedAtAction(nameof(GetBudget), new { budgetId = budget.Id }, budget);
    }

    /// <summary>
    /// Update a budget
    /// </summary>
    [HttpPut("{budgetId}")]
    public async Task<ActionResult<Budget>> UpdateBudget(string budgetId, [FromBody] Budget budget)
    {
        // TODO: Implement - update DynamoDB
        return Ok(budget);
    }

    /// <summary>
    /// Delete a budget
    /// </summary>
    [HttpDelete("{budgetId}")]
    public async Task<IActionResult> DeleteBudget(string budgetId)
    {
        // TODO: Implement - delete from DynamoDB
        return NoContent();
    }
}
