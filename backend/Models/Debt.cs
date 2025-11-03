namespace BudgetPlanner.Models;

/// <summary>
/// Represents a loan or credit account
/// </summary>
public class Debt
{
    public string Id { get; set; } // UUID
    public string UserId { get; set; } // Owner
    public string Name { get; set; } // e.g., "Student Loan", "Credit Card", "Car Loan"
    public decimal CurrentBalance { get; set; }
    public decimal AnnualInterestRate { get; set; } // Interest rate as a percentage
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
