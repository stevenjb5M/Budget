using Amazon.DynamoDBv2.DataModel;

namespace BudgetPlanner.Models;

/// <summary>
/// Represents a user authenticated via Amazon Cognito
/// </summary>
[DynamoDBTable("BudgetPlanner-Users")]
public class User
{
    [DynamoDBHashKey]
    public string? Id { get; set; } // Cognito User ID

    [DynamoDBProperty]
    public string? Email { get; set; }

    [DynamoDBProperty]
    public string? DisplayName { get; set; }

    [DynamoDBProperty]
    public DateTime Birthday { get; set; }

    [DynamoDBProperty]
    public int RetirementAge { get; set; }

    [DynamoDBProperty]
    public DateTime CreatedAt { get; set; }

    [DynamoDBProperty]
    public DateTime UpdatedAt { get; set; }
}
