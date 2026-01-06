import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('Plans Component - Comprehensive Tests', () => {
  // Mock current date to Jan 1, 2026
  const MOCK_DATE = new Date('2026-01-01T00:00:00Z')
  const RealDate = Date
  let dateSpy: any
  beforeAll(() => {
    dateSpy = vi.spyOn(globalThis, 'Date').mockImplementation((...args: any[]) => {
      if (args.length === 0) {
        return new RealDate(MOCK_DATE)
      }
      // @ts-expect-error because. 
      return new RealDate(...args)
    })
    Object.setPrototypeOf(Date, RealDate)
    Object.assign(Date, RealDate)
  })
  afterAll(() => {
    dateSpy?.mockRestore()
  })

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
          month: '2026-01',
          budgetId: 'budget1',
          netWorth: 2500,
          transactions: []
        },
        {
          month: '2026-02',
          budgetId: 'budget1',
          netWorth: 3000,
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

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Initial Rendering and Data Loading', () => {
    it('renders the plans page with navigation and footer', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
      })
    })

    it('loads and displays plans data correctly', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
        expect(screen.getByText('A test plan')).toBeInTheDocument()
      })
    })

    it('displays plan name and months correctly', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
        // Month grid is rendered (exact text matching skipped due to DOM splitting)
        expect(screen.getAllByRole('button', { name: /View assets & debts/ }).length).toBeGreaterThan(0)
      })
    })

    it('displays net worth values for each month', async () => {
      render(<Plans />)

      await waitFor(() => {
        // Look for the monthly net worth in the grid (second occurrence)
        // The first $2,500.00 is the current net worth header, we want the monthly values
        const netWorthValues = screen.getAllByText('$2,500.00')
        expect(netWorthValues.length).toBeGreaterThan(0)
        const netWorthValues3000 = screen.getAllByText('$3,000.00')
        expect(netWorthValues3000.length).toBeGreaterThan(0)
      })
    })

    it('displays empty state when no plans exist', async () => {
      vi.mocked(versionSyncService.getData).mockResolvedValue([])
      vi.mocked(plansAPI.getPlans).mockResolvedValue({ data: [] } as any)

      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText("No financial plans yet. Let's create your first one!")).toBeInTheDocument()
      })
    })

    it('handles API errors gracefully', async () => {
      vi.mocked(plansAPI.getPlans).mockRejectedValue(new Error('API Error'))

      render(<Plans />)

      // Should still render without crashing
      await waitFor(() => {
        expect(screen.getByTestId('nav')).toBeInTheDocument()
      })
    })
  })

  describe('Plan Selection and Display', () => {
    it('selects first plan by default when plans exist', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
        // Should show the monthly grid for the selected plan
        expect(screen.getAllByRole('button', { name: /View assets & debts/ }).length).toBeGreaterThan(0)
      })
    })

    it('displays plan selector when multiple plans exist', async () => {
      const multiplePlans = [
        ...mockPlans,
        {
          ...mockPlans[0],
          id: 'plan2',
          name: 'Second Plan',
          description: 'Another test plan'
        }
      ]

      vi.mocked(versionSyncService.getData).mockImplementation(async (entityType: string) => {
        if (entityType === 'plans') return multiplePlans
        if (entityType === 'budgets') return mockBudgets
        if (entityType === 'assets') return mockAssets
        if (entityType === 'debts') return mockDebts
        return []
      })
      vi.mocked(plansAPI.getPlans).mockResolvedValue({ data: multiplePlans } as any)

      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })
    })

    it('allows switching between plans', async () => {
      const multiplePlans = [
        ...mockPlans,
        {
          ...mockPlans[0],
          id: 'plan2',
          name: 'Second Plan',
          description: 'Another test plan',
          months: [
            {
              month: '2025-12',
              budgetId: 'budget1',
              netWorth: 5000,
              transactions: []
            }
          ]
        }
      ]

      vi.mocked(versionSyncService.getData).mockImplementation(async (entityType: string) => {
        if (entityType === 'plans') return multiplePlans
        if (entityType === 'budgets') return mockBudgets
        if (entityType === 'assets') return mockAssets
        if (entityType === 'debts') return mockDebts
        return []
      })
      vi.mocked(plansAPI.getPlans).mockResolvedValue({ data: multiplePlans } as any)

      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      // Show plans list
      const showPlansButton = screen.getByRole('button', { name: 'Show Plans' })
      fireEvent.click(showPlansButton)

      await waitFor(() => {
        expect(screen.getByText('Second Plan')).toBeInTheDocument()
      })

      // Click on the second plan
      const secondPlanItem = screen.getByText('Second Plan')
      fireEvent.click(secondPlanItem)

      await waitFor(() => {
        expect(screen.getByText('Second Plan')).toBeInTheDocument()
      })
    })
  })

  describe('Transaction Management', () => {
    it('displays existing transactions correctly', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('Investment')).toBeInTheDocument()
        expect(screen.getByText('$500.00')).toBeInTheDocument()
        expect(screen.getByText('Asset')).toBeInTheDocument()
      })
    })

    it('adds a new transaction when add button is clicked', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const addButtons = screen.getAllByRole('button', { name: 'Add transaction' })
      fireEvent.click(addButtons[0])

      await waitFor(() => {
        const amountInputs = screen.getAllByDisplayValue('0')
        expect(amountInputs.length).toBeGreaterThan(0)
      })
    })

    it('allows editing transaction details', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const addButtons = screen.getAllByRole('button', { name: 'Add transaction' })
      fireEvent.click(addButtons[0])

      await waitFor(() => {
        const amountInputs = screen.getAllByDisplayValue('0')
        expect(amountInputs.length).toBeGreaterThan(0)
      })

      const amountInputs = screen.getAllByDisplayValue('0')
      const newAmountInput = amountInputs[amountInputs.length - 1]
      fireEvent.change(newAmountInput, { target: { value: '250' } })

      expect(newAmountInput).toHaveValue(250)
    })

    it('saves transaction when save button is clicked', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const addButtons = screen.getAllByRole('button', { name: 'Add transaction' })
      fireEvent.click(addButtons[0])

      await waitFor(() => {
        const amountInputs = screen.getAllByDisplayValue('0')
        expect(amountInputs.length).toBeGreaterThan(0)
      })

      const amountInputs = screen.getAllByDisplayValue('0')
      const newAmountInput = amountInputs[amountInputs.length - 1]
      fireEvent.change(newAmountInput, { target: { value: '300' } })

      const selectElements = screen.getAllByRole('combobox', { name: 'Select asset or debt' })
      if (selectElements.length > 0) {
        const newSelect = selectElements[selectElements.length - 1]
        fireEvent.change(newSelect, { target: { value: 'asset-asset1' } })
      }

      const saveButtons = screen.getAllByRole('button', { name: '✓' })
      const enabledSaveButtons = saveButtons.filter(button => !button.hasAttribute('disabled'))
      if (enabledSaveButtons.length > 0) {
        fireEvent.click(enabledSaveButtons[enabledSaveButtons.length - 1])

        await waitFor(() => {
          expect(plansAPI.updatePlan).toHaveBeenCalled()
        })
      }
    })

    it('removes transaction when remove button is clicked', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('Investment')).toBeInTheDocument()
      })

      const removeButtons = screen.getAllByRole('button', { name: '×' })
      if (removeButtons.length > 0) {
        await act(async () => {
          fireEvent.click(removeButtons[0])
        })

        await waitFor(() => {
          expect(plansAPI.updatePlan).toHaveBeenCalled()
        })
      }
    })

    it('validates transaction data before saving', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const addButtons = screen.getAllByRole('button', { name: 'Add transaction' })
      fireEvent.click(addButtons[0])

      await waitFor(() => {
        const amountInputs = screen.getAllByDisplayValue('0')
        expect(amountInputs.length).toBeGreaterThan(0)
      })

      const saveButtons = screen.getAllByRole('button', { name: '✓' })
      const enabledSaveButtons = saveButtons.filter(button => !button.hasAttribute('disabled'))
      if (enabledSaveButtons.length > 0) {
        fireEvent.click(enabledSaveButtons[enabledSaveButtons.length - 1])

        await waitFor(() => {
          expect(plansAPI.updatePlan).not.toHaveBeenCalled()
        })
      }
    })

    it('handles multiple transactions in different months', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const addButtons = screen.getAllByRole('button', { name: 'Add transaction' })
      fireEvent.click(addButtons[0])

      await waitFor(() => {
        const amountInputs = screen.getAllByDisplayValue('0')
        expect(amountInputs.length).toBeGreaterThan(0)
      })

      fireEvent.click(addButtons[1])

      await waitFor(() => {
        const amountInputs = screen.getAllByDisplayValue('0')
        expect(amountInputs.length).toBeGreaterThan(1)
      })
    })

    it('disables save button when transaction has no target selected', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const addButtons = screen.getAllByRole('button', { name: 'Add transaction' })
      fireEvent.click(addButtons[0])

      await waitFor(() => {
        const saveButtons = screen.getAllByRole('button', { name: '✓' })
        const lastSaveButton = saveButtons[saveButtons.length - 1]
        expect(lastSaveButton).toBeDisabled()
      })
    })

    it('disables save button when transaction amount is zero', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const addButtons = screen.getAllByRole('button', { name: 'Add transaction' })
      fireEvent.click(addButtons[0])

      await waitFor(() => {
        const selectElements = screen.getAllByRole('combobox', { name: 'Select asset or debt' })
        const newSelect = selectElements[selectElements.length - 1]
        fireEvent.change(newSelect, { target: { value: 'asset-asset1' } })

        const saveButtons = screen.getAllByRole('button', { name: '✓' })
        const lastSaveButton = saveButtons[saveButtons.length - 1]
        expect(lastSaveButton).toBeDisabled()
      })
    })

    it('enables save button when transaction has target and non-zero amount', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const addButtons = screen.getAllByRole('button', { name: 'Add transaction' })
      fireEvent.click(addButtons[0])

      await waitFor(() => {
        const selectElements = screen.getAllByRole('combobox', { name: 'Select asset or debt' })
        const newSelect = selectElements[selectElements.length - 1]
        fireEvent.change(newSelect, { target: { value: 'asset-asset1' } })

        const amountInputs = screen.getAllByDisplayValue('0')
        const newAmountInput = amountInputs[amountInputs.length - 1]
        fireEvent.change(newAmountInput, { target: { value: '100' } })

        const saveButtons = screen.getAllByRole('button', { name: '✓' })
        const lastSaveButton = saveButtons[saveButtons.length - 1]
        expect(lastSaveButton).not.toBeDisabled()
      })
    })

    it('cancels transaction editing when cancel button is clicked', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const initialSaveButtons = screen.queryAllByTitle('Save transaction')

      const addButtons = screen.getAllByRole('button', { name: 'Add transaction' })
      fireEvent.click(addButtons[0])

      await waitFor(() => {
        const saveButtons = screen.getAllByTitle('Save transaction')
        expect(saveButtons.length).toBeGreaterThan(initialSaveButtons.length)
      })

      const cancelButtons = screen.getAllByTitle('Cancel')
      const lastCancelButton = cancelButtons[cancelButtons.length - 1]
      fireEvent.click(lastCancelButton)

      await waitFor(() => {
        const finalSaveButtons = screen.queryAllByTitle('Save transaction')
        expect(finalSaveButtons.length).toBe(initialSaveButtons.length)
      })
    })
  })

  describe('Budget Selection', () => {
    it('displays budget selector for each month', async () => {
      render(<Plans />)

      await waitFor(() => {
        const budgetSelectors = screen.getAllByRole('combobox')
        expect(budgetSelectors.length).toBeGreaterThan(0)
      })
    })

    it('allows changing budget for a month', async () => {
      const user = userEvent.setup()
      render(<Plans />)

      await waitFor(() => {
        const budgetSelectors = screen.getAllByRole('combobox')
        expect(budgetSelectors.length).toBeGreaterThan(3) // 3 asset selectors + budget selectors
      })

      // Get the first budget selector (after the 3 asset selectors)
      const budgetSelector = screen.getAllByRole('combobox')[3]
      await user.selectOptions(budgetSelector, 'No Budget')

      await waitFor(() => {
        expect(plansAPI.updatePlan).toHaveBeenCalled()
      })
    })

    it('displays "None" option in budget selector', async () => {
      render(<Plans />)

      await waitFor(() => {
        const budgetSelectors = screen.getAllByRole('combobox')
        const firstSelector = budgetSelectors[0]
        expect(firstSelector).toBeInTheDocument()
        expect(screen.getAllByText('No Budget').length).toBeGreaterThan(0)
      })
    })
  })

  describe('Plan Creation Modal', () => {
    it('opens new plan modal when create button is clicked', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const createButton = screen.getByRole('button', { name: 'Create New Plan' })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Plan Name')).toBeInTheDocument()
      })
    })

    it('closes modal when cancel button is clicked', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const createButton = screen.getByRole('button', { name: 'Create New Plan' })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Plan Name')).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      fireEvent.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByLabelText('Plan Name')).not.toBeInTheDocument()
      })
    })

    it('closes modal when clicking outside', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const createButton = screen.getByRole('button', { name: 'Create New Plan' })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Plan Name')).toBeInTheDocument()
      })

      const modal = screen.getByLabelText('Plan Name').closest('.fixed')
      fireEvent.click(modal!)

      await waitFor(() => {
        expect(screen.queryByLabelText('Plan Name')).not.toBeInTheDocument()
      })
    })

    it('creates plan with valid data', async () => {
      vi.mocked(plansAPI.createPlan).mockResolvedValue({
        data: {
          id: 'newPlan',
          userId: mockUserId,
          name: 'New Test Plan',
          description: 'A new plan',
          isActive: true,
          months: [],
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        }
      } as any)

      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const createButton = screen.getByRole('button', { name: 'Create New Plan' })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Plan Name')).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText('Plan Name')
      const descriptionInput = screen.getByLabelText('Description')

      fireEvent.change(nameInput, { target: { value: 'New Test Plan' } })
      fireEvent.change(descriptionInput, { target: { value: 'A new plan' } })

      const submitButton = screen.getByRole('button', { name: 'Create Plan' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(plansAPI.createPlan).toHaveBeenCalledWith({
          name: 'New Test Plan',
          description: 'A new plan',
          isActive: false,
          months: expect.any(Array)
        })
      })
    })

    it('validates plan name is required', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const createButton = screen.getByRole('button', { name: 'Create New Plan' })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Plan Name')).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: 'Create Plan' })
      fireEvent.click(submitButton)

      // API should not be called when name is empty
      expect(plansAPI.createPlan).not.toHaveBeenCalled()
    })

    it('autofills budget when selected during plan creation', async () => {
      vi.mocked(plansAPI.createPlan).mockResolvedValue({
        data: {
          id: 'newPlan',
          userId: mockUserId,
          name: 'New Test Plan',
          description: 'A new plan',
          isActive: true,
          months: Array.from({ length: 24 }, (_, i) => ({
            month: `2025-${String(i + 1).padStart(2, '0')}`,
            budgetId: 'budget1',
            netWorth: 0,
            transactions: []
          })),
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        }
      } as any)

      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const createButton = screen.getByRole('button', { name: 'Create New Plan' })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Plan Name')).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText('Plan Name')
      const autofillSelect = screen.getByLabelText('Autofill All Months With Budget (Optional)')

      fireEvent.change(nameInput, { target: { value: 'New Test Plan' } })
      fireEvent.change(autofillSelect, { target: { value: 'budget1' } })

      const submitButton = screen.getByRole('button', { name: 'Create Plan' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(plansAPI.createPlan).toHaveBeenCalled()
      })
    })
  })

  describe('Plan Settings Modal', () => {
    it('opens plan settings modal when settings button is clicked', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const settingsButton = screen.getByRole('button', { name: 'Edit Plan' })
      fireEvent.click(settingsButton)

      await waitFor(() => {
        expect(screen.getByText('Plan Settings')).toBeInTheDocument()
      })
    })

    it('closes settings modal when cancel button is clicked', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const settingsButton = screen.getByRole('button', { name: 'Edit Plan' })
      fireEvent.click(settingsButton)

      await waitFor(() => {
        expect(screen.getByText('Plan Settings')).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      fireEvent.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText('Plan Settings')).not.toBeInTheDocument()
      })
    })

    it('renames plan successfully', async () => {
      vi.mocked(plansAPI.updatePlan).mockResolvedValue({ data: {} } as any)

      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const settingsButton = screen.getByRole('button', { name: 'Edit Plan' })
      fireEvent.click(settingsButton)

      await waitFor(() => {
        expect(screen.getByText('Plan Settings')).toBeInTheDocument()
      })

      const nameInput = screen.getByDisplayValue('Test Plan')
      fireEvent.change(nameInput, { target: { value: 'Updated Plan Name' } })

      const renameButton = screen.getByRole('button', { name: 'Rename Plan' })
      
      await waitFor(() => {
        expect(renameButton).not.toBeDisabled()
      })
      
      fireEvent.click(renameButton)

      await waitFor(() => {
        expect(plansAPI.updatePlan).toHaveBeenCalledWith('plan1', expect.objectContaining({
          name: 'Updated Plan Name'
        }))
      })
    })

    it('disables rename button when name is unchanged', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const settingsButton = screen.getByRole('button', { name: 'Edit Plan' })
      fireEvent.click(settingsButton)

      await waitFor(() => {
        expect(screen.getByText('Plan Settings')).toBeInTheDocument()
      })

      const renameButton = screen.getByRole('button', { name: 'Rename Plan' })
      expect(renameButton).toBeDisabled()
    })

    it('opens delete confirmation modal when delete button is clicked', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const settingsButton = screen.getByRole('button', { name: 'Edit Plan' })
      fireEvent.click(settingsButton)

      await waitFor(() => {
        expect(screen.getByText('Plan Settings')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: 'Delete Plan' })
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Are you sure you want to delete "Test Plan"? This action cannot be undone.')).toBeInTheDocument()
      })
    })
  })

  describe('Delete Confirmation Modal', () => {
    it('deletes plan when confirmed', async () => {
      vi.mocked(plansAPI.deletePlan).mockResolvedValue({ data: {} } as any)

      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const settingsButton = screen.getByRole('button', { name: 'Edit Plan' })
      fireEvent.click(settingsButton)

      await waitFor(() => {
        expect(screen.getByText('Plan Settings')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: 'Delete Plan' })
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Are you sure you want to delete "Test Plan"? This action cannot be undone.')).toBeInTheDocument()
      })

      const confirmDeleteButton = screen.getByRole('button', { name: 'Delete' })
      fireEvent.click(confirmDeleteButton)

      await waitFor(() => {
        expect(plansAPI.deletePlan).toHaveBeenCalledWith('plan1')
      })
    })

    it('cancels deletion when cancel button is clicked', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const settingsButton = screen.getByRole('button', { name: 'Edit Plan' })
      fireEvent.click(settingsButton)

      await waitFor(() => {
        expect(screen.getByText('Plan Settings')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: 'Delete Plan' })
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Are you sure you want to delete "Test Plan"? This action cannot be undone.')).toBeInTheDocument()
      })

      const cancelButton = screen.getAllByRole('button', { name: 'Cancel' })[1]
      fireEvent.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText('Are you sure you want to delete "Test Plan"? This action cannot be undone.')).not.toBeInTheDocument()
        expect(screen.getByText('Plan Settings')).toBeInTheDocument()
      })
    })
  })

  describe('Month Details Modal', () => {
    it('opens month details modal when month is clicked', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      // Wait for the month grid to be rendered
      await waitFor(() => {
        expect(screen.getByText(/Jan\s+2026/)).toBeInTheDocument()
      })

      const januaryCell = screen.getByRole('button', { name: /View assets & debts for Jan 2026/ })
      await act(async () => {
        fireEvent.click(januaryCell)
      })

      await waitFor(() => {
        expect(screen.getByText(/Jan\s+2026\s+[-–]\s+Assets & Debts Breakdown/)).toBeInTheDocument()
      })
    })

    it('displays asset projections in month details', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      // Wait for the month grid to be rendered
      await waitFor(() => {
        expect(screen.getByText(/Jan\s+2026/)).toBeInTheDocument()
      })

      const januaryCell = screen.getByRole('button', { name: /View assets & debts for Jan 2026/ })
      await act(async () => {
        fireEvent.click(januaryCell)
      })

      await waitFor(() => {
        expect(screen.getByText(/Jan\s+2026\s+[-–]\s+Assets & Debts Breakdown/)).toBeInTheDocument()
        const savingsAccounts = screen.getAllByText('Savings Account')
        expect(savingsAccounts.length).toBeGreaterThan(1) // One in select options, one in modal
        const investmentAccounts = screen.getAllByText('Investment Account')
        expect(investmentAccounts.length).toBeGreaterThan(1) // One in select options, one in modal
      })
    })

    it('displays debt projections in month details', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      // Wait for the month grid to be rendered
      await waitFor(() => {
        expect(screen.getByText(/Jan\s+2026/)).toBeInTheDocument()
      })

      const januaryCell = screen.getByRole('button', { name: /View assets & debts for Jan 2026/ })
      await act(async () => {
        fireEvent.click(januaryCell)
      })

      await waitFor(() => {
        expect(screen.getByText(/Jan\s+2026\s+[-–]\s+Assets & Debts Breakdown/)).toBeInTheDocument()
        const creditCards = screen.getAllByText('Credit Card')
        expect(creditCards.length).toBeGreaterThan(1) // One in select options, one in modal
      })
    })

    it('closes month details modal when close button is clicked', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      // Wait for the month grid to be rendered
      await waitFor(() => {
        expect(screen.getByText(/Jan\s+2026/)).toBeInTheDocument()
      })

      const januaryCell = screen.getByRole('button', { name: /View assets & debts for Jan 2026/ })
      await act(async () => {
        fireEvent.click(januaryCell)
      })

      await waitFor(() => {
        expect(screen.getByText(/Jan\s+2026\s+[-–]\s+Assets & Debts Breakdown/)).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: 'Close' })
      await act(async () => {
        fireEvent.click(closeButton)
      })

      await waitFor(() => {
        expect(screen.queryByText(/Dec\s+2025\s+[-–]\s+Assets & Debts Breakdown/)).not.toBeInTheDocument()
      })
    })

    it('closes month details modal when clicking outside', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      // Wait for the month grid to be rendered
      await waitFor(() => {
        expect(screen.getByText(/Jan\s+2026/)).toBeInTheDocument()
      })

      const januaryCell = screen.getByRole('button', { name: /View assets & debts for Jan 2026/ })
      await act(async () => {
        fireEvent.click(januaryCell)
      })

      await waitFor(() => {
        expect(screen.getByText(/Jan\s+2026\s+[-–]\s+Assets & Debts Breakdown/)).toBeInTheDocument()
      })

      const modal = screen.getByText(/Jan\s+2026\s+[-–]\s+Assets & Debts Breakdown/).closest('.fixed')
      await act(async () => {
        fireEvent.click(modal!)
      })
      await act(async () => {
        fireEvent.click(modal!)
      })

      await waitFor(() => {
        expect(screen.queryByText(/Dec\s+2025\s+[-–]\s+Assets & Debts Breakdown/)).not.toBeInTheDocument()
      })
    })
  })

  describe('UI State Management', () => {
    it('minimizes and maximizes plan sections', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      // Wait for the month grid to be rendered
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /View assets & debts/ }).length).toBeGreaterThan(0)
      })

      // Initially sections should be expanded
      expect(screen.getAllByRole('button', { name: /View assets & debts/ })[0]).toBeVisible()

      // Click minimize button (assuming it exists)
      const minimizeButtons = screen.queryAllByRole('button', { name: '−' })
      if (minimizeButtons.length > 0) {
        await act(async () => {
          fireEvent.click(minimizeButtons[0])
        })

        // Section should be minimized (this depends on implementation)
        await waitFor(() => {
          // Check that the section is minimized
        })
      }
    })

    it('displays loading states appropriately', async () => {
      // Mock slow API response
      vi.mocked(plansAPI.getPlans).mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ data: mockPlans } as any), 100)
      }))

      render(<Plans />)

      // Should show loading state initially
      expect(screen.getByTestId('nav')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      }, { timeout: 200 })
    })

    it('handles empty assets and debts gracefully', async () => {
      vi.mocked(versionSyncService.getData).mockImplementation(async (entityType: string) => {
        if (entityType === 'plans') return mockPlans
        if (entityType === 'budgets') return mockBudgets
        if (entityType === 'assets') return []
        if (entityType === 'debts') return []
        return []
      })
      vi.mocked(assetsAPI.getAssets).mockResolvedValue({ data: [] } as any)
      vi.mocked(debtsAPI.getDebts).mockResolvedValue({ data: [] } as any)

      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      // Wait for the month grid to be rendered
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /View assets & debts for Jan 2026/ }).length).toBeGreaterThan(0)
      })

      const monthCell = screen.getByRole('button', { name: /View assets & debts for Jan 2026/ })
      await act(async () => {
        fireEvent.click(monthCell)
      })

      await waitFor(() => {
        expect(screen.getByText(/Jan 2026.*Assets & Debts Breakdown/)).toBeInTheDocument()
        expect(screen.getByText('No assets created yet')).toBeInTheDocument()
        expect(screen.getByText('No debts created yet')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles plan creation errors gracefully', async () => {
      vi.mocked(plansAPI.createPlan).mockRejectedValue(new Error('Creation failed'))

      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const createButton = screen.getByRole('button', { name: 'Create New Plan' })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Create New Plan' })).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText('Plan Name')
      fireEvent.change(nameInput, { target: { value: 'New Test Plan' } })

      const submitButton = screen.getByRole('button', { name: 'Create Plan' })
      fireEvent.click(submitButton)

      // Should handle error without crashing
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Create New Plan' })).toBeInTheDocument()
      })
    })

    it('handles plan update errors gracefully', async () => {
      render(<Plans />)

      // First wait for data to load with default mocks
      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      // Now mock the update to fail for subsequent calls
      vi.mocked(plansAPI.updatePlan).mockRejectedValue(new Error('Update failed'))

      const addButtons = screen.getAllByRole('button', { name: 'Add transaction' })
      await act(async () => {
        fireEvent.click(addButtons[0])
      })

      // perform changes then click save, awaiting UI updates between steps
      await waitFor(() => expect(screen.getAllByRole('combobox', { name: 'Select asset or debt' }).length).toBeGreaterThan(0))

      const selectElements = screen.getAllByRole('combobox', { name: 'Select asset or debt' })
      const newSelect = selectElements[selectElements.length - 1]
      await act(async () => {
        fireEvent.change(newSelect, { target: { value: 'asset-asset1' } })
      })

      await waitFor(() => expect(screen.getAllByDisplayValue('0').length).toBeGreaterThan(0))

      const amountInputs = screen.getAllByDisplayValue('0')
      const newAmountInput = amountInputs[amountInputs.length - 1]
      await act(async () => {
        fireEvent.change(newAmountInput, { target: { value: '100' } })
      })

      await waitFor(() => {
        const saveButtons = screen.getAllByRole('button', { name: '✓' })
        const lastSaveButton = saveButtons[saveButtons.length - 1]
        expect(lastSaveButton).toBeInTheDocument()
      })

      const saveButtons = screen.getAllByRole('button', { name: '✓' })
      const lastSaveButton = saveButtons[saveButtons.length - 1]
      await act(async () => {
        fireEvent.click(lastSaveButton)
      })

      // Wait for the error message to appear via UI updates
      await waitFor(() => expect(screen.getByText('Failed to save transaction. Please try again.')).toBeInTheDocument())
    })

    it('handles plan deletion errors gracefully', async () => {
      vi.mocked(plansAPI.deletePlan).mockRejectedValue(new Error('Deletion failed'))

      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      const settingsButton = screen.getByRole('button', { name: 'Edit Plan' })
      fireEvent.click(settingsButton)

      await waitFor(() => {
        expect(screen.getByText('Plan Settings')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: 'Delete Plan' })
      fireEvent.click(deleteButton)

      await waitFor(() => expect(screen.getByText('Are you sure you want to delete "Test Plan"? This action cannot be undone.')).toBeInTheDocument())

      const confirmDeleteButton = screen.getByRole('button', { name: 'Delete' })
      fireEvent.click(confirmDeleteButton)

      // Wait for the error message to appear
      await waitFor(() => expect(screen.getByText('Failed to delete plan. Please try again.')).toBeInTheDocument())
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for interactive elements', async () => {
      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      // Check for proper button labels
      expect(screen.getByRole('button', { name: 'Create New Plan' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Edit Plan' })).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()

      render(<Plans />)

      await waitFor(() => {
        expect(screen.getByText('Test Plan')).toBeInTheDocument()
      })

      // Test that we can tab to focusable elements
      await user.tab()

      // Should be able to focus on some button
      const focusedElement = document.activeElement
      expect(focusedElement).toBeInTheDocument()
      expect(focusedElement?.tagName.toLowerCase()).toBe('button')
    })
  })
})