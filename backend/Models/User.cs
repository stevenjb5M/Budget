namespace BudgetPlanner.Models;

/// <summary>
/// Represents a user authenticated via Amazon Cognito
/// </summary>
public class User
{
    public string Id { get; set; } // Cognito User ID
    public string Email { get; set; }
    public string DisplayName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
