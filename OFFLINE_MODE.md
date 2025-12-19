# Offline Mode Branch

This branch implements a **completely local, offline-only version** of Budget Planner using IndexedDB for client-side data storage.

## Overview

- ✅ **No network required** - runs entirely in browser
- ✅ **IndexedDB storage** - persistent local database
- ✅ **Sample data included** - pre-populated on first run
- ✅ **Full CRUD operations** - create, read, update, delete everything locally
- ✅ **Cascade deletes** - removing a plan deletes related budgets/transactions
- ✅ **Type-safe API** - full TypeScript support

## What's Included

### Storage Layer (`frontend/src/services/storage/`)

- **`types.ts`** - Entity definitions and `IDataStore` interface
- **`indexeddb.ts`** - IndexedDB implementation
- **`index.ts`** - Storage initialization and factory
- **`sampleData.ts`** - Sample data generator for demo
- **`offlineClient.ts`** - Full API client using local storage

## Getting Started

### 1. Initialize Storage on App Load

In `frontend/src/main.tsx` or your main App component:

```typescript
import { initializeStorage } from './services/storage';

// On app startup
await initializeStorage();
```

### 2. Replace API Calls

Replace existing API client calls with the offline client:

```typescript
// Instead of:
import { apiClient } from './api/client';
const plans = await apiClient.getPlans(userId);

// Use:
import { offlineClient } from './services/storage/offlineClient';
const plans = await offlineClient.getPlans(userId);
```

### 3. First Run

The first time the app loads, it automatically populates IndexedDB with sample data:
- 1 user
- 2 plans (Conservative, Baseline)
- 3 assets (Checking, Emergency Fund, Roth IRA)
- 2 debts (Student Loan, Credit Card)
- 24 budgets (12 months × 2 plans)
- 120 transactions (5 per budget)

## API Reference

All methods are async and work with local storage:

```typescript
// Users
getCurrentUser(): Promise<User>
updateUser(user: User): Promise<User>

// Plans
getPlans(userId: string): Promise<Plan[]>
getPlan(id: string): Promise<Plan>
createPlan(plan: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>): Promise<Plan>
updatePlan(plan: Plan): Promise<Plan>
deletePlan(id: string): Promise<void>

// Budgets
getBudgets(userId: string, planId?: string): Promise<Budget[]>
getBudget(id: string): Promise<Budget>
createBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget>
updateBudget(budget: Budget): Promise<Budget>
deleteBudget(id: string): Promise<void>

// Assets
getAssets(userId: string): Promise<Asset[]>
getAsset(id: string): Promise<Asset>
createAsset(asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<Asset>
updateAsset(asset: Asset): Promise<Asset>
deleteAsset(id: string): Promise<void>

// Debts
getDebts(userId: string): Promise<Debt[]>
getDebt(id: string): Promise<Debt>
createDebt(debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>): Promise<Debt>
updateDebt(debt: Debt): Promise<Debt>
deleteDebt(id: string): Promise<void>

// Transactions
getTransactions(userId: string, budgetId?: string): Promise<Transaction[]>
getTransaction(id: string): Promise<Transaction>
createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction>
updateTransaction(transaction: Transaction): Promise<Transaction>
deleteTransaction(id: string): Promise<void>
```

## Storage Management

### Reset to Default Data

```typescript
import { resetStorage } from './services/storage';
await resetStorage();
```

### Clear All Data

```typescript
import { getStorage } from './services/storage';
await getStorage().clearAll();
```

### Check if Ready

```typescript
import { getStorage } from './services/storage';
const ready = await getStorage().isReady();
```

## Development Notes

### Data Structure

All entities follow this pattern:
- `id` - unique identifier
- `createdAt` - timestamp
- `updatedAt` - timestamp
- Type-specific fields (name, userId, etc.)

### Cascade Operations

- Deleting a **Plan** removes its Budgets and related Transactions
- Deleting a **Budget** removes its Transactions
- Deleting Assets/Debts is standalone (no cascade)

### No Sync

This branch is **intentionally offline-only** with no sync logic:
- No pending operations queue
- No conflict resolution
- No versioning
- No authentication

All data stays in browser storage.

## Next Steps

1. Swap API client usage throughout components
2. Update hooks to use `offlineClient` instead of `apiClient`
3. Test CRUD operations
4. Consider adding localStorage backup/export
5. Add UI for "reset to defaults" option

## Related

- Main branch: Production stack with Lambda + DynamoDB
- Original: ASP.NET Core backend
