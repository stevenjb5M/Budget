using Amazon.DynamoDBv2.DataModel;

namespace BudgetPlanner.Models;

/// <summary>
/// Represents a savings or investment account
/// </summary>
[DynamoDBTable("BudgetPlanner-Assets")]
public class Asset
{
    [DynamoDBHashKey]
    public string? Id { get; set; } // UUID

    [DynamoDBGlobalSecondaryIndexHashKey("UserIndex")]
    public string? UserId { get; set; } // Owner

    [DynamoDBProperty]
    public string? Name { get; set; } // e.g., "Emergency Fund", "Roth IRA"

    [DynamoDBProperty]
    public decimal CurrentValue { get; set; }

    [DynamoDBProperty]
    public decimal AnnualAPY { get; set; } // Annual Percentage Yield

    [DynamoDBProperty]
    public string? Notes { get; set; }

    [DynamoDBProperty]
    public DateTime CreatedAt { get; set; }

    [DynamoDBProperty]
    public DateTime UpdatedAt { get; set; }

    [DynamoDBProperty]
    public long Version { get; set; } = 1; // Version number for this asset
}
