using Amazon.DynamoDBv2.DataModel;

namespace BudgetPlanner.Models;

/// <summary>
/// Tracks global version numbers for user data synchronization
/// </summary>
[DynamoDBTable("BudgetPlanner-UserVersions")]
public class UserVersion
{
    [DynamoDBHashKey]
    public string? UserId { get; set; } // Cognito User ID

    [DynamoDBProperty]
    public long GlobalVersion { get; set; } = 1; // Global version for all user data

    [DynamoDBProperty]
    public long BudgetsVersion { get; set; } = 1; // Latest version of budgets

    [DynamoDBProperty]
    public long PlansVersion { get; set; } = 1; // Latest version of plans

    [DynamoDBProperty]
    public long AssetsVersion { get; set; } = 1; // Latest version of assets

    [DynamoDBProperty]
    public long DebtsVersion { get; set; } = 1; // Latest version of debts

    [DynamoDBProperty]
    public DateTime LastUpdated { get; set; }

    [DynamoDBProperty]
    public DateTime CreatedAt { get; set; }
}