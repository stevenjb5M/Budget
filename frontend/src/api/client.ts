import axios from 'axios'
import { fetchAuthSession } from 'aws-amplify/auth'

const API_BASE_URL = 'http://localhost:5000'

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
  getCurrentUser: () => apiClient.get('/api/users/me'),
  updateCurrentUser: (user: any) => apiClient.put('/api/users/me', user),
  getUserVersions: () => apiClient.get('/api/users/versions'),
}

export const plansAPI = {
  getPlans: () => apiClient.get('/api/plans'),
  getPlan: (planId: string) => apiClient.get(`/api/plans/${planId}`),
  createPlan: (plan: any) => apiClient.post('/api/plans', plan),
  updatePlan: (planId: string, plan: any) => apiClient.put(`/api/plans/${planId}`, plan),
  deletePlan: (planId: string) => apiClient.delete(`/api/plans/${planId}`),
}

export const budgetsAPI = {
  getBudgets: () => apiClient.get('/api/budgets'),
  getBudget: (budgetId: string) => apiClient.get(`/api/budgets/${budgetId}`),
  createBudget: (budget: any) => apiClient.post('/api/budgets', budget),
  updateBudget: (budgetId: string, budget: any) => apiClient.put(`/api/budgets/${budgetId}`, budget),
  deleteBudget: (budgetId: string) => apiClient.delete(`/api/budgets/${budgetId}`),
}

export const assetsAPI = {
  getAssets: () => apiClient.get('/api/assets'),
  getAsset: (assetId: string) => apiClient.get(`/api/assets/${assetId}`),
  createAsset: (asset: any) => apiClient.post('/api/assets', asset),
  updateAsset: (assetId: string, asset: any) => apiClient.put(`/api/assets/${assetId}`, asset),
  deleteAsset: (assetId: string) => apiClient.delete(`/api/assets/${assetId}`),
}

export const debtsAPI = {
  getDebts: () => apiClient.get('/api/debts'),
  getDebt: (debtId: string) => apiClient.get(`/api/debts/${debtId}`),
  createDebt: (debt: any) => apiClient.post('/api/debts', debt),
  updateDebt: (debtId: string, debt: any) => apiClient.put(`/api/debts/${debtId}`, debt),
  deleteDebt: (debtId: string) => apiClient.delete(`/api/debts/${debtId}`),
}

export default apiClient
