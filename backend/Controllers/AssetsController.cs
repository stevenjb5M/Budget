using BudgetPlanner.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BudgetPlanner.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssetsController : ControllerBase
{
    private readonly ILogger<AssetsController> _logger;

    public AssetsController(ILogger<AssetsController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Get all assets for current user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Asset>>> GetAssets()
    {
        // TODO: Implement - query DynamoDB
        return Ok(new List<Asset>());
    }

    /// <summary>
    /// Get a specific asset
    /// </summary>
    [HttpGet("{assetId}")]
    public async Task<ActionResult<Asset>> GetAsset(string assetId)
    {
        // TODO: Implement - get from DynamoDB
        return Ok(new Asset());
    }

    /// <summary>
    /// Create a new asset
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Asset>> CreateAsset([FromBody] Asset asset)
    {
        // TODO: Implement - save to DynamoDB
        return CreatedAtAction(nameof(GetAsset), new { assetId = asset.Id }, asset);
    }

    /// <summary>
    /// Update an asset
    /// </summary>
    [HttpPut("{assetId}")]
    public async Task<ActionResult<Asset>> UpdateAsset(string assetId, [FromBody] Asset asset)
    {
        // TODO: Implement - update DynamoDB
        return Ok(asset);
    }

    /// <summary>
    /// Delete an asset
    /// </summary>
    [HttpDelete("{assetId}")]
    public async Task<IActionResult> DeleteAsset(string assetId)
    {
        // TODO: Implement - delete from DynamoDB
        return NoContent();
    }
}
