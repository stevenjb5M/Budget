import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { usePlans } from '../../hooks/usePlans'
import { plansAPI } from '../../api/client'
import { versionSyncService } from '../../services/versionSyncService'
import { getCurrentUserId } from '../../utils/auth'

// Mock all dependencies
vi.mock('../../api/client', () => ({
  plansAPI: {
    getPlans: vi.fn(),
    createPlan: vi.fn(),
    updatePlan: vi.fn(),
    deletePlan: vi.fn()
  },
}))

vi.mock('../../services/versionSyncService', () => ({
  versionSyncService: {
    getData: vi.fn(),
    storeData: vi.fn()
  },
}))

vi.mock('../../utils/auth', () => ({
  getCurrentUserId: vi.fn(),
}))

describe('usePlans hook', () => {
  const mockUserId = 'user123'

  const mockPlans = [
    {
      id: 'plan1',
      userId: mockUserId,
      name: 'Test Plan',
      description: 'A test plan',
      isActive: true,
      months: [
        {
          month: '2025-01',
          budgetId: 'budget1',
          netWorth: 2500, // 1200 assets + 3000 income - 1200 expenses - 500 debts
          transactions: []
        }
      ],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    }
  ]

  const mockBudgets = [
    {
      id: 'budget1',
      name: 'Monthly Budget',
      income: [{ amount: 3000 }],
      expenses: [
        { id: 'exp1', name: 'Rent', amount: 1200, category: 'Housing', type: 'regular' },
        { id: 'exp2', name: 'Savings', amount: 200, type: 'asset', linkedAssetId: 'asset1' }
      ]
    }
  ]

  const mockAssets = [
    { id: 'asset1', name: 'Savings', currentValue: 1000 }
  ]

  const mockDebts = [
    { id: 'debt1', name: 'Credit Card', currentBalance: 500 }
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    vi.mocked(getCurrentUserId).mockResolvedValue(mockUserId)
    vi.mocked(versionSyncService.getData).mockImplementation((key) => {
      switch (key) {
        case 'plans':
          return Promise.resolve(mockPlans)
        case 'budgets':
          return Promise.resolve(mockBudgets)
        case 'assets':
          return Promise.resolve(mockAssets)
        case 'debts':
          return Promise.resolve(mockDebts)
        default:
          return Promise.resolve([])
      }
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('initialization', () => {
    it('loads data on mount', async () => {
      const { result } = renderHook(() => usePlans())

      // Initially loading
      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBe(null)

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.plans).toEqual(mockPlans)
      expect(result.current.budgets).toEqual(mockBudgets)
      expect(result.current.assets).toEqual(mockAssets)
      expect(result.current.debts).toEqual(mockDebts)
      expect(result.current.selectedPlanId).toBe('plan1') // First active plan
    })

    it('handles loading errors', async () => {
      vi.mocked(versionSyncService.getData).mockRejectedValue(new Error('API Error'))

      const { result } = renderHook(() => usePlans())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Failed to load plans data. Please try again.')
      expect(result.current.plans).toEqual([])
    })

    it('normalizes data types', async () => {
      const stringValueAssets = [
        { id: 'asset1', name: 'Savings', currentValue: '1500' } // String value
      ]
      const stringValueDebts = [
        { id: 'debt1', name: 'Credit Card', currentBalance: '750' } // String value
      ]

      vi.mocked(versionSyncService.getData).mockImplementation((key) => {
        switch (key) {
          case 'assets':
            return Promise.resolve(stringValueAssets)
          case 'debts':
            return Promise.resolve(stringValueDebts)
          default:
            return Promise.resolve([])
        }
      })

      const { result } = renderHook(() => usePlans())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.assets[0].currentValue).toBe(1500) // Converted to number
      expect(result.current.debts[0].currentBalance).toBe(750) // Converted to number
    })
  })

  describe('plan operations', () => {
    it('creates a new plan', async () => {
      const newPlanData = {
        name: 'New Plan',
        description: 'A new plan',
        autofillBudgetId: 'budget1'
      }

      const createdPlan = {
        id: 'plan2',
        userId: mockUserId,
        name: 'New Plan',
        description: 'A new plan',
        isActive: false,
        months: [
          {
            month: '2025-01',
            budgetId: 'budget1',
            netWorth: 500, // currentNetWorth
            transactions: []
          }
        ],
        createdAt: '2025-01-02T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z'
      }

      vi.mocked(plansAPI.createPlan).mockResolvedValue({ data: createdPlan } as any)
      vi.mocked(versionSyncService.storeData).mockResolvedValue(undefined)

      const { result } = renderHook(() => usePlans())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.handleCreatePlan(
          newPlanData.name,
          newPlanData.description,
          newPlanData.autofillBudgetId
        )
      })

      expect(plansAPI.createPlan).toHaveBeenCalledWith({
        name: 'New Plan',
        description: 'A new plan',
        isActive: false, // No existing plans, so this would be active
        months: expect.any(Array)
      })
      expect(result.current.plans).toContain(createdPlan)
      expect(result.current.selectedPlanId).toBe('plan2')
    })

    it('selects a plan', async () => {
      const { result } = renderHook(() => usePlans())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Add another plan to test selection
      const additionalPlan = {
        ...mockPlans[0],
        id: 'plan2',
        isActive: false
      }

      // Mock the update calls
      vi.mocked(plansAPI.updatePlan).mockResolvedValue({ data: {} } as any)

      // Update the plans state to include both plans
      result.current.plans.push(additionalPlan)

      await act(async () => {
        await result.current.handleSelectPlan('plan2')
      })

      expect(plansAPI.updatePlan).toHaveBeenCalledTimes(2) // One to deactivate plan1, one to activate plan2
      expect(result.current.selectedPlanId).toBe('plan2')
    })

    it('adds empty transaction', async () => {
      const { result } = renderHook(() => usePlans())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.handleAddEmptyTransaction(0) // First month
      })

      const selectedPlan = result.current.plans.find((p: any) => p.id === result.current.selectedPlanId)
      expect(selectedPlan?.months[0].transactions).toHaveLength(1)
      expect(selectedPlan?.months[0].transactions?.[0]).toMatchObject({
        type: 'asset',
        targetId: '',
        amount: 0,
        description: '',
        isEditing: true
      })
    })

    it('updates transaction', async () => {
      const { result } = renderHook(() => usePlans())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // First add a transaction
      await act(async () => {
        await result.current.handleAddEmptyTransaction(0)
      })
      const transactionId = result.current.selectedPlan?.months[0].transactions?.[0].id

      // Update it
      act(() => {
        result.current.handleUpdateTransaction(0, transactionId!, 'amount', 100)
      })

      const selectedPlan = result.current.plans.find((p: any) => p.id === result.current.selectedPlanId)
      expect(selectedPlan?.months[0].transactions?.[0].amount).toBe(100)
    })

    it('saves transaction', async () => {
      const { result } = renderHook(() => usePlans())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Add and update a transaction
      await act(async () => {
        await result.current.handleAddEmptyTransaction(0)
      })
      const transactionId = result.current.selectedPlan?.months[0].transactions?.[0].id
      act(() => {
        result.current.handleUpdateTransaction(0, transactionId!, 'targetId', 'asset-asset1')
      })
      act(() => {
        result.current.handleUpdateTransaction(0, transactionId!, 'amount', 200)
      })

      vi.mocked(plansAPI.updatePlan).mockResolvedValue({ data: {} } as any)

      await act(async () => {
        await result.current.handleSaveTransaction(0, transactionId!)
      })

      expect(plansAPI.updatePlan).toHaveBeenCalled()
      const selectedPlan = result.current.plans.find((p: any) => p.id === result.current.selectedPlanId)
      expect(selectedPlan?.months[0].transactions?.[0].isEditing).toBe(false)
      expect(selectedPlan?.months[0].transactions?.[0].targetId).toBe('asset1')
    })

    it('removes transaction', async () => {
      const { result } = renderHook(() => usePlans())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Add a transaction
      await act(async () => {
        await result.current.handleAddEmptyTransaction(0)
      })
      const transactionId = result.current.selectedPlan?.months[0].transactions?.[0].id

      vi.mocked(plansAPI.updatePlan).mockResolvedValue({ data: {} } as any)

      await act(async () => {
        await result.current.handleRemoveTransaction(0, transactionId!)
      })

      expect(plansAPI.updatePlan).toHaveBeenCalled()
      const selectedPlan = result.current.plans.find((p: any) => p.id === result.current.selectedPlanId)
      expect(selectedPlan?.months[0].transactions?.find(t => t.id === transactionId)).toBeUndefined()
    })

    it('renames plan', async () => {
      const { result } = renderHook(() => usePlans())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      vi.mocked(plansAPI.updatePlan).mockResolvedValue({ data: {} } as any)

      await act(async () => {
        await result.current.handleRenamePlan('Updated Plan Name')
      })

      expect(plansAPI.updatePlan).toHaveBeenCalled()
      expect(result.current.selectedPlan?.name).toBe('Updated Plan Name')
    })

    it('deletes plan', async () => {
      const { result } = renderHook(() => usePlans())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      vi.mocked(plansAPI.deletePlan).mockResolvedValue({ data: {} } as any)

      await act(async () => {
        await result.current.handleDeletePlan()
      })

      expect(plansAPI.deletePlan).toHaveBeenCalledWith('plan1')
      expect(result.current.plans).toHaveLength(0)
      expect(result.current.selectedPlanId).toBe('')
    })

    it('updates budget for month', async () => {
      const { result } = renderHook(() => usePlans())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      vi.mocked(plansAPI.updatePlan).mockResolvedValue({ data: {} } as any)

      await act(async () => {
        await result.current.handleBudgetChange(0, 'budget2')
      })

      expect(plansAPI.updatePlan).toHaveBeenCalled()
      expect(result.current.selectedPlan?.months[0].budgetId).toBe('budget2')
    })
  })

  describe('derived values', () => {
    it('calculates current net worth', async () => {
      const { result } = renderHook(() => usePlans())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Assets: 1000, Debts: 500, Net worth: 500
      expect(result.current.currentNetWorth).toBe(500)
    })

    it('returns selected plan', async () => {
      const { result } = renderHook(() => usePlans())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.selectedPlan).toMatchObject({
        id: 'plan1',
        name: 'Test Plan',
        description: 'A test plan',
        isActive: true
      })
    })
  })
})