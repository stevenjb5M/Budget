using BudgetPlanner.Models;
using BudgetPlanner.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BudgetPlanner.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DebtsController : ControllerBase
{
    private readonly ILogger<DebtsController> _logger;
    private readonly IDynamoDBService _dynamoDBService;

    public DebtsController(ILogger<DebtsController> logger, IDynamoDBService dynamoDBService)
    {
        _logger = logger;
        _dynamoDBService = dynamoDBService;
    }

    private string GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value ?? "";
    }

    /// <summary>
    /// Get all debts for current user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Debt>>> GetDebts()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var debts = await _dynamoDBService.GetDebtsByUserAsync(userId);
        return Ok(debts);
    }

    /// <summary>
    /// Get a specific debt
    /// </summary>
    [HttpGet("{debtId}")]
    public async Task<ActionResult<Debt>> GetDebt(string debtId)
    {
        var debt = await _dynamoDBService.GetDebtAsync(debtId);
        if (debt == null)
        {
            return NotFound();
        }

        // Ensure the debt belongs to the current user
        var userId = GetUserId();
        if (debt.UserId != userId)
        {
            return Forbid();
        }

        return Ok(debt);
    }

    /// <summary>
    /// Create a new debt
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Debt>> CreateDebt([FromBody] Debt debt)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        debt.UserId = userId; // Set the user ID
        debt.Id = Guid.NewGuid().ToString(); // Generate new ID

        var createdDebt = await _dynamoDBService.CreateDebtAsync(debt);
        return CreatedAtAction(nameof(GetDebt), new { debtId = createdDebt.Id }, createdDebt);
    }

    /// <summary>
    /// Update a debt
    /// </summary>
    [HttpPut("{debtId}")]
    public async Task<ActionResult<Debt>> UpdateDebt(string debtId, [FromBody] Debt debt)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Verify the debt exists and belongs to the user
        var existingDebt = await _dynamoDBService.GetDebtAsync(debtId);
        if (existingDebt == null)
        {
            return NotFound();
        }

        if (existingDebt.UserId != userId)
        {
            return Forbid();
        }

        debt.Id = debtId; // Ensure ID matches
        debt.UserId = userId; // Ensure user ID matches

        var updatedDebt = await _dynamoDBService.UpdateDebtAsync(debt);
        return Ok(updatedDebt);
    }

    /// <summary>
    /// Delete a debt
    /// </summary>
    [HttpDelete("{debtId}")]
    public async Task<IActionResult> DeleteDebt(string debtId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Verify the debt exists and belongs to the user
        var existingDebt = await _dynamoDBService.GetDebtAsync(debtId);
        if (existingDebt == null)
        {
            return NotFound();
        }

        if (existingDebt.UserId != userId)
        {
            return Forbid();
        }

        await _dynamoDBService.DeleteDebtAsync(debtId);
        return NoContent();
    }
}
