import axios from 'axios'
import { fetchAuthSession } from 'aws-amplify/auth'

const API_BASE_URL = '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add JWT token to requests
apiClient.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession()
    const token = session.tokens?.idToken?.toString()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch (error) {
    // User not authenticated, continue without token
    console.log('No auth session found')
  }
  return config
})

export const usersAPI = {
  getCurrentUser: () => apiClient.get('/users/me'),
  updateCurrentUser: (user: any) => apiClient.put('/users/me', user),
}

export const plansAPI = {
  getPlans: () => apiClient.get('/plans'),
  getPlan: (planId: string) => apiClient.get(`/plans/${planId}`),
  createPlan: (plan: any) => apiClient.post('/plans', plan),
  updatePlan: (planId: string, plan: any) => apiClient.put(`/plans/${planId}`, plan),
  deletePlan: (planId: string) => apiClient.delete(`/plans/${planId}`),
}

export const budgetsAPI = {
  getBudgets: () => apiClient.get('/budgets'),
  getBudget: (budgetId: string) => apiClient.get(`/budgets/${budgetId}`),
  createBudget: (budget: any) => apiClient.post('/budgets', budget),
  updateBudget: (budgetId: string, budget: any) => apiClient.put(`/budgets/${budgetId}`, budget),
  deleteBudget: (budgetId: string) => apiClient.delete(`/budgets/${budgetId}`),
}

export const assetsAPI = {
  getAssets: () => apiClient.get('/assets'),
  getAsset: (assetId: string) => apiClient.get(`/assets/${assetId}`),
  createAsset: (asset: any) => apiClient.post('/assets', asset),
  updateAsset: (assetId: string, asset: any) => apiClient.put(`/assets/${assetId}`, asset),
  deleteAsset: (assetId: string) => apiClient.delete(`/assets/${assetId}`),
}

export const debtsAPI = {
  getDebts: () => apiClient.get('/debts'),
  getDebt: (debtId: string) => apiClient.get(`/debts/${debtId}`),
  createDebt: (debt: any) => apiClient.post('/debts', debt),
  updateDebt: (debtId: string, debt: any) => apiClient.put(`/debts/${debtId}`, debt),
  deleteDebt: (debtId: string) => apiClient.delete(`/debts/${debtId}`),
}

export default apiClient
