namespace BudgetPlanner;

public static class Constants
{
    // DynamoDB Table Names
    public const string UsersTable = "BudgetPlanner-Users";
    public const string PlansTable = "BudgetPlanner-Plans";
    public const string BudgetsTable = "BudgetPlanner-Budgets";
    public const string AssetsTable = "BudgetPlanner-Assets";
    public const string DebtsTable = "BudgetPlanner-Debts";
    public const string UserVersionsTable = "BudgetPlanner-UserVersions";

    // Default Values
    public const long InitialVersion = 1;
    public const string DefaultBirthday = "1990-01-01";
}