import { fetchAuthSession } from 'aws-amplify/auth'
import { createContext, useContext } from 'react'
import { AuthContextType } from '../types'

export const getCurrentUserId = async (): Promise<string> => {
  try {
    const session = await fetchAuthSession()
    const userId = session.userSub || session.tokens?.idToken?.payload?.sub
    return userId || 'anonymous-user'
  } catch (error) {
    console.warn('Could not get user ID, using anonymous:', error)
    return 'anonymous-user'
  }
}

export const getCurrentUserIdSync = (): string => {
  // For cases where we need a synchronous user ID (like during initial load)
  // This will return a cached value or fallback
  try {
    // Try to get from localStorage cache
    const cached = localStorage.getItem('budget_app_current_user_id')
    if (cached) return cached

    // Fallback to anonymous
    return 'anonymous-user'
  } catch {
    return 'anonymous-user'
  }
}

export const setCurrentUserId = (userId: string): void => {
  try {
    localStorage.setItem('budget_app_current_user_id', userId)
  } catch (error) {
    console.warn('Could not cache user ID:', error)
  }
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { AuthContext }