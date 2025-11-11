using Amazon.DynamoDBv2.DataModel;
using BudgetPlanner.Models;

namespace BudgetPlanner.Services;

public interface IDynamoDBService
{
    // User operations
    Task<User?> GetUserAsync(string userId);
    Task<User> CreateUserAsync(User user);
    Task<User> UpdateUserAsync(User user);

    // Asset operations
    Task<List<Asset>> GetAssetsByUserAsync(string userId);
    Task<Asset?> GetAssetAsync(string assetId);
    Task<Asset> CreateAssetAsync(Asset asset);
    Task<Asset> UpdateAssetAsync(Asset asset);
    Task DeleteAssetAsync(string assetId);

    // Debt operations
    Task<List<Debt>> GetDebtsByUserAsync(string userId);
    Task<Debt?> GetDebtAsync(string debtId);
    Task<Debt> CreateDebtAsync(Debt debt);
    Task<Debt> UpdateDebtAsync(Debt debt);
    Task DeleteDebtAsync(string debtId);

    // Budget operations
    Task<List<Budget>> GetBudgetsByUserAsync(string userId);
    Task<Budget?> GetBudgetAsync(string budgetId);
    Task<Budget> CreateBudgetAsync(Budget budget);
    Task<Budget> UpdateBudgetAsync(Budget budget);
    Task DeleteBudgetAsync(string budgetId);

    // Plan operations
    Task<List<Plan>> GetPlansByUserAsync(string userId);
    Task<Plan?> GetPlanAsync(string planId);
    Task<Plan> CreatePlanAsync(Plan plan);
    Task<Plan> UpdatePlanAsync(Plan plan);
    Task DeletePlanAsync(string planId);
}