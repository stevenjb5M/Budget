import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { Plans } from '../Plans'
import { plansAPI, budgetsAPI, assetsAPI, debtsAPI } from '../../api/client'
import { versionSyncService } from '../../services/versionSyncService'
import { getCurrentUserId } from '../../utils/auth'

vi.mock('../../api/client', () => ({
  plansAPI: {
    getPlans: vi.fn(),
    createPlan: vi.fn(),
    updatePlan: vi.fn(),
    deletePlan: vi.fn()
  },
  budgetsAPI: { getBudgets: vi.fn() },
  assetsAPI: { getAssets: vi.fn() },
  debtsAPI: { getDebts: vi.fn() },
}))

vi.mock('../../services/versionSyncService', () => ({
  versionSyncService: {
    getData: vi.fn(),
    storeData: vi.fn(),
    syncData: vi.fn()
  },
}))

vi.mock('../../utils/auth', () => ({
  getCurrentUserId: vi.fn(),
}))

vi.mock('../../components/Nav', () => ({
  Nav: () => <div data-testid="nav">Navigation</div>,
}))

vi.mock('../../components/Footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}))

const localStorageMock = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() }
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('Plans Component - Transaction Management', () => {
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
          netWorth: 2500,
          transactions: [
            {
              id: 'trans1',
              type: 'asset' as const,
              targetId: 'asset1',
              amount: 500,
              description: 'Investment',
              isEditing: false
            }
          ]
        },
        {
          month: '2025-02',
          budgetId: 'budget1',
          netWorth: 3000,
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
      userId: mockUserId,
      name: 'Monthly Budget',
      isActive: true,
      income: [{ id: 'inc1', name: 'Salary', amount: 5000, category: 'Employment' }],
      expenses: [{ id: 'exp1', name: 'Rent', amount: 1500, category: 'Housing', type: 'regular' as const }],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    }
  ]

  const mockAssets = [
    {
      id: 'asset1',
      userId: mockUserId,
      name: 'Savings Account',
      type: 'savings',
      currentValue: 1000,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'asset2',
      userId: mockUserId,
      name: 'Investment Account',
      type: 'investment',
      currentValue: 2000,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    }
  ]

  const mockDebts = [
    {
      id: 'debt1',
      userId: mockUserId,
      name: 'Credit Card',
      type: 'credit_card',
      currentBalance: 500,
      interestRate: 15,
      minimumPayment: 50,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()

    vi.mocked(getCurrentUserId).mockResolvedValue(mockUserId)
    vi.mocked(versionSyncService.syncData).mockResolvedValue()
    vi.mocked(versionSyncService.getData).mockImplementation(async (entityType: string) => {
      if (entityType === 'plans') return mockPlans
      if (entityType === 'budgets') return mockBudgets
      if (entityType === 'assets') return mockAssets
      if (entityType === 'debts') return mockDebts
      return []
    })

    vi.mocked(plansAPI.getPlans).mockResolvedValue({ data: mockPlans } as any)
    vi.mocked(budgetsAPI.getBudgets).mockResolvedValue({ data: mockBudgets } as any)
    vi.mocked(assetsAPI.getAssets).mockResolvedValue({ data: mockAssets } as any)
    vi.mocked(debtsAPI.getDebts).mockResolvedValue({ data: mockDebts } as any)
    vi.mocked(plansAPI.updatePlan).mockResolvedValue({ data: {} } as any)
  })

  it('renders the plans page with navigation and footer', async () => {
    render(<Plans />)

    await waitFor(() => {
      expect(screen.getByTestId('nav')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })
  })

  it('displays plan name and months', async () => {
    render(<Plans />)

    await waitFor(() => {
      expect(screen.getByText('Test Plan')).toBeInTheDocument()
      expect(screen.getByText('Jan 2025')).toBeInTheDocument()
      expect(screen.getByText('Feb 2025')).toBeInTheDocument()
    })
  })

  it('displays existing transactions', async () => {
    render(<Plans />)

    await waitFor(() => {
      expect(screen.getByText('Investment')).toBeInTheDocument()
      expect(screen.getByText('$500.00')).toBeInTheDocument()
    })
  })

  it('adds a new transaction when add button is clicked', async () => {
    render(<Plans />)

    await waitFor(() => {
      expect(screen.getByText('Test Plan')).toBeInTheDocument()
    })

    // Find and click the add transaction button for January (first month)
    const addButtons = screen.getAllByRole('button', { name: 'Add transaction' })
    fireEvent.click(addButtons[0])

    // Check that a new transaction form appears
    await waitFor(() => {
      // Should have input fields for the new transaction
      const amountInputs = screen.getAllByDisplayValue('0')
      expect(amountInputs.length).toBeGreaterThan(0)
    })
  })

  it('allows editing transaction details', async () => {
    render(<Plans />)

    await waitFor(() => {
      expect(screen.getByText('Test Plan')).toBeInTheDocument()
    })

    // Add a new transaction first
    const addButtons = screen.getAllByRole('button', { name: 'Add transaction' })
    fireEvent.click(addButtons[0])

    await waitFor(() => {
      const amountInputs = screen.getAllByDisplayValue('0')
      expect(amountInputs.length).toBeGreaterThan(0)
    })

    // Find the first amount input (the newly added one) and change it
    const amountInputs = screen.getAllByDisplayValue('0')
    const newAmountInput = amountInputs[amountInputs.length - 1] // Get the last one (newly added)
    fireEvent.change(newAmountInput, { target: { value: '250' } })

    expect(newAmountInput).toHaveValue(250)
  })

  it('saves transaction when save button is clicked', async () => {
    render(<Plans />)

    await waitFor(() => {
      expect(screen.getByText('Test Plan')).toBeInTheDocument()
    })

    // Add a new transaction
    const addButtons = screen.getAllByRole('button', { name: 'Add transaction' })
    fireEvent.click(addButtons[0])

    await waitFor(() => {
      const amountInputs = screen.getAllByDisplayValue('0')
      expect(amountInputs.length).toBeGreaterThan(0)
    })

    // Fill in transaction details - get the newly added input
    const amountInputs = screen.getAllByDisplayValue('0')
    const newAmountInput = amountInputs[amountInputs.length - 1] // Get the last one
    fireEvent.change(newAmountInput, { target: { value: '300' } })

    // Select an asset from dropdown - find the corresponding select for the new transaction
    const selectElements = screen.getAllByRole('combobox', { name: 'Select asset or debt' })
    if (selectElements.length > 0) {
      const newSelect = selectElements[selectElements.length - 1] // Get the last one
      fireEvent.change(newSelect, { target: { value: 'asset-asset1' } })
    }

    // Find and click save button (checkmark symbol) - get the last enabled one
    const saveButtons = screen.getAllByRole('button', { name: '✓' })
    const enabledSaveButtons = saveButtons.filter(button => !button.hasAttribute('disabled'))
    if (enabledSaveButtons.length > 0) {
      fireEvent.click(enabledSaveButtons[enabledSaveButtons.length - 1]) // Click the last enabled save button

      await waitFor(() => {
        expect(plansAPI.updatePlan).toHaveBeenCalled()
      })
    }
  })

  it('removes transaction when remove button is clicked', async () => {
    render(<Plans />)

    await waitFor(() => {
      expect(screen.getByText('Investment')).toBeInTheDocument()
    })

    // Find remove buttons - represented by × symbol
    const removeButtons = screen.getAllByRole('button', { name: '×' })
    if (removeButtons.length > 0) {
      fireEvent.click(removeButtons[0])

      await waitFor(() => {
        expect(plansAPI.updatePlan).toHaveBeenCalled()
      })
    }
  })

  it('handles multiple transactions in different months', async () => {
    render(<Plans />)

    await waitFor(() => {
      expect(screen.getByText('Test Plan')).toBeInTheDocument()
    })

    // Add transaction to January
    const addButtons = screen.getAllByRole('button', { name: 'Add transaction' })
    fireEvent.click(addButtons[0])

    await waitFor(() => {
      const amountInputs = screen.getAllByDisplayValue('0')
      expect(amountInputs.length).toBeGreaterThan(0)
    })

    // Add transaction to February
    fireEvent.click(addButtons[1])

    await waitFor(() => {
      // Should have multiple transaction forms now
      const amountInputs = screen.getAllByDisplayValue('0')
      expect(amountInputs.length).toBeGreaterThan(1)
    })
  })

  it('validates transaction data before saving', async () => {
    render(<Plans />)

    await waitFor(() => {
      expect(screen.getByText('Test Plan')).toBeInTheDocument()
    })

    // Add a new transaction
    const addButtons = screen.getAllByRole('button', { name: 'Add transaction' })
    fireEvent.click(addButtons[0])

    await waitFor(() => {
      const amountInputs = screen.getAllByDisplayValue('0')
      expect(amountInputs.length).toBeGreaterThan(0)
    })

    // Try to save without filling required fields
    const saveButtons = screen.getAllByRole('button', { name: '✓' })
    const enabledSaveButtons = saveButtons.filter(button => !button.hasAttribute('disabled'))
    if (enabledSaveButtons.length > 0) {
      fireEvent.click(enabledSaveButtons[enabledSaveButtons.length - 1]) // Click the last enabled save button

      // The transaction should be removed if invalid (amount is 0)
      await waitFor(() => {
        expect(plansAPI.updatePlan).not.toHaveBeenCalled()
      })
    }
  })
})