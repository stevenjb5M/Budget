namespace BudgetPlanner.Models;

/// <summary>
/// Represents a monthly budget with income sources and expense categories
/// </summary>
public class Budget
{
    public string Id { get; set; } // UUID
    public string UserId { get; set; } // Owner
    public string PlanId { get; set; } // Optional: associated plan
    public DateTime Month { get; set; } // The month this budget covers
    
    // Income data
    public List<IncomeItem> IncomeItems { get; set; } = new();
    public decimal TotalIncome { get; set; }
    
    // Expense data
    public List<ExpenseItem> ExpenseItems { get; set; } = new();
    public decimal TotalExpenses { get; set; }
    
    // Summary
    public decimal NetTotal => TotalIncome - TotalExpenses;
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class IncomeItem
{
    public string Id { get; set; }
    public string Name { get; set; } // e.g., "Salary", "Freelance"
    public decimal Amount { get; set; }
}

public class ExpenseItem
{
    public string Id { get; set; }
    public string Category { get; set; } // e.g., "Rent", "Food", "Utilities"
    public decimal Amount { get; set; }
}
