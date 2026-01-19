import { bedrockAPI } from '../api/client';
import { Budget } from '../types';

export interface BudgetFeedback {
  improvements: string[];
  strengths: string[];
  summary: string;
}

class BudgetFeedbackService {
  async getBudgetFeedback(budget: Budget): Promise<BudgetFeedback> {
    const totalIncome = budget.income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = budget.expenses.reduce((sum, item) => sum + item.amount, 0);

    const requestData = {
      budgetId: budget.id,
      budgetName: budget.name,
      income: budget.income,
      expenses: budget.expenses,
      totalIncome,
      totalExpenses,
    };

    const response = await bedrockAPI.getBudgetFeedback(requestData);
    return response.data;
  }
}

export const budgetFeedbackService = new BudgetFeedbackService();
