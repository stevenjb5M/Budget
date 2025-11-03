namespace BudgetPlanner.Models;

/// <summary>
/// Represents a one-off income or expense for a specific month in a plan
/// </summary>
public class Transaction
{
    public string Id { get; set; } // UUID
    public string PlanId { get; set; } // Associated plan
    public string Name { get; set; } // Description
    public decimal Amount { get; set; } // Positive for income, negative for expense
    public DateTime Month { get; set; } // The month this transaction applies to
    public string Type { get; set; } // "Income" or "Expense"
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
