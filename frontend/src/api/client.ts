import axios from 'axios'
import { fetchAuthSession } from 'aws-amplify/auth'
import { API_ENDPOINTS } from '../utils/constants'

// Determine API base URL based on environment
const API_BASE_URL = 'https://5m78zqlfve.execute-api.us-east-1.amazonaws.com/prod'
console.log('API_BASE_URL:', API_BASE_URL)

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
    const token = session.tokens?.accessToken?.toString()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch {
    // User not authenticated, continue without token
    console.log('No auth session found')
  }
  return config
})

export const usersAPI = {
  getCurrentUser: () => apiClient.get(API_ENDPOINTS.USERS.ME),
  updateCurrentUser: (user: any) => apiClient.put(API_ENDPOINTS.USERS.ME, user),
  getUserVersions: () => apiClient.get(API_ENDPOINTS.USERS.VERSIONS),
}

export const plansAPI = {
  getPlans: () => apiClient.get(API_ENDPOINTS.PLANS.BASE),
  getPlan: (planId: string) => apiClient.get(API_ENDPOINTS.PLANS.BY_ID(planId)),
  createPlan: (plan: any) => apiClient.post(API_ENDPOINTS.PLANS.BASE, plan),
  updatePlan: (planId: string, plan: any) => apiClient.put(API_ENDPOINTS.PLANS.BY_ID(planId), plan),
  deletePlan: (planId: string) => apiClient.delete(API_ENDPOINTS.PLANS.BY_ID(planId)),
}

export const budgetsAPI = {
  getBudgets: () => apiClient.get(API_ENDPOINTS.BUDGETS.BASE),
  getBudget: (budgetId: string) => apiClient.get(API_ENDPOINTS.BUDGETS.BY_ID(budgetId)),
  createBudget: (budget: any) => apiClient.post(API_ENDPOINTS.BUDGETS.BASE, budget),
  updateBudget: (budgetId: string, budget: any) => apiClient.put(API_ENDPOINTS.BUDGETS.BY_ID(budgetId), budget),
  deleteBudget: (budgetId: string) => apiClient.delete(API_ENDPOINTS.BUDGETS.BY_ID(budgetId)),
}

export const assetsAPI = {
  getAssets: () => apiClient.get(API_ENDPOINTS.ASSETS.BASE),
  getAsset: (assetId: string) => apiClient.get(API_ENDPOINTS.ASSETS.BY_ID(assetId)),
  createAsset: (asset: any) => apiClient.post(API_ENDPOINTS.ASSETS.BASE, asset),
  updateAsset: (assetId: string, asset: any) => apiClient.put(API_ENDPOINTS.ASSETS.BY_ID(assetId), asset),
  deleteAsset: (assetId: string) => apiClient.delete(API_ENDPOINTS.ASSETS.BY_ID(assetId)),
}

export const debtsAPI = {
  getDebts: () => apiClient.get(API_ENDPOINTS.DEBTS.BASE),
  getDebt: (debtId: string) => apiClient.get(API_ENDPOINTS.DEBTS.BY_ID(debtId)),
  createDebt: (debt: any) => apiClient.post(API_ENDPOINTS.DEBTS.BASE, debt),
  updateDebt: (debtId: string, debt: any) => apiClient.put(API_ENDPOINTS.DEBTS.BY_ID(debtId), debt),
  deleteDebt: (debtId: string) => apiClient.delete(API_ENDPOINTS.DEBTS.BY_ID(debtId)),
}

export default apiClient
