using BudgetPlanner.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BudgetPlanner.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PlansController : ControllerBase
{
    private readonly ILogger<PlansController> _logger;

    public PlansController(ILogger<PlansController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Get all plans for current user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Plan>>> GetPlans()
    {
        // TODO: Implement - query DynamoDB
        return Ok(new List<Plan>());
    }

    /// <summary>
    /// Get a specific plan
    /// </summary>
    [HttpGet("{planId}")]
    public async Task<ActionResult<Plan>> GetPlan(string planId)
    {
        // TODO: Implement - get from DynamoDB
        return Ok(new Plan());
    }

    /// <summary>
    /// Create a new plan
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Plan>> CreatePlan([FromBody] Plan plan)
    {
        // TODO: Implement - save to DynamoDB
        return CreatedAtAction(nameof(GetPlan), new { planId = plan.Id }, plan);
    }

    /// <summary>
    /// Update a plan
    /// </summary>
    [HttpPut("{planId}")]
    public async Task<ActionResult<Plan>> UpdatePlan(string planId, [FromBody] Plan plan)
    {
        // TODO: Implement - update DynamoDB
        return Ok(plan);
    }

    /// <summary>
    /// Delete a plan
    /// </summary>
    [HttpDelete("{planId}")]
    public async Task<IActionResult> DeletePlan(string planId)
    {
        // TODO: Implement - delete from DynamoDB
        return NoContent();
    }
}
