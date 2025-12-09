using Amazon.DynamoDBv2.DataModel;

namespace BudgetPlanner.Models;

/// <summary>
/// Tracks global version numbers for user data synchronization
/// </summary>
[DynamoDBTable(Constants.UserVersionsTable)]
public class UserVersion
{
    [DynamoDBHashKey]
    public string? UserId { get; set; } // Cognito User ID

    [DynamoDBProperty]
    public long GlobalVersion { get; set; } = Constants.InitialVersion; // Global version for all user data

    [DynamoDBProperty]
    public long BudgetsVersion { get; set; } = Constants.InitialVersion; // Latest version of budgets

    [DynamoDBProperty]
    public long PlansVersion { get; set; } = Constants.InitialVersion; // Latest version of plans

    [DynamoDBProperty]
    public long AssetsVersion { get; set; } = Constants.InitialVersion; // Latest version of assets

    [DynamoDBProperty]
    public long DebtsVersion { get; set; } = Constants.InitialVersion; // Latest version of debts

    [DynamoDBProperty]
    public DateTime LastUpdated { get; set; }

    [DynamoDBProperty]
    public DateTime CreatedAt { get; set; }
}