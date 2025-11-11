using BudgetPlanner.Models;
using BudgetPlanner.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BudgetPlanner.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PlansController : ControllerBase
{
    private readonly ILogger<PlansController> _logger;
    private readonly IDynamoDBService _dynamoDBService;

    public PlansController(ILogger<PlansController> logger, IDynamoDBService dynamoDBService)
    {
        _logger = logger;
        _dynamoDBService = dynamoDBService;
    }

    private string GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value ?? "";
    }

    /// <summary>
    /// Get all plans for current user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Plan>>> GetPlans()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var plans = await _dynamoDBService.GetPlansByUserAsync(userId);
        return Ok(plans);
    }

    /// <summary>
    /// Get a specific plan
    /// </summary>
    [HttpGet("{planId}")]
    public async Task<ActionResult<Plan>> GetPlan(string planId)
    {
        var plan = await _dynamoDBService.GetPlanAsync(planId);
        if (plan == null)
        {
            return NotFound();
        }

        // Ensure the plan belongs to the current user
        var userId = GetUserId();
        if (plan.UserId != userId)
        {
            return Forbid();
        }

        return Ok(plan);
    }

    /// <summary>
    /// Create a new plan
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Plan>> CreatePlan([FromBody] Plan plan)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        plan.UserId = userId; // Set the user ID
        plan.Id = Guid.NewGuid().ToString(); // Generate new ID

        var createdPlan = await _dynamoDBService.CreatePlanAsync(plan);
        return CreatedAtAction(nameof(GetPlan), new { planId = createdPlan.Id }, createdPlan);
    }

    /// <summary>
    /// Update a plan
    /// </summary>
    [HttpPut("{planId}")]
    public async Task<ActionResult<Plan>> UpdatePlan(string planId, [FromBody] Plan plan)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Verify the plan exists and belongs to the user
        var existingPlan = await _dynamoDBService.GetPlanAsync(planId);
        if (existingPlan == null)
        {
            return NotFound();
        }

        if (existingPlan.UserId != userId)
        {
            return Forbid();
        }

        plan.Id = planId; // Ensure ID matches
        plan.UserId = userId; // Ensure user ID matches

        var updatedPlan = await _dynamoDBService.UpdatePlanAsync(plan);
        return Ok(updatedPlan);
    }

    /// <summary>
    /// Delete a plan
    /// </summary>
    [HttpDelete("{planId}")]
    public async Task<IActionResult> DeletePlan(string planId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Verify the plan exists and belongs to the user
        var existingPlan = await _dynamoDBService.GetPlanAsync(planId);
        if (existingPlan == null)
        {
            return NotFound();
        }

        if (existingPlan.UserId != userId)
        {
            return Forbid();
        }

        await _dynamoDBService.DeletePlanAsync(planId);
        return NoContent();
    }
}
