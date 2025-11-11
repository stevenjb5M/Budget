using Amazon.DynamoDBv2.DataModel;

namespace BudgetPlanner.Models;

/// <summary>
/// Represents a financial plan with monthly projections
/// </summary>
[DynamoDBTable("BudgetPlanner-Plans")]
public class Plan
{
    [DynamoDBHashKey]
    public string? Id { get; set; } // UUID

    [DynamoDBGlobalSecondaryIndexHashKey("UserIndex")]
    public string? UserId { get; set; } // Owner of the plan

    [DynamoDBProperty]
    public string? Name { get; set; } // e.g., "5-Year Financial Plan"

    [DynamoDBProperty]
    public string? Description { get; set; }

    [DynamoDBProperty]
    public bool IsActive { get; set; }

    [DynamoDBProperty]
    public List<PlanMonth> Months { get; set; } = new();

    [DynamoDBProperty]
    public DateTime CreatedAt { get; set; }

    [DynamoDBProperty]
    public DateTime UpdatedAt { get; set; }

    [DynamoDBProperty]
    public long Version { get; set; } = 1; // Version number for this plan
}

public class PlanMonth
{
    [DynamoDBProperty]
    public string? Month { get; set; } // YYYY-MM format

    [DynamoDBProperty]
    public string? BudgetId { get; set; }

    [DynamoDBProperty]
    public decimal NetWorth { get; set; }
}
