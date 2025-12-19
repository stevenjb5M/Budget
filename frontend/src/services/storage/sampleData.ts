/**
 * Sample data generator for offline-mode development
 */

import { User, Plan, Budget, Asset, Debt, Transaction } from './types';
import { v4 as uuidv4 } from 'uuid';

export class SampleDataGenerator {
  static generateUser(): User {
    return {
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  static generatePlans(userId: string, count: number = 3): Plan[] {
    const planNames = ['Conservative', 'Baseline', 'Optimistic'];
    return planNames.slice(0, count).map((name) => ({
      id: uuidv4(),
      userId,
      name,
      description: `${name} financial projection for the next 36 months`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
  }

  static generateAssets(userId: string, count: number = 3): Asset[] {
    const assets = [
      { name: 'Checking Account', type: 'bank', balance: 5000 },
      { name: 'Emergency Fund', type: 'savings', balance: 15000 },
      { name: 'Roth IRA', type: 'investment', balance: 45000 },
    ];
    return assets.slice(0, count).map((asset) => ({
      id: uuidv4(),
      userId,
      ...asset,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
  }

  static generateDebts(userId: string, count: number = 2): Debt[] {
    const debts = [
      { name: 'Student Loan', type: 'loan', balance: 25000, interestRate: 5.5 },
      { name: 'Credit Card', type: 'credit', balance: 3500, interestRate: 18.9 },
    ];
    return debts.slice(0, count).map((debt) => ({
      id: uuidv4(),
      userId,
      ...debt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
  }

  static generateBudgetsForPlan(
    planId: string,
    userId: string,
    months: number = 12
  ): Budget[] {
    const now = new Date();
    const budgets: Budget[] = [];

    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      budgets.push({
        id: uuidv4(),
        planId,
        userId,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        income: 5000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return budgets;
  }

  static generateTransactionsForBudget(
    budgetId: string,
    planId: string,
    userId: string,
    count: number = 5
  ): Transaction[] {
    const categories = ['Rent', 'Groceries', 'Utilities', 'Entertainment', 'Transport'];
    const transactions: Transaction[] = [];

    for (let i = 0; i < count; i++) {
      transactions.push({
        id: uuidv4(),
        budgetId,
        planId,
        userId,
        name: categories[i % categories.length],
        amount: Math.floor(Math.random() * 1000) + 100,
        category: categories[i % categories.length],
        type: 'expense',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return transactions;
  }

  /**
   * Generate complete sample dataset
   */
  static generateCompleteDataset() {
    const user = this.generateUser();
    const plans = this.generatePlans(user.id, 2);
    const assets = this.generateAssets(user.id, 3);
    const debts = this.generateDebts(user.id, 2);

    const budgets: Budget[] = [];
    const transactions: Transaction[] = [];

    for (const plan of plans) {
      const planBudgets = this.generateBudgetsForPlan(plan.id, user.id, 12);
      budgets.push(...planBudgets);

      for (const budget of planBudgets) {
        const budgetTransactions = this.generateTransactionsForBudget(
          budget.id,
          plan.id,
          user.id,
          5
        );
        transactions.push(...budgetTransactions);
      }
    }

    return {
      user,
      plans,
      budgets,
      assets,
      debts,
      transactions,
    };
  }
}
