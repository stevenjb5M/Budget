namespace BudgetPlanner.Models;

/// <summary>
/// Represents a savings or investment account
/// </summary>
public class Asset
{
    public string Id { get; set; } // UUID
    public string UserId { get; set; } // Owner
    public string Name { get; set; } // e.g., "Emergency Fund", "Roth IRA"
    public decimal CurrentValue { get; set; }
    public decimal AnnualAPY { get; set; } // Annual Percentage Yield
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
