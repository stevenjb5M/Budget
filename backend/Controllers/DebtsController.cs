using BudgetPlanner.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BudgetPlanner.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DebtsController : ControllerBase
{
    private readonly ILogger<DebtsController> _logger;

    public DebtsController(ILogger<DebtsController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Get all debts for current user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Debt>>> GetDebts()
    {
        // TODO: Implement - query DynamoDB
        return Ok(new List<Debt>());
    }

    /// <summary>
    /// Get a specific debt
    /// </summary>
    [HttpGet("{debtId}")]
    public async Task<ActionResult<Debt>> GetDebt(string debtId)
    {
        // TODO: Implement - get from DynamoDB
        return Ok(new Debt());
    }

    /// <summary>
    /// Create a new debt
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Debt>> CreateDebt([FromBody] Debt debt)
    {
        // TODO: Implement - save to DynamoDB
        return CreatedAtAction(nameof(GetDebt), new { debtId = debt.Id }, debt);
    }

    /// <summary>
    /// Update a debt
    /// </summary>
    [HttpPut("{debtId}")]
    public async Task<ActionResult<Debt>> UpdateDebt(string debtId, [FromBody] Debt debt)
    {
        // TODO: Implement - update DynamoDB
        return Ok(debt);
    }

    /// <summary>
    /// Delete a debt
    /// </summary>
    [HttpDelete("{debtId}")]
    public async Task<IActionResult> DeleteDebt(string debtId)
    {
        // TODO: Implement - delete from DynamoDB
        return NoContent();
    }
}
