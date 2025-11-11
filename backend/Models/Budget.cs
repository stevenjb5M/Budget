using Amazon.DynamoDBv2.DataModel;

namespace BudgetPlanner.Models;

/// <summary>
/// Represents a monthly budget with income sources and expense categories
/// </summary>
[DynamoDBTable("BudgetPlanner-Budgets")]
public class Budget
{
    [DynamoDBHashKey]
    public string? Id { get; set; } // UUID

    [DynamoDBGlobalSecondaryIndexHashKey("UserIndex")]
    public string? UserId { get; set; } // Owner

    [DynamoDBProperty]
    public string? Name { get; set; }

    [DynamoDBProperty]
    public bool IsActive { get; set; }

    // Income data
    [DynamoDBProperty]
    public List<IncomeItem> Income { get; set; } = new();

    // Expense data
    [DynamoDBProperty]
    public List<ExpenseItem> Expenses { get; set; } = new();

    [DynamoDBProperty]
    public DateTime CreatedAt { get; set; }

    [DynamoDBProperty]
    public DateTime UpdatedAt { get; set; }
}

public class IncomeItem
{
    [DynamoDBProperty]
    public string? Id { get; set; }

    [DynamoDBProperty]
    public string? Name { get; set; } // e.g., "Salary", "Freelance"

    [DynamoDBProperty]
    public decimal Amount { get; set; }

    [DynamoDBProperty]
    public string? Category { get; set; }
}

public class ExpenseItem
{
    [DynamoDBProperty]
    public string? Id { get; set; }

    [DynamoDBProperty]
    public string? Name { get; set; }

    [DynamoDBProperty]
    public decimal Amount { get; set; }

    [DynamoDBProperty]
    public string? Category { get; set; }

    [DynamoDBProperty]
    public bool IsFixed { get; set; }
}
