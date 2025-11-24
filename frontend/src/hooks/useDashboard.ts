import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../components/Auth'
import { usersAPI, assetsAPI, debtsAPI } from '../api/client'
import { User, Asset, Debt } from '../types'
import {
  getDashboardData,
  DashboardData
} from '../services/dashboardService'

export interface UseDashboardReturn {
  dashboardData: DashboardData
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Custom hook for dashboard/home page data management
 * Handles data fetching, state management, and provides calculated values
 */
export function useDashboard(): UseDashboardReturn {
  const { user } = useAuth()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      setLoading(true)

      // Fetch user data
      const userResponse = await usersAPI.getCurrentUser()
      setCurrentUser(userResponse.data)

      // Fetch assets and debts for net worth calculation
      const [assetsResponse, debtsResponse] = await Promise.all([
        assetsAPI.getAssets(),
        debtsAPI.getDebts()
      ])

      setAssets(assetsResponse.data)
      setDebts(debtsResponse.data)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load financial data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()

    // Listen for user update events
    const handleUserUpdate = () => {
      fetchData()
    }
    window.addEventListener('userUpdated', handleUserUpdate)

    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate)
    }
  }, [user, fetchData])

  // Calculate dashboard data
  const dashboardData = getDashboardData(currentUser, assets, debts)

  return {
    dashboardData,
    loading,
    error,
    refetch: fetchData
  }
}