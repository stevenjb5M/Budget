/**
 * API compatibility layer for offline mode
 * Wraps offlineClient to match the same interface as the HTTP API client
 * Returns axios-like response objects with .data property
 */

import { offlineClient } from './offlineClient';

interface ApiResponse<T> {
  data: T;
}

const wrapResponse = <T,>(data: T): ApiResponse<T> => ({
  data,
});

/**
 * Users API - matches plansAPI interface
 */
export const usersAPI = {
  getCurrentUser: async (): Promise<ApiResponse<any>> => {
    const user = await offlineClient.getCurrentUser();
    return wrapResponse(user);
  },

  updateCurrentUser: async (user: any): Promise<ApiResponse<any>> => {
    const updated = await offlineClient.updateUser(user);
    return wrapResponse(updated);
  },

  getUserVersions: async (): Promise<ApiResponse<any>> => {
    // For offline mode, just return empty versions
    return wrapResponse({ versions: {} });
  },
};

/**
 * Plans API - matches plansAPI interface
 */
export const plansAPI = {
  getPlans: async (): Promise<ApiResponse<any>> => {
    const user = await offlineClient.getCurrentUser();
    const plans = await offlineClient.getPlans(user.id);
    return wrapResponse(plans);
  },

  getPlan: async (planId: string): Promise<ApiResponse<any>> => {
    const plan = await offlineClient.getPlan(planId);
    return wrapResponse(plan);
  },

  createPlan: async (plan: any): Promise<ApiResponse<any>> => {
    const user = await offlineClient.getCurrentUser();
    const newPlan = await offlineClient.createPlan({
      ...plan,
      userId: user.id,
    });
    return wrapResponse(newPlan);
  },

  updatePlan: async (planId: string, plan: any): Promise<ApiResponse<any>> => {
    const updated = await offlineClient.updatePlan({ ...plan, id: planId });
    return wrapResponse(updated);
  },

  deletePlan: async (planId: string): Promise<ApiResponse<void>> => {
    await offlineClient.deletePlan(planId);
    return wrapResponse(undefined);
  },
};

/**
 * Budgets API - matches budgetsAPI interface
 */
export const budgetsAPI = {
  getBudgets: async (): Promise<ApiResponse<any>> => {
    const user = await offlineClient.getCurrentUser();
    const budgets = await offlineClient.getBudgets(user.id);
    return wrapResponse(budgets);
  },

  getBudget: async (budgetId: string): Promise<ApiResponse<any>> => {
    const budget = await offlineClient.getBudget(budgetId);
    return wrapResponse(budget);
  },

  createBudget: async (budget: any): Promise<ApiResponse<any>> => {
    const user = await offlineClient.getCurrentUser();
    const newBudget = await offlineClient.createBudget({
      ...budget,
      userId: user.id,
    });
    return wrapResponse(newBudget);
  },

  updateBudget: async (budgetId: string, budget: any): Promise<ApiResponse<any>> => {
    const updated = await offlineClient.updateBudget({ ...budget, id: budgetId });
    return wrapResponse(updated);
  },

  deleteBudget: async (budgetId: string): Promise<ApiResponse<void>> => {
    await offlineClient.deleteBudget(budgetId);
    return wrapResponse(undefined);
  },
};

/**
 * Assets API - matches assetsAPI interface
 */
export const assetsAPI = {
  getAssets: async (): Promise<ApiResponse<any>> => {
    const user = await offlineClient.getCurrentUser();
    const assets = await offlineClient.getAssets(user.id);
    return wrapResponse(assets);
  },

  getAsset: async (assetId: string): Promise<ApiResponse<any>> => {
    const asset = await offlineClient.getAsset(assetId);
    return wrapResponse(asset);
  },

  createAsset: async (asset: any): Promise<ApiResponse<any>> => {
    const user = await offlineClient.getCurrentUser();
    const newAsset = await offlineClient.createAsset({
      ...asset,
      userId: user.id,
    });
    return wrapResponse(newAsset);
  },

  updateAsset: async (assetId: string, asset: any): Promise<ApiResponse<any>> => {
    const updated = await offlineClient.updateAsset({ ...asset, id: assetId });
    return wrapResponse(updated);
  },

  deleteAsset: async (assetId: string): Promise<ApiResponse<void>> => {
    await offlineClient.deleteAsset(assetId);
    return wrapResponse(undefined);
  },
};

/**
 * Debts API - matches debtsAPI interface
 */
export const debtsAPI = {
  getDebts: async (): Promise<ApiResponse<any>> => {
    const user = await offlineClient.getCurrentUser();
    const debts = await offlineClient.getDebts(user.id);
    return wrapResponse(debts);
  },

  getDebt: async (debtId: string): Promise<ApiResponse<any>> => {
    const debt = await offlineClient.getDebt(debtId);
    return wrapResponse(debt);
  },

  createDebt: async (debt: any): Promise<ApiResponse<any>> => {
    const user = await offlineClient.getCurrentUser();
    const newDebt = await offlineClient.createDebt({
      ...debt,
      userId: user.id,
    });
    return wrapResponse(newDebt);
  },

  updateDebt: async (debtId: string, debt: any): Promise<ApiResponse<any>> => {
    const updated = await offlineClient.updateDebt({ ...debt, id: debtId });
    return wrapResponse(updated);
  },

  deleteDebt: async (debtId: string): Promise<ApiResponse<void>> => {
    await offlineClient.deleteDebt(debtId);
    return wrapResponse(undefined);
  },
};
