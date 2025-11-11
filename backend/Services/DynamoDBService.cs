using Amazon.DynamoDBv2.DataModel;
using BudgetPlanner.Models;

namespace BudgetPlanner.Services;

public class DynamoDBService : IDynamoDBService
{
    private readonly IDynamoDBContext _context;

    public DynamoDBService(IDynamoDBContext context)
    {
        _context = context;
    }

    // User operations
    public async Task<User?> GetUserAsync(string userId)
    {
        return await _context.LoadAsync<User>(userId);
    }

    public async Task<User> CreateUserAsync(User user)
    {
        user.CreatedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveAsync(user);
        return user;
    }

    public async Task<User> UpdateUserAsync(User user)
    {
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveAsync(user);
        return user;
    }

    // Asset operations
    public async Task<List<Asset>> GetAssetsByUserAsync(string userId)
    {
        var search = _context.QueryAsync<Asset>(userId, new DynamoDBOperationConfig
        {
            IndexName = "UserIndex"
        });
        return await search.GetRemainingAsync();
    }

    public async Task<Asset?> GetAssetAsync(string assetId)
    {
        return await _context.LoadAsync<Asset>(assetId);
    }

    public async Task<Asset> CreateAssetAsync(Asset asset)
    {
        asset.CreatedAt = DateTime.UtcNow;
        asset.UpdatedAt = DateTime.UtcNow;
        await _context.SaveAsync(asset);
        return asset;
    }

    public async Task<Asset> UpdateAssetAsync(Asset asset)
    {
        asset.UpdatedAt = DateTime.UtcNow;
        await _context.SaveAsync(asset);
        return asset;
    }

    public async Task DeleteAssetAsync(string assetId)
    {
        await _context.DeleteAsync<Asset>(assetId);
    }

    // Debt operations
    public async Task<List<Debt>> GetDebtsByUserAsync(string userId)
    {
        var search = _context.QueryAsync<Debt>(userId, new DynamoDBOperationConfig
        {
            IndexName = "UserIndex"
        });
        return await search.GetRemainingAsync();
    }

    public async Task<Debt?> GetDebtAsync(string debtId)
    {
        return await _context.LoadAsync<Debt>(debtId);
    }

    public async Task<Debt> CreateDebtAsync(Debt debt)
    {
        debt.CreatedAt = DateTime.UtcNow;
        debt.UpdatedAt = DateTime.UtcNow;
        await _context.SaveAsync(debt);
        return debt;
    }

    public async Task<Debt> UpdateDebtAsync(Debt debt)
    {
        debt.UpdatedAt = DateTime.UtcNow;
        await _context.SaveAsync(debt);
        return debt;
    }

    public async Task DeleteDebtAsync(string debtId)
    {
        await _context.DeleteAsync<Debt>(debtId);
    }

    // Budget operations
    public async Task<List<Budget>> GetBudgetsByUserAsync(string userId)
    {
        var search = _context.QueryAsync<Budget>(userId, new DynamoDBOperationConfig
        {
            IndexName = "UserIndex"
        });
        return await search.GetRemainingAsync();
    }

    public async Task<Budget?> GetBudgetAsync(string budgetId)
    {
        return await _context.LoadAsync<Budget>(budgetId);
    }

    public async Task<Budget> CreateBudgetAsync(Budget budget)
    {
        budget.CreatedAt = DateTime.UtcNow;
        budget.UpdatedAt = DateTime.UtcNow;
        await _context.SaveAsync(budget);
        return budget;
    }

    public async Task<Budget> UpdateBudgetAsync(Budget budget)
    {
        budget.UpdatedAt = DateTime.UtcNow;
        await _context.SaveAsync(budget);
        return budget;
    }

    public async Task DeleteBudgetAsync(string budgetId)
    {
        await _context.DeleteAsync<Budget>(budgetId);
    }

    // Plan operations
    public async Task<List<Plan>> GetPlansByUserAsync(string userId)
    {
        var search = _context.QueryAsync<Plan>(userId, new DynamoDBOperationConfig
        {
            IndexName = "UserIndex"
        });
        return await search.GetRemainingAsync();
    }

    public async Task<Plan?> GetPlanAsync(string planId)
    {
        return await _context.LoadAsync<Plan>(planId);
    }

    public async Task<Plan> CreatePlanAsync(Plan plan)
    {
        plan.CreatedAt = DateTime.UtcNow;
        plan.UpdatedAt = DateTime.UtcNow;
        await _context.SaveAsync(plan);
        return plan;
    }

    public async Task<Plan> UpdatePlanAsync(Plan plan)
    {
        plan.UpdatedAt = DateTime.UtcNow;
        await _context.SaveAsync(plan);
        return plan;
    }

    public async Task DeletePlanAsync(string planId)
    {
        await _context.DeleteAsync<Plan>(planId);
    }
}