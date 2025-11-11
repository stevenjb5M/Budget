using BudgetPlanner.Models;
using BudgetPlanner.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BudgetPlanner.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssetsController : ControllerBase
{
    private readonly ILogger<AssetsController> _logger;
    private readonly IDynamoDBService _dynamoDBService;

    public AssetsController(ILogger<AssetsController> logger, IDynamoDBService dynamoDBService)
    {
        _logger = logger;
        _dynamoDBService = dynamoDBService;
    }

    private string GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value ?? "";
    }

    /// <summary>
    /// Get all assets for current user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Asset>>> GetAssets()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var assets = await _dynamoDBService.GetAssetsByUserAsync(userId);
        return Ok(assets);
    }

    /// <summary>
    /// Get a specific asset
    /// </summary>
    [HttpGet("{assetId}")]
    public async Task<ActionResult<Asset>> GetAsset(string assetId)
    {
        var asset = await _dynamoDBService.GetAssetAsync(assetId);
        if (asset == null)
        {
            return NotFound();
        }

        // Ensure the asset belongs to the current user
        var userId = GetUserId();
        if (asset.UserId != userId)
        {
            return Forbid();
        }

        return Ok(asset);
    }

    /// <summary>
    /// Create a new asset
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Asset>> CreateAsset([FromBody] Asset asset)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        asset.UserId = userId; // Set the user ID
        asset.Id = Guid.NewGuid().ToString(); // Generate new ID

        var createdAsset = await _dynamoDBService.CreateAssetAsync(asset);
        return CreatedAtAction(nameof(GetAsset), new { assetId = createdAsset.Id }, createdAsset);
    }

    /// <summary>
    /// Update an asset
    /// </summary>
    [HttpPut("{assetId}")]
    public async Task<ActionResult<Asset>> UpdateAsset(string assetId, [FromBody] Asset asset)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Verify the asset exists and belongs to the user
        var existingAsset = await _dynamoDBService.GetAssetAsync(assetId);
        if (existingAsset == null)
        {
            return NotFound();
        }

        if (existingAsset.UserId != userId)
        {
            return Forbid();
        }

        asset.Id = assetId; // Ensure ID matches
        asset.UserId = userId; // Ensure user ID matches

        var updatedAsset = await _dynamoDBService.UpdateAssetAsync(asset);
        return Ok(updatedAsset);
    }

    /// <summary>
    /// Delete an asset
    /// </summary>
    [HttpDelete("{assetId}")]
    public async Task<IActionResult> DeleteAsset(string assetId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Verify the asset exists and belongs to the user
        var existingAsset = await _dynamoDBService.GetAssetAsync(assetId);
        if (existingAsset == null)
        {
            return NotFound();
        }

        if (existingAsset.UserId != userId)
        {
            return Forbid();
        }

        await _dynamoDBService.DeleteAssetAsync(assetId);
        return NoContent();
    }
}
