import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Budgets } from '../Budgets'
import { budgetsAPI, assetsAPI, debtsAPI } from '../../api/client'
import { versionSyncService } from '../../services/versionSyncService'
import { versioningService } from '../../services/versioningService'
import { getCurrentUserId } from '../../utils/auth'
import { Budget, Asset, Debt } from '../../types'

vi.mock('../../api/client', () => ({
  budgetsAPI: {
    getBudgets: vi.fn(),
    createBudget: vi.fn(),
    updateBudget: vi.fn()
  },
  assetsAPI: { getAssets: vi.fn() },
  debtsAPI: { getDebts: vi.fn() },
}))

vi.mock('../../services/versionSyncService', () => ({
  versionSyncService: {
    syncData: vi.fn(),
    getData: vi.fn(),
    storeData: vi.fn()
  },
}))

vi.mock('../../services/versioningService', () => ({
  versioningService: { storeData: vi.fn() },
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

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('Budgets Component - Comprehensive Tests', () => {
  const mockUserId = 'user123'
  const mockBudgets: Budget[] = [
    {
      id: 'budget1',
      userId: mockUserId,
      name: 'Monthly Budget',
      isActive: true,
      income: [
        { id: 'inc1', name: 'Salary', amount: 5000, category: 'Employment' },
        { id: 'inc2', name: 'Freelance', amount: 1000, category: 'Self-Employment' }
      ],
      expenses: [
        { id: 'exp1', name: 'Rent', amount: 1500, category: 'Housing', type: 'regular' as const },
        { id: 'exp2', name: 'Car Payment', amount: 300, category: '', type: 'debt' as const, linkedDebtId: 'debt1' }
      ],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'budget2',
      userId: mockUserId,
      name: 'Vacation Fund',
      isActive: false,
      income: [],
      expenses: [],
      createdAt: '2025-01-02T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    }
  ]

  const mockAssets: Asset[] = [
    { id: 'asset1', userId: mockUserId, name: 'Emergency Fund', type: 'Savings', value: 10000, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }
  ]

  const mockDebts: Debt[] = [
    { id: 'debt1', userId: mockUserId, name: 'Car Loan', type: 'Auto', balance: 15000, minimumPayment: 300, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()

    vi.mocked(getCurrentUserId).mockResolvedValue(mockUserId)
    vi.mocked(versionSyncService.syncData).mockResolvedValue()
    vi.mocked(versionSyncService.getData).mockImplementation(async (entityType: string) => {
      if (entityType === 'budgets') return mockBudgets
      if (entityType === 'assets') return mockAssets
      if (entityType === 'debts') return mockDebts
      return []
    })

    vi.mocked(budgetsAPI.getBudgets).mockResolvedValue({ data: mockBudgets } as any)
    vi.mocked(assetsAPI.getAssets).mockResolvedValue({ data: mockAssets } as any)
    vi.mocked(debtsAPI.getDebts).mockResolvedValue({ data: mockDebts } as any)
    vi.mocked(versioningService.storeData).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Initial Loading and Data Fetching', () => {
    it('renders navigation and footer components', () => {
      render(<Budgets />)
      expect(screen.getByTestId('nav')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    it('displays loading state initially', () => {
      render(<Budgets />)
      expect(screen.getByText('Budgets')).toBeInTheDocument()
    })

    it('loads and displays budgets data correctly', async () => {
      render(<Budgets />)

      await waitFor(() => {
        expect(versionSyncService.syncData).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(versionSyncService.getData).toHaveBeenCalledWith('budgets', expect.any(Function))
        expect(versionSyncService.getData).toHaveBeenCalledWith('assets', expect.any(Function))
        expect(versionSyncService.getData).toHaveBeenCalledWith('debts', expect.any(Function))
      })

      await waitFor(() => {
        expect(screen.getByText('Monthly Budget')).toBeInTheDocument()
      })
    })

    it('selects the active budget by default', async () => {
      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('Monthly Budget')).toBeInTheDocument()
      })

      // Check that the active budget is selected (should have different styling)
      const budgetElements = screen.getAllByText('Monthly Budget')
      expect(budgetElements.length).toBeGreaterThan(0)
    })

    it('displays budget summary with correct calculations', async () => {
      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('Monthly Budget')).toBeInTheDocument()
      })

      // Check totals: Income = 5000 + 1000 = 6000, Expenses = 1500 + 300 = 1800, Net = 4200
      expect(screen.getByText('$6,000.00')).toBeInTheDocument() // Total Income
      expect(screen.getByText('$1,800.00')).toBeInTheDocument() // Total Expenses
      expect(screen.getByText('$4,200.00')).toBeInTheDocument() // Net Amount
    })

    it('displays income and expense sections', async () => {
      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('Income')).toBeInTheDocument()
        expect(screen.getByText('Expenses')).toBeInTheDocument()
      })
    })

    it('displays individual income items with correct details', async () => {
      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('Salary')).toBeInTheDocument()
        expect(screen.getByText('Freelance')).toBeInTheDocument()
        expect(screen.getByText('Employment')).toBeInTheDocument()
        expect(screen.getByText('Self-Employment')).toBeInTheDocument()
        expect(screen.getByText('$5,000.00')).toBeInTheDocument()
        expect(screen.getByText('$1,000.00')).toBeInTheDocument()
      })
    })

    it('displays individual expense items with correct details', async () => {
      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('Rent')).toBeInTheDocument()
        expect(screen.getByText('Car Payment')).toBeInTheDocument()
        expect(screen.getByText('Housing')).toBeInTheDocument()
        expect(screen.getByText('$1,500.00')).toBeInTheDocument()
        expect(screen.getByText('$300.00')).toBeInTheDocument()
      })
    })
  })

  describe('Budget Management', () => {
    it('displays all budgets in the sidebar', async () => {
      const user = userEvent.setup()
      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('Monthly Budget')).toBeInTheDocument()
      })

      // Click the Show Budgets button to expand the sidebar
      const showBudgetsButton = screen.getByText('Show Budgets')
      await user.click(showBudgetsButton)

      await waitFor(() => {
        expect(screen.getByText('Vacation Fund')).toBeInTheDocument()
      })
    })

    it('allows switching between budgets', async () => {
      const user = userEvent.setup()
      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('Monthly Budget')).toBeInTheDocument()
      })

      // Click the Show Budgets button to expand the sidebar
      const showBudgetsButton = screen.getByText('Show Budgets')
      await user.click(showBudgetsButton)

      await waitFor(() => {
        expect(screen.getByText('Vacation Fund')).toBeInTheDocument()
      })

      // Click on the Vacation Fund budget
      const vacationBudget = screen.getByText('Vacation Fund')
      await user.click(vacationBudget)

      // Verify the budget was selected (API should be called)
      await waitFor(() => {
        expect(budgetsAPI.updateBudget).toHaveBeenCalled()
      })
    })

    it('creates a new budget successfully', async () => {
      const user = userEvent.setup()
      const newBudgetName = 'New Test Budget'

      vi.mocked(budgetsAPI.createBudget).mockResolvedValue({
        data: {
          id: 'budget3',
          userId: mockUserId,
          name: newBudgetName,
          isActive: false,
          income: [],
          expenses: [],
          createdAt: '2025-01-03T00:00:00Z',
          updatedAt: '2025-01-03T00:00:00Z',
        }
      } as any)

      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('Create New Budget')).toBeInTheDocument()
      })

      // Click create new budget button
      const createButton = screen.getByText('Create New Budget')
      await user.click(createButton)

      // Fill out the form
      const nameInput = screen.getByLabelText('Budget Name')
      await user.type(nameInput, newBudgetName)

      // Submit the form
      const submitButton = screen.getByRole('button', { name: 'Create Budget' })
      await user.click(submitButton)

      // Verify API was called
      await waitFor(() => {
        expect(budgetsAPI.createBudget).toHaveBeenCalledWith({
          name: newBudgetName,
          isActive: false,
          income: [],
          expenses: []
        })
      })

      // Verify local storage was updated
      expect(versionSyncService.storeData).toHaveBeenCalled()
    })

    it('allows editing budget name inline', async () => {
      const user = userEvent.setup()
      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('Monthly Budget')).toBeInTheDocument()
      })

      // Click on the budget name to edit it
      const budgetName = screen.getByText('Monthly Budget')
      await user.click(budgetName)

      // Should now show an input field
      const nameInput = screen.getByDisplayValue('Monthly Budget')
      expect(nameInput).toBeInTheDocument()

      // Change the name
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Budget Name')

      // Click outside or press Enter to save
      await user.click(document.body)

      // Verify API was called
      await waitFor(() => {
        expect(budgetsAPI.updateBudget).toHaveBeenCalled()
      })
    })
  })

  describe('Income Management', () => {
    it('opens add income modal when Add Income button is clicked', async () => {
      const user = userEvent.setup()
      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('Add Income')).toBeInTheDocument()
      })

      const addIncomeButton = screen.getByText('Add Income')
      await user.click(addIncomeButton)

      expect(screen.getAllByText('Add Income').length).toBeGreaterThan(1)
      expect(screen.getByLabelText('Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Amount')).toBeInTheDocument()
      expect(screen.getByLabelText('Category')).toBeInTheDocument()
    })

    it('adds new income item successfully', async () => {
      const user = userEvent.setup()

      vi.mocked(budgetsAPI.updateBudget).mockResolvedValue({
        data: {
          ...mockBudgets[0],
          income: [
            ...mockBudgets[0].income,
            { id: 'inc3', name: 'Bonus', amount: 2000, category: 'Employment' }
          ]
        }
      } as any)

      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getAllByText('Add Income')[0]).toBeInTheDocument()
      })

      // Open modal
      const addIncomeButtons = screen.getAllByText('Add Income')
      const addButton = addIncomeButtons[0] // The button, not the modal header
      await user.click(addButton)

      // Fill form
      const nameInput = screen.getByLabelText('Name')
      const amountInput = screen.getByLabelText('Amount')
      const categorySelect = screen.getByLabelText('Category')

      await user.type(nameInput, 'Bonus')
      await user.type(amountInput, '2000')
      await user.selectOptions(categorySelect, 'Employment')

      // Submit form
      const form = document.querySelector('form')
      expect(form).toBeInTheDocument()
      await act(async () => {
        fireEvent.submit(form!)
      })

      // Wait for the API call to be made
      await waitFor(() => {
        expect(budgetsAPI.updateBudget).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('allows editing income item name inline', async () => {
      const user = userEvent.setup()
      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('Salary')).toBeInTheDocument()
      })

      // Click on the income name to edit
      const salaryItem = screen.getByText('Salary')
      await user.click(salaryItem)

      // Should show input field
      const nameInput = screen.getByDisplayValue('Salary')
      expect(nameInput).toBeInTheDocument()

      // Change the name
      await user.clear(nameInput)
      await user.type(nameInput, 'Primary Salary')

      // Save by clicking outside
      await user.click(document.body)

      // Verify API was called
      await waitFor(() => {
        expect(budgetsAPI.updateBudget).toHaveBeenCalled()
      })
    })

    it('allows editing income amount inline', async () => {
      const user = userEvent.setup()
      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('$5,000.00')).toBeInTheDocument()
      })

      // Click on the amount to edit
      const amountSpan = screen.getByText('$5,000.00')
      await user.click(amountSpan)

      // Should show input field
      const amountInput = screen.getByDisplayValue('5000')
      expect(amountInput).toBeInTheDocument()

      // Change the amount
      await user.clear(amountInput)
      await user.type(amountInput, '5500')

      // Save
      await user.click(document.body)

      // Verify API was called
      await waitFor(() => {
        expect(budgetsAPI.updateBudget).toHaveBeenCalled()
      })
    })

    it('deletes income item when delete button is clicked', async () => {
      const user = userEvent.setup()
      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('Salary')).toBeInTheDocument()
      })

      // Find and click the delete button for Salary
      const salaryItem = screen.getByText('Salary').closest('.bg-gray-50')
      const deleteButton = within(salaryItem!).getByTitle('Delete income item')
      await user.click(deleteButton)

      // Verify API was called
      await waitFor(() => {
        expect(budgetsAPI.updateBudget).toHaveBeenCalled()
      })
    })
  })

  describe('Expense Management', () => {
    it('opens add expense modal when Add Expense button is clicked', async () => {
      const user = userEvent.setup()
      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getAllByText('Add Expense')[0]).toBeInTheDocument()
      })

      const addExpenseButton = screen.getAllByText('Add Expense')[0]
      await user.click(addExpenseButton)

      // Check that modal is open by looking for modal-specific elements
      const modalHeaders = screen.getAllByText('Add Expense')
      expect(modalHeaders.length).toBeGreaterThan(1) // Button + modal header
      expect(screen.getByLabelText('Type')).toBeInTheDocument()
    })

    it('adds regular expense successfully', async () => {
      const user = userEvent.setup()

      vi.mocked(budgetsAPI.updateBudget).mockResolvedValue({
        data: {
          ...mockBudgets[0],
          expenses: [
            ...mockBudgets[0].expenses,
            { id: 'exp3', name: 'Groceries', amount: 200, category: 'Food', type: 'regular' as const }
          ]
        }
      } as any)

      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getAllByText('Add Expense')[0]).toBeInTheDocument()
      })

      // Open modal
      const addExpenseButtons = screen.getAllByText('Add Expense')
      const addButton = addExpenseButtons[0] // The button, not the modal header
      await user.click(addButton)

      // Fill form for regular expense
      const nameInput = screen.getByLabelText('Name')
      const amountInput = screen.getByLabelText('Amount')
      const categorySelect = screen.getByLabelText('Category')

      await user.type(nameInput, 'Groceries')
      await user.type(amountInput, '200')
      await user.selectOptions(categorySelect, 'Food')

      // Submit form
      const form = document.querySelector('form')
      expect(form).toBeInTheDocument()
      await act(async () => {
        fireEvent.submit(form!)
      })

      // Verify API call
      await waitFor(() => {
        expect(budgetsAPI.updateBudget).toHaveBeenCalled()
      })
    })

    it('adds asset-linked expense successfully', async () => {
      const user = userEvent.setup()

      vi.mocked(budgetsAPI.updateBudget).mockResolvedValue({
        data: {
          ...mockBudgets[0],
          expenses: [
            ...mockBudgets[0].expenses,
            { id: 'exp3', name: 'Savings Deposit', amount: 500, category: '', type: 'asset' as const, linkedAssetId: 'asset1' }
          ]
        }
      } as any)

      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getAllByText('Add Expense')[0]).toBeInTheDocument()
      })

      // Open modal
      const addExpenseButtons = screen.getAllByText('Add Expense')
      const addButton = addExpenseButtons[0] // The button, not the modal header
      await user.click(addButton)

      // Change type to asset
      const typeSelect = screen.getByLabelText('Type')
      await user.selectOptions(typeSelect, 'asset')

      // Fill form
      const nameInput = screen.getByLabelText('Name')
      const amountInput = screen.getByLabelText('Amount')
      const assetSelect = screen.getByLabelText('Asset')

      await user.type(nameInput, 'Savings Deposit')
      await user.type(amountInput, '500')
      await user.selectOptions(assetSelect, 'asset1')

      // Submit form
      const form = document.querySelector('form')
      expect(form).toBeInTheDocument()
      await act(async () => {
        fireEvent.submit(form!)
      })

      // Verify API call
      await waitFor(() => {
        expect(budgetsAPI.updateBudget).toHaveBeenCalled()
      })
    })

    it('adds debt-linked expense successfully', async () => {
      const user = userEvent.setup()

      vi.mocked(budgetsAPI.updateBudget).mockResolvedValue({
        data: {
          ...mockBudgets[0],
          expenses: [
            ...mockBudgets[0].expenses,
            { id: 'exp3', name: 'Credit Card Payment', amount: 150, category: '', type: 'debt' as const, linkedDebtId: 'debt1' }
          ]
        }
      } as any)

      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('Monthly Budget')).toBeInTheDocument()
      })

      // Open modal
      const addExpenseButtons = screen.getAllByText('Add Expense')
      const addButton = addExpenseButtons[0] // The button, not the modal header
      await user.click(addButton)

      // Change type to debt
      const typeSelect = screen.getByLabelText('Type')
      await user.selectOptions(typeSelect, 'debt')

      // Fill form
      const nameInput = screen.getByLabelText('Name')
      const amountInput = screen.getByLabelText('Amount')
      const debtSelect = screen.getByLabelText('Debt')

      await user.type(nameInput, 'Credit Card Payment')
      await user.type(amountInput, '150')
      await user.selectOptions(debtSelect, 'debt1')

      // Submit form
      const form = document.querySelector('form')
      expect(form).toBeInTheDocument()
      await act(async () => {
        fireEvent.submit(form!)
      })

      // Verify API call
      await waitFor(() => {
        expect(budgetsAPI.updateBudget).toHaveBeenCalled()
      })
    })

    it('allows editing expense item name inline', async () => {
      const user = userEvent.setup()
      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('Rent')).toBeInTheDocument()
      })

      // Click on the expense name to edit
      const rentItem = screen.getByText('Rent')
      await user.click(rentItem)

      // Should show input field
      const nameInput = screen.getByDisplayValue('Rent')
      expect(nameInput).toBeInTheDocument()

      // Change the name
      await user.clear(nameInput)
      await user.type(nameInput, 'Monthly Rent')

      // Save
      await user.click(document.body)

      // Verify API was called
      await waitFor(() => {
        expect(budgetsAPI.updateBudget).toHaveBeenCalled()
      })
    })

    it('deletes expense item when delete button is clicked', async () => {
      const user = userEvent.setup()
      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('Rent')).toBeInTheDocument()
      })

      // Find and click the delete button for Rent
      const rentItem = screen.getByText('Rent').closest('.bg-gray-50')
      const deleteButton = within(rentItem!).getByTitle('Delete expense item')
      await user.click(deleteButton)

      // Verify API was called
      await waitFor(() => {
        expect(budgetsAPI.updateBudget).toHaveBeenCalled()
      })
    })
  })

  describe('UI Interactions and States', () => {
    it('minimizes and maximizes budget list', async () => {
      const user = userEvent.setup()
      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('Monthly Budget')).toBeInTheDocument()
      })

      // Initially budgets should be minimized (we see "Show Budgets" button)
      expect(screen.getByText('Show Budgets')).toBeInTheDocument()

      // Click show button to expand
      const showButton = screen.getByText('Show Budgets')
      await user.click(showButton)

      // Now budgets should be visible
      expect(screen.getByText('Your Budgets')).toBeInTheDocument()

      // Click hide button
      const hideButton = screen.getByText('Hide Budgets')
      await user.click(hideButton)

      // Budgets should be hidden again
      expect(screen.getByText('Show Budgets')).toBeInTheDocument()
    })

    it('closes modals when clicking outside', async () => {
      const user = userEvent.setup()
      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('Add Income')).toBeInTheDocument()
      })

      // Open income modal
      const addIncomeButtons = screen.getAllByText('Add Income')
      const addButton = addIncomeButtons[0] // The button, not the modal header
      await user.click(addButton)

      // Modal should be open - look for the modal header specifically
      expect(screen.getByRole('heading', { name: 'Add Income' })).toBeInTheDocument()

      // Click on the modal backdrop (the fixed div with gray background)
      // Find the backdrop by its class
      const backdrop = document.querySelector('.fixed.inset-0.bg-gray-600.bg-opacity-50')
      if (backdrop) {
        await user.click(backdrop)
      }

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Add Income' })).not.toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('closes modals when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('Add Income')).toBeInTheDocument()
      })

      // Open income modal
      const addIncomeButtons = screen.getAllByText('Add Income')
      const addButton = addIncomeButtons[0] // The button, not the modal header
      await user.click(addButton)

      // Modal should be open
      expect(screen.getByRole('heading', { name: 'Add Income' })).toBeInTheDocument()

      // Click cancel
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      // Modal should be closed
      expect(screen.queryByRole('heading', { name: 'Add Income' })).not.toBeInTheDocument()
    })

    it('handles keyboard navigation in edit mode', async () => {
      const user = userEvent.setup()
      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('Salary')).toBeInTheDocument()
      })

      // Click on income name to edit
      const salaryItem = screen.getByText('Salary')
      await user.click(salaryItem)

      const nameInput = screen.getByDisplayValue('Salary')
      expect(nameInput).toBeInTheDocument()

      // Press Escape to cancel editing
      await user.keyboard('{Escape}')

      // Should exit edit mode
      expect(screen.queryByDisplayValue('Salary')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('displays error message when data loading fails', async () => {
      vi.mocked(versionSyncService.getData).mockRejectedValueOnce(new Error('API Error'))

      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText(/Failed to load data/)).toBeInTheDocument()
      })
    })

    it('displays error message when budget creation fails', async () => {
      const user = userEvent.setup()

      vi.mocked(budgetsAPI.createBudget).mockRejectedValueOnce(new Error('Creation failed'))

      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('Create New Budget')).toBeInTheDocument()
      })

      // Open modal and try to create budget
      const createButton = screen.getByText('Create New Budget')
      await user.click(createButton)

      const nameInput = screen.getByLabelText('Budget Name')
      await user.type(nameInput, 'Test Budget')

      const submitButton = screen.getByRole('button', { name: 'Create Budget' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Failed to create budget/)).toBeInTheDocument()
      })
    })

    it('displays error message when income addition fails', async () => {
      const user = userEvent.setup()

      vi.mocked(budgetsAPI.updateBudget).mockRejectedValueOnce(new Error('Update failed'))

      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getAllByText('Add Income')[0]).toBeInTheDocument()
      })

      // Open modal and try to add income
      const addIncomeButtons = screen.getAllByText('Add Income')
      const addButton = addIncomeButtons[0] // The button, not the modal header
      await user.click(addButton)

      const nameInput = screen.getByLabelText('Name')
      const amountInput = screen.getByLabelText('Amount')
      const categorySelect = screen.getByLabelText('Category')

      await user.type(nameInput, 'Test Income')
      await user.type(amountInput, '1000')
      await user.selectOptions(categorySelect, 'Employment')

      // Submit form - this should trigger the error
      const form = document.querySelector('form')
      expect(form).toBeInTheDocument()
      await act(async () => {
        fireEvent.submit(form!)
      })

      // Wait for error to appear
      await waitFor(() => {
        const errorContainer = document.querySelector('.budgets-error-container')
        expect(errorContainer).toBeInTheDocument()
        expect(errorContainer?.textContent).toContain('Failed to add income')
      }, { timeout: 3000 })
    })

    it('displays error message when expense addition fails', async () => {
      const user = userEvent.setup()

      vi.mocked(budgetsAPI.updateBudget).mockRejectedValueOnce(new Error('Update failed'))

      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getAllByText('Add Expense')[0]).toBeInTheDocument()
      })

      // Open modal and try to add expense
      const addExpenseButtons = screen.getAllByText('Add Expense')
      const addButton = addExpenseButtons[0] // The button, not the modal header
      await user.click(addButton)

      const nameInput = screen.getByLabelText('Name')
      const amountInput = screen.getByLabelText('Amount')
      const categorySelect = screen.getByLabelText('Category')

      await user.type(nameInput, 'Test Expense')
      await user.type(amountInput, '500')
      await user.selectOptions(categorySelect, 'Food')

      // Submit form - this should trigger the error
      const form = document.querySelector('form')
      expect(form).toBeInTheDocument()
      await act(async () => {
        fireEvent.submit(form!)
      })

      // Wait for error to appear
      await waitFor(() => {
        const errorContainer = document.querySelector('.budgets-error-container')
        expect(errorContainer).toBeInTheDocument()
        expect(errorContainer?.textContent).toContain('Failed to add expense')
      }, { timeout: 3000 })
    })
  })

  describe('Data Validation and Cleanup', () => {
    it('cleans up orphaned asset expenses on load', async () => {
      const budgetsWithOrphanedExpense = [
        {
          ...mockBudgets[0],
          expenses: [
            ...mockBudgets[0].expenses,
            { id: 'exp3', name: 'Orphaned Asset', amount: 100, category: '', type: 'asset' as const, linkedAssetId: 'nonexistent' }
          ]
        }
      ]

      vi.mocked(versionSyncService.getData).mockImplementation(async (entityType: string) => {
        if (entityType === 'budgets') return budgetsWithOrphanedExpense
        if (entityType === 'assets') return mockAssets
        if (entityType === 'debts') return mockDebts
        return []
      })

      render(<Budgets />)

      await waitFor(() => {
        expect(budgetsAPI.updateBudget).toHaveBeenCalled()
      })

      // Verify the orphaned expense was removed
      const updateCall = vi.mocked(budgetsAPI.updateBudget).mock.calls[0][1]
      expect(updateCall.expenses).toHaveLength(2) // Original 2 expenses, orphaned one removed
      expect(updateCall.expenses.find((e: any) => e.name === 'Orphaned Asset')).toBeUndefined()
    })

    it('cleans up orphaned debt expenses on load', async () => {
      const budgetsWithOrphanedExpense = [
        {
          ...mockBudgets[0],
          expenses: [
            ...mockBudgets[0].expenses,
            { id: 'exp3', name: 'Orphaned Debt', amount: 100, category: '', type: 'debt' as const, linkedDebtId: 'nonexistent' }
          ]
        }
      ]

      vi.mocked(versionSyncService.getData).mockImplementation(async (entityType: string) => {
        if (entityType === 'budgets') return budgetsWithOrphanedExpense
        if (entityType === 'assets') return mockAssets
        if (entityType === 'debts') return mockDebts
        return []
      })

      render(<Budgets />)

      await waitFor(() => {
        expect(budgetsAPI.updateBudget).toHaveBeenCalled()
      })

      // Verify the orphaned expense was removed
      const updateCall = vi.mocked(budgetsAPI.updateBudget).mock.calls[0][1]
      expect(updateCall.expenses.find((e: any) => e.name === 'Orphaned Debt')).toBeUndefined()
    })

    it('validates income amount input (prevents negative values)', async () => {
      const user = userEvent.setup()
      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('$5,000.00')).toBeInTheDocument()
      })

      // Click on amount to edit
      const amountSpan = screen.getByText('$5,000.00')
      await user.click(amountSpan)

      const amountInput = screen.getByDisplayValue('5000')

      // Try to enter negative value
      await user.clear(amountInput)
      await user.type(amountInput, '-100')

      // Try to save
      await user.click(document.body)

      // Should not have called API with invalid value
      expect(budgetsAPI.updateBudget).not.toHaveBeenCalled()
    })

    it('validates expense amount input (prevents negative values)', async () => {
      const user = userEvent.setup()
      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('$1,500.00')).toBeInTheDocument()
      })

      // Click on expense amount to edit
      const amountSpan = screen.getByText('$1,500.00')
      await user.click(amountSpan)

      const amountInput = screen.getByDisplayValue('1500')

      // Try to enter negative value
      await user.clear(amountInput)
      await user.type(amountInput, '-50')

      // Try to save
      await user.click(document.body)

      // Should not have called API with invalid value
      expect(budgetsAPI.updateBudget).not.toHaveBeenCalled()
    })
  })

  describe('Empty States', () => {
    it('shows appropriate message when no budgets exist', async () => {
      vi.mocked(versionSyncService.getData).mockImplementation(async (entityType: string) => {
        if (entityType === 'budgets') return []
        if (entityType === 'assets') return []
        if (entityType === 'debts') return []
        return []
      })

      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText(/haven't created any budgets yet/)).toBeInTheDocument()
      })
    })

    it('shows appropriate message when budget has no income or expenses', async () => {
      const emptyBudget = [{
        ...mockBudgets[0],
        income: [],
        expenses: []
      }]

      vi.mocked(versionSyncService.getData).mockImplementation(async (entityType: string) => {
        if (entityType === 'budgets') return emptyBudget
        if (entityType === 'assets') return []
        if (entityType === 'debts') return []
        return []
      })

      render(<Budgets />)

      await waitFor(() => {
        expect(screen.getByText('Monthly Budget')).toBeInTheDocument()
      })

      // Should show $0.00 for all totals
      expect(screen.getAllByText('$0.00')).toHaveLength(3) // Income, Expenses, Net
    })
  })
})
