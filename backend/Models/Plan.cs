namespace BudgetPlanner.Models;

/// <summary>
/// Represents a 3-year (36 month) financial plan with budgets, net worth, and asset projections
/// </summary>
public class Plan
{
    public string Id { get; set; } // UUID
    public string UserId { get; set; } // Owner of the plan
    public string Name { get; set; } // e.g., "Best Case", "Baseline", "Reduced Income"
    public string Description { get; set; }
    public DateTime StartDate { get; set; } // First month of the plan
    public DateTime EndDate { get; set; } // Last month (36 months later)
    public List<string> BudgetIds { get; set; } = new(); // References to Budget IDs
    public List<string> TransactionIds { get; set; } = new(); // References to Transaction IDs
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
