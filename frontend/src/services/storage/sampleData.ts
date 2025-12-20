/**
 * Sample data generator for offline-mode development
 */

import { User, Plan, Budget, Asset, Debt, Transaction } from './types';
import { v4 as uuidv4 } from 'uuid';

export class SampleDataGenerator {
  static generateUser(): User {
    const now = new Date().toISOString();
    return {
      id: 'user-1',
      displayName: 'Test User',
      email: 'user@example.com',
      birthdayString: '1990-05-15T00:00:00Z', // Age ~34
      retirementAge: 67,
      createdAt: now,
      updatedAt: now,
    };
  }

  static generatePlans(userId: string, count: number = 3): Plan[] {
    const planNames = ['Conservative', 'Baseline', 'Optimistic'];
    const now = new Date().toISOString();
    return planNames.slice(0, count).map((name) => ({
      id: uuidv4(),
      userId,
      name,
      description: `${name} financial projection`,
      createdAt: now,
      updatedAt: now,
    }));
  }

  static generateAssets(userId: string, count: number = 3): Asset[] {
    const assets = [
      { name: 'Checking Account', currentValue: 5000, annualAPY: 0.5 },
      { name: 'Emergency Fund', currentValue: 15000, annualAPY: 4.5 },
      { name: 'Roth IRA', currentValue: 45000, annualAPY: 7.0 },
    ];
    const now = new Date().toISOString();
    return assets.slice(0, count).map((asset) => ({
      id: uuidv4(),
      userId,
      ...asset,
      notes: undefined,
      createdAt: now,
      updatedAt: now,
    }));
  }

  static generateDebts(userId: string, count: number = 2): Debt[] {
    const debts = [
      { name: 'Student Loan', currentBalance: 25000, interestRate: 5.5, minimumPayment: 250 },
      { name: 'Credit Card', currentBalance: 3500, interestRate: 18.9, minimumPayment: 100 },
    ];
    const now = new Date().toISOString();
    return debts.slice(0, count).map((debt) => ({
      id: uuidv4(),
      userId,
      ...debt,
      notes: undefined,
      createdAt: now,
      updatedAt: now,
    }));
  }

  static generateBudgetsForPlan(
    userId: string,
    count: number = 2
  ): Budget[] {
    const budgetNames = ['Monthly Budget', 'Quarterly Review', 'Annual Plan'];
    const now = new Date().toISOString();
    return budgetNames.slice(0, count).map((name) => ({
      id: uuidv4(),
      userId,
      name,
      isActive: true,
      income: [
        { id: uuidv4(), name: 'Salary', amount: 5000, category: 'Income' },
        { id: uuidv4(), name: 'Bonus', amount: 1000, category: 'Income' },
      ],
      expenses: [
        { id: uuidv4(), name: 'Rent', amount: 1500, category: 'Housing', type: 'regular' },
        { id: uuidv4(), name: 'Groceries', amount: 400, category: 'Food', type: 'regular' },
        { id: uuidv4(), name: 'Utilities', amount: 200, category: 'Utilities', type: 'regular' },
      ],
      createdAt: now,
      updatedAt: now,
    }));
  }

  static generateTransactionsForBudget(
    budgetId: string,
    userId: string,
    count: number = 5
  ): Transaction[] {
    const categories = ['Rent', 'Groceries', 'Utilities', 'Entertainment', 'Transport'];
    const now = new Date().toISOString();
    const transactions: Transaction[] = [];

    for (let i = 0; i < count; i++) {
      transactions.push({
        id: uuidv4(),
        budgetId,
        planId: 'plan-1',
        userId,
        name: categories[i % categories.length],
        amount: Math.floor(Math.random() * 1000) + 100,
        category: categories[i % categories.length],
        type: 'expense',
        createdAt: now,
        updatedAt: now,
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
    const budgets = this.generateBudgetsForPlan(user.id, 2);

    const transactions: Transaction[] = [];
    for (const budget of budgets) {
      const budgetTransactions = this.generateTransactionsForBudget(budget.id, user.id, 5);
      transactions.push(...budgetTransactions);
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
