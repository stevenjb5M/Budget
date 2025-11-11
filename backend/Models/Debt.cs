using Amazon.DynamoDBv2.DataModel;

namespace BudgetPlanner.Models;

/// <summary>
/// Represents a loan or credit account
/// </summary>
[DynamoDBTable("BudgetPlanner-Debts")]
public class Debt
{
    [DynamoDBHashKey]
    public string? Id { get; set; } // UUID

    [DynamoDBGlobalSecondaryIndexHashKey("UserIndex")]
    public string? UserId { get; set; } // Owner

    [DynamoDBProperty]
    public string? Name { get; set; } // e.g., "Student Loan", "Credit Card", "Car Loan"

    [DynamoDBProperty]
    public decimal CurrentBalance { get; set; }

    [DynamoDBProperty]
    public decimal InterestRate { get; set; } // Interest rate as a percentage

    [DynamoDBProperty]
    public decimal MinimumPayment { get; set; }

    [DynamoDBProperty]
    public string? Notes { get; set; }

    [DynamoDBProperty]
    public DateTime CreatedAt { get; set; }

    [DynamoDBProperty]
    public DateTime UpdatedAt { get; set; }
}
