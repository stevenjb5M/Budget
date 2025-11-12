using Amazon.DynamoDBv2.DataModel;
using System.Globalization;
using System.Text.Json.Serialization;

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

    [DynamoDBProperty("Birthday")]
    public string? BirthdayString { get; set; } // Store as YYYY-MM-DD string to preserve date exactly
    
    [JsonIgnore]
    [DynamoDBIgnore]
    public DateTime Birthday 
    { 
        get 
        { 
            if (string.IsNullOrEmpty(BirthdayString))
            {
                return DateTime.Parse("1990-01-01");
            }
            // Parse the stored YYYY-MM-DD format
            if (DateTime.TryParse(BirthdayString, null, System.Globalization.DateTimeStyles.None, out var date))
            {
                return date;
            }
            return DateTime.Parse("1990-01-01");
        }
        set 
        { 
            // Ensure we only store the date portion as YYYY-MM-DD
            if (value.Kind == DateTimeKind.Utc)
            {
                // If it's UTC, convert to local first to get the correct date
                value = value.ToLocalTime();
            }
            BirthdayString = value.ToString("yyyy-MM-dd");
        }
    }

    [DynamoDBProperty]
    public int RetirementAge { get; set; }

    [DynamoDBProperty]
    public DateTime CreatedAt { get; set; }

    [DynamoDBProperty]
    public DateTime UpdatedAt { get; set; }

    [DynamoDBProperty]
    public long Version { get; set; } = 1; // Global version number for the user
}
