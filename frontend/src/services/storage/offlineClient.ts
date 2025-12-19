/**
 * Offline-mode API client - replaces network calls with local storage queries
 */

import { getStorage } from './index';
import { User, Plan, Budget, Asset, Debt, Transaction } from './types';

class OfflineModeClient {
  private store: ReturnType<typeof getStorage> | null = null;

  private getStore() {
    if (!this.store) {
      this.store = getStorage();
    }
    return this.store;
  }

  // Users
  async getCurrentUser(): Promise<User> {
    const store = this.getStore();
    const users = await store.all<User>('users');
    if (users.length === 0) {
      throw new Error('No user found in local storage');
    }
    return users[0];
  }

  async updateUser(user: User): Promise<User> {
    const updatedUser = {
      ...user,
      updatedAt: Date.now(),
    };
    await this.getStore().put('users', updatedUser);
    return updatedUser;
  }

  // Plans
  async getPlans(userId: string): Promise<Plan[]> {
    return this.getStore().query<Plan>('plans', (p) => p.userId === userId);
  }

  async getPlan(id: string): Promise<Plan> {
    const plan = await this.getStore().get<Plan>('plans', id);
    if (!plan) throw new Error(`Plan not found: ${id}`);
    return plan;
  }

  async createPlan(plan: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>): Promise<Plan> {
    const newPlan: Plan = {
      ...plan,
      id: this.generateId('plan'),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await this.getStore().put('plans', newPlan);
    return newPlan;
  }

  async updatePlan(plan: Plan): Promise<Plan> {
    const updatedPlan = { ...plan, updatedAt: Date.now() };
    await this.getStore().put('plans', updatedPlan);
    return updatedPlan;
  }

  async deletePlan(id: string): Promise<void> {
    await this.getStore().delete('plans', id);
    // Cascade delete: remove related budgets and transactions
    const budgets = await this.getStore().query<Budget>('budgets', (b) => b.planId === id);
    for (const budget of budgets) {
      await this.deleteBudget(budget.id);
    }
  }

  // Budgets
  async getBudgets(userId: string, planId?: string): Promise<Budget[]> {
    return this.getStore().query<Budget>('budgets', (b) =>
      planId ? b.userId === userId && b.planId === planId : b.userId === userId
    );
  }

  async getBudget(id: string): Promise<Budget> {
    const budget = await this.getStore().get<Budget>('budgets', id);
    if (!budget) throw new Error(`Budget not found: ${id}`);
    return budget;
  }

  async createBudget(
    budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Budget> {
    const newBudget: Budget = {
      ...budget,
      id: this.generateId('budget'),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await this.getStore().put('budgets', newBudget);
    return newBudget;
  }

  async updateBudget(budget: Budget): Promise<Budget> {
    const updatedBudget = { ...budget, updatedAt: Date.now() };
    await this.getStore().put('budgets', updatedBudget);
    return updatedBudget;
  }

  async deleteBudget(id: string): Promise<void> {
    await this.getStore().delete('budgets', id);
    // Cascade delete: remove related transactions
    const transactions = await this.getStore().query<Transaction>(
      'transactions',
      (t) => t.budgetId === id
    );
    for (const transaction of transactions) {
      await this.getStore().delete('transactions', transaction.id);
    }
  }

  // Assets
  async getAssets(userId: string): Promise<Asset[]> {
    return this.getStore().query<Asset>('assets', (a) => a.userId === userId);
  }

  async getAsset(id: string): Promise<Asset> {
    const asset = await this.getStore().get<Asset>('assets', id);
    if (!asset) throw new Error(`Asset not found: ${id}`);
    return asset;
  }

  async createAsset(
    asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Asset> {
    const newAsset: Asset = {
      ...asset,
      id: this.generateId('asset'),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await this.getStore().put('assets', newAsset);
    return newAsset;
  }

  async updateAsset(asset: Asset): Promise<Asset> {
    const updatedAsset = { ...asset, updatedAt: Date.now() };
    await this.getStore().put('assets', updatedAsset);
    return updatedAsset;
  }

  async deleteAsset(id: string): Promise<void> {
    await this.getStore().delete('assets', id);
  }

  // Debts
  async getDebts(userId: string): Promise<Debt[]> {
    return this.getStore().query<Debt>('debts', (d) => d.userId === userId);
  }

  async getDebt(id: string): Promise<Debt> {
    const debt = await this.getStore().get<Debt>('debts', id);
    if (!debt) throw new Error(`Debt not found: ${id}`);
    return debt;
  }

  async createDebt(
    debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Debt> {
    const newDebt: Debt = {
      ...debt,
      id: this.generateId('debt'),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await this.getStore().put('debts', newDebt);
    return newDebt;
  }

  async updateDebt(debt: Debt): Promise<Debt> {
    const updatedDebt = { ...debt, updatedAt: Date.now() };
    await this.getStore().put('debts', updatedDebt);
    return updatedDebt;
  }

  async deleteDebt(id: string): Promise<void> {
    await this.getStore().delete('debts', id);
  }

  // Transactions
  async getTransactions(userId: string, budgetId?: string): Promise<Transaction[]> {
    return this.getStore().query<Transaction>('transactions', (t) =>
      budgetId ? t.userId === userId && t.budgetId === budgetId : t.userId === userId
    );
  }

  async getTransaction(id: string): Promise<Transaction> {
    const transaction = await this.getStore().get<Transaction>('transactions', id);
    if (!transaction) throw new Error(`Transaction not found: ${id}`);
    return transaction;
  }

  async createTransaction(
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Transaction> {
    const newTransaction: Transaction = {
      ...transaction,
      id: this.generateId('transaction'),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await this.getStore().put('transactions', newTransaction);
    return newTransaction;
  }

  async updateTransaction(transaction: Transaction): Promise<Transaction> {
    const updatedTransaction = { ...transaction, updatedAt: Date.now() };
    await this.getStore().put('transactions', updatedTransaction);
    return updatedTransaction;
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.getStore().delete('transactions', id);
  }

  // Helper
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const offlineClient = new OfflineModeClient();
