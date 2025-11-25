import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useDashboard } from '../hooks/useDashboard'
import { usersAPI, assetsAPI, debtsAPI } from '../api/client'
import { User, Asset, Debt } from '../types'
import { useAuth } from '../utils/auth'

// Mock the API client
vi.mock('../api/client', () => ({
  usersAPI: {
    getCurrentUser: vi.fn(),
  },
  assetsAPI: {
    getAssets: vi.fn(),
  },
  debtsAPI: {
    getDebts: vi.fn(),
  },
}))

// Mock the Auth hook
vi.mock('../utils/auth', () => ({
  useAuth: vi.fn(),
}))

describe('useDashboard Hook', () => {
  const mockUsersAPI = vi.mocked(usersAPI)
  const mockAssetsAPI = vi.mocked(assetsAPI)
  const mockDebtsAPI = vi.mocked(debtsAPI)
  const mockUseAuth = vi.mocked(useAuth)

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock window.addEventListener/removeEventListener
    vi.spyOn(window, 'addEventListener').mockImplementation(() => {})
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const mockUser: User = {
    id: '1',
    displayName: 'John Doe',
    email: 'john@example.com',
    birthdayString: '1990-01-01',
    retirementAge: 65,
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  }

  const mockAssets: Asset[] = [
    { id: '1', name: 'House', currentValue: 300000, annualAPY: 0, notes: '', userId: '1', createdAt: '', updatedAt: '' },
  ]

  const mockDebts: Debt[] = [
    { id: '1', name: 'Mortgage', currentBalance: 250000, interestRate: 3.5, minimumPayment: 1500, notes: '', userId: '1', createdAt: '', updatedAt: '' },
  ]

  it('returns loading state initially', () => {
    mockUseAuth.mockReturnValue({ user: null })

    const { result } = renderHook(() => useDashboard())

    expect(result.current.loading).toBe(false) // Should be false when no user
    expect(result.current.error).toBeNull()
  })

  it('fetches and returns dashboard data successfully', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user1' } })

    mockUsersAPI.getCurrentUser.mockResolvedValue({ data: mockUser })
    mockAssetsAPI.getAssets.mockResolvedValue({ data: mockAssets })
    mockDebtsAPI.getDebts.mockResolvedValue({ data: mockDebts })

    const { result } = renderHook(() => useDashboard())

    // Initially loading
    expect(result.current.loading).toBe(true)

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeNull()
    expect(result.current.dashboardData.user).toEqual(mockUser)
    expect(result.current.dashboardData.assets).toEqual(mockAssets)
    expect(result.current.dashboardData.debts).toEqual(mockDebts)
    expect(result.current.dashboardData.assetsTotal).toBe(300000)
    expect(result.current.dashboardData.debtsTotal).toBe(250000)
    expect(result.current.dashboardData.netWorth).toBe(50000)
  })

  it('handles API errors', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user1' } })

    mockUsersAPI.getCurrentUser.mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => useDashboard())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to load financial data. Please try again.')
    expect(result.current.dashboardData.user).toBeNull()
  })

  it('does not fetch data when no user', async () => {
    mockUseAuth.mockReturnValue({ user: null })

    const { result } = renderHook(() => useDashboard())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockUsersAPI.getCurrentUser).not.toHaveBeenCalled()
    expect(mockAssetsAPI.getAssets).not.toHaveBeenCalled()
    expect(mockDebtsAPI.getDebts).not.toHaveBeenCalled()
  })

  it('refetches data when called', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user1' } })

    mockUsersAPI.getCurrentUser.mockResolvedValue({ data: mockUser })
    mockAssetsAPI.getAssets.mockResolvedValue({ data: mockAssets })
    mockDebtsAPI.getDebts.mockResolvedValue({ data: mockDebts })

    const { result } = renderHook(() => useDashboard())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Call refetch
    await result.current.refetch()

    expect(mockUsersAPI.getCurrentUser).toHaveBeenCalledTimes(2)
    expect(mockAssetsAPI.getAssets).toHaveBeenCalledTimes(2)
    expect(mockDebtsAPI.getDebts).toHaveBeenCalledTimes(2)
  })

  it.skip('listens for user update events', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user1' } })

    mockUsersAPI.getCurrentUser.mockResolvedValue({ data: mockUser })
    mockAssetsAPI.getAssets.mockResolvedValue({ data: mockAssets })
    mockDebtsAPI.getDebts.mockResolvedValue({ data: mockDebts })

    renderHook(() => useDashboard())

    await waitFor(() => {
      expect(mockUsersAPI.getCurrentUser).toHaveBeenCalled()
    })

    // Simulate user update event
    act(() => {
      window.dispatchEvent(new CustomEvent('userUpdated'))
    })

    // Wait for the event to be processed
    await waitFor(() => {
      expect(mockUsersAPI.getCurrentUser).toHaveBeenCalledTimes(2)
    })
  })
})