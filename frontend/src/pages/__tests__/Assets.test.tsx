import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Assets } from '../Assets'
import { assetsAPI, debtsAPI } from '../../api/client'
import { versionSyncService } from '../../services/versionSyncService'
import { getCurrentUserId, useAuth } from '../../utils/auth'

// Mock useAuth BEFORE any other mocks
vi.mock('../../utils/auth', () => ({
  useAuth: vi.fn(),
  getCurrentUserId: vi.fn(),
}))

const mockUseAuth = vi.mocked(useAuth)

// Mock React Router
vi.mock('react-router-dom', () => ({
  NavLink: ({ children, to }: any) => <a href={to} data-testid={`nav-link-${to}`}>{children}</a>,
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
}))

// Mock all other dependencies
vi.mock('../../api/client', () => ({
  assetsAPI: {
    getAssets: vi.fn(),
    createAsset: vi.fn(),
    updateAsset: vi.fn(),
    deleteAsset: vi.fn(),
  },
  debtsAPI: {
    getDebts: vi.fn(),
    createDebt: vi.fn(),
    updateDebt: vi.fn(),
    deleteDebt: vi.fn(),
  },
}))

vi.mock('../../services/versionSyncService', () => ({
  versionSyncService: { storeData: vi.fn() },
}))

vi.mock('../components/Nav', () => ({
  Nav: () => <div data-testid="nav">Navigation</div>,
}))

vi.mock('../components/Footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}))

vi.mock('../components/SortableAssetItem', () => ({
  SortableAssetItem: ({ asset, onEdit, onDelete }: any) => (
    <div data-testid={`asset-${asset.id}`}>
      <span>{asset.name}</span>
      <button onClick={() => onEdit(asset)} data-testid={`edit-asset-${asset.id}`}>
        Edit
      </button>
      <button onClick={() => onDelete(asset)} data-testid={`delete-asset-${asset.id}`}>
        Delete
      </button>
    </div>
  ),
}))

vi.mock('../components/SortableDebtItem', () => ({
  SortableDebtItem: ({ debt, onEdit, onDelete }: any) => (
    <div data-testid={`debt-${debt.id}`}>
      <span>{debt.name}</span>
      <button onClick={() => onEdit(debt)} data-testid={`edit-debt-${debt.id}`}>
        Edit
      </button>
      <button onClick={() => onDelete(debt)} data-testid={`delete-debt-${debt.id}`}>
        Delete
      </button>
    </div>
  ),
}))

// Mock drag and drop libraries
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(),
}))

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: vi.fn((array, oldIndex, newIndex) => {
    const result = [...array]
    const [removed] = result.splice(oldIndex, 1)
    result.splice(newIndex, 0, removed)
    return result
  }),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
  SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
}))

vi.mock('../Assets.css', () => ({}))

describe('Assets Component', () => {
  const mockUserId = 'user123'
  const mockAssets = [
    {
      id: 'asset1',
      name: 'Savings Account',
      currentValue: 10000,
      annualAPY: 2.5,
      notes: 'Emergency fund',
    },
    {
      id: 'asset2',
      name: 'Investment Portfolio',
      currentValue: 50000,
      annualAPY: 7.0,
      notes: '',
    },
  ]

  const mockDebts = [
    {
      id: 'debt1',
      name: 'Student Loan',
      currentBalance: 25000,
      interestRate: 4.5,
      minimumPayment: 300,
      notes: 'Federal loan',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    ;(assetsAPI.getAssets as any).mockResolvedValue({ data: mockAssets })
    ;(debtsAPI.getDebts as any).mockResolvedValue({ data: mockDebts })
    ;(getCurrentUserId as any).mockResolvedValue(mockUserId)
    mockUseAuth.mockReturnValue({ user: { username: 'testuser' }, signOut: vi.fn() })
  })

  describe('Initial Rendering and Data Loading', () => {
    it('renders loading state initially', () => {
      render(<Assets />)
      // The component starts in loading state, so net worth should be $0.00
      expect(screen.getAllByText('$0.00')).toHaveLength(3) // Net worth, assets total, debts total
    })

    it('renders navigation and footer', async () => {
      render(<Assets />)
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument()
        expect(screen.getByRole('contentinfo')).toBeInTheDocument()
      })
    })

    it('loads and displays assets and debts', async () => {
      render(<Assets />)

      await waitFor(() => {
        expect(screen.getByText('Savings Account')).toBeInTheDocument()
        expect(screen.getByText('Investment Portfolio')).toBeInTheDocument()
        expect(screen.getByText('Student Loan')).toBeInTheDocument()
      })
    })

    it('calculates and displays net worth correctly', async () => {
      render(<Assets />)

      await waitFor(() => {
        // Assets total: 10000 + 50000 = 60000
        // Debts total: 25000
        // Net worth: 60000 - 25000 = 35000
        expect(screen.getByText('$35,000.00')).toBeInTheDocument()
      })
    })

    it('handles API errors gracefully', async () => {
      ;(assetsAPI.getAssets as any).mockRejectedValue(new Error('API Error'))

      render(<Assets />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load assets and debts. Please try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Asset CRUD Operations', () => {
    it('opens create asset modal when clicking "Create Asset"', async () => {
      render(<Assets />)

      await waitFor(() => {
        expect(screen.getByTitle('Add new asset')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTitle('Add new asset'))
      expect(screen.getByText('Create New Asset')).toBeInTheDocument()
    })

    it('creates a new asset successfully', async () => {
      const newAsset = {
        id: 'asset3',
        name: 'New Asset',
        currentValue: 15000,
        annualAPY: 3.0,
        notes: 'Test asset',
      }

      ;(assetsAPI.createAsset as any).mockResolvedValue({ data: newAsset })

      render(<Assets />)

      // Open create modal
      fireEvent.click(screen.getByTitle('Add new asset'))

      await waitFor(() => {
        expect(screen.getByText('Create New Asset')).toBeInTheDocument()
      })

      // Fill form
      const nameInput = screen.getByLabelText(/name/i)
      const valueInput = screen.getByLabelText(/current value/i)
      const apyInput = screen.getByLabelText(/annual apy/i)
      const notesInput = screen.getByLabelText(/notes/i)

      fireEvent.change(nameInput, { target: { value: 'New Asset' } })
      fireEvent.change(valueInput, { target: { value: '15000' } })
      fireEvent.change(apyInput, { target: { value: '3.0' } })
      fireEvent.change(notesInput, { target: { value: 'Test asset' } })

      // Submit the form by finding the form element
      const form = nameInput.closest('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(assetsAPI.createAsset).toHaveBeenCalledWith({
          name: 'New Asset',
          currentValue: 15000,
          annualAPY: 3.0,
          notes: 'Test asset',
        })
        expect(versionSyncService.storeData).toHaveBeenCalled()
      })
    })

    it('opens edit modal when clicking edit button on asset', async () => {
      render(<Assets />)

      await waitFor(() => {
        expect(screen.getByTestId('edit-asset-asset1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('edit-asset-asset1'))

      await waitFor(() => {
        expect(screen.getByText('Edit Asset')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Savings Account')).toBeInTheDocument()
      })
    })

    it('updates an asset successfully', async () => {
      const updatedAsset = { ...mockAssets[0], name: 'Updated Savings' }
      ;(assetsAPI.updateAsset as any).mockResolvedValue({ data: updatedAsset })

      render(<Assets />)

      await waitFor(() => {
        expect(screen.getByTestId('edit-asset-asset1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('edit-asset-asset1'))

      await waitFor(() => {
        expect(screen.getByText('Edit Asset')).toBeInTheDocument()
      })

      // Change name
      fireEvent.change(screen.getByDisplayValue('Savings Account'), {
        target: { value: 'Updated Savings' }
      })

      // Submit the form by finding the form element
      const nameInput = screen.getByDisplayValue('Updated Savings')
      const form = nameInput.closest('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(assetsAPI.updateAsset).toHaveBeenCalled()
        expect(versionSyncService.storeData).toHaveBeenCalled()
      })
    })

    it('deletes an asset after confirmation', async () => {
      ;(assetsAPI.deleteAsset as any).mockResolvedValue({})

      render(<Assets />)

      await waitFor(() => {
        expect(screen.getByTestId('edit-asset-asset1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('edit-asset-asset1'))

      await waitFor(() => {
        expect(screen.getByText('Edit Asset')).toBeInTheDocument()
      })

      // Click delete button in edit modal
      const deleteButtons = screen.getAllByText('Delete Asset')
      fireEvent.click(deleteButtons[0]) // Click the first one (in edit modal)

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument()
      })

      // Confirm deletion
      fireEvent.click(screen.getByRole('button', { name: /delete asset/i }))

      await waitFor(() => {
        expect(assetsAPI.deleteAsset).toHaveBeenCalledWith('asset1')
        expect(versionSyncService.storeData).toHaveBeenCalled()
      })
    })

    it('cancels delete and returns to edit modal', async () => {
      render(<Assets />)

      await waitFor(() => {
        expect(screen.getByTestId('edit-asset-asset1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('edit-asset-asset1'))

      await waitFor(() => {
        expect(screen.getByText('Edit Asset')).toBeInTheDocument()
      })

      // Click delete button in edit modal
      const deleteButtons = screen.getAllByText('Delete Asset')
      fireEvent.click(deleteButtons[0]) // Click the first one (in edit modal)

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument()
      })

      // Click cancel on delete confirmation
      fireEvent.click(screen.getByText('Cancel'))

      // Should be back to edit modal
      expect(screen.getByText('Edit Asset')).toBeInTheDocument()
    })
  })

  describe('Debt CRUD Operations', () => {
    it('opens create debt modal when clicking "Create Debt"', async () => {
      render(<Assets />)

      await waitFor(() => {
        expect(screen.getByTitle('Add new debt')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTitle('Add new debt'))
      expect(screen.getByText('Create New Debt')).toBeInTheDocument()
    })

    it('creates a new debt successfully', async () => {
      const newDebt = {
        id: 'debt2',
        name: 'Car Loan',
        currentBalance: 20000,
        interestRate: 5.5,
        minimumPayment: 400,
        notes: 'Auto loan',
      }

      ;(debtsAPI.createDebt as any).mockResolvedValue({ data: newDebt })

      render(<Assets />)

      // Open create modal
      fireEvent.click(screen.getByTitle('Add new debt'))

      await waitFor(() => {
        expect(screen.getByText('Create New Debt')).toBeInTheDocument()
      })

      // Fill form
      const nameInput = screen.getByLabelText(/name/i)
      const balanceInput = screen.getByLabelText(/current balance/i)
      const rateInput = screen.getByLabelText(/interest rate/i)
      const paymentInput = screen.getByLabelText(/minimum payment/i)
      const notesInput = screen.getByLabelText(/notes/i)

      fireEvent.change(nameInput, { target: { value: 'Car Loan' } })
      fireEvent.change(balanceInput, { target: { value: '20000' } })
      fireEvent.change(rateInput, { target: { value: '5.5' } })
      fireEvent.change(paymentInput, { target: { value: '400' } })
      fireEvent.change(notesInput, { target: { value: 'Auto loan' } })

      // Submit the form by finding the form element
      const form = nameInput.closest('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(debtsAPI.createDebt).toHaveBeenCalledWith({
          name: 'Car Loan',
          currentBalance: 20000,
          interestRate: 5.5,
          minimumPayment: 400,
          notes: 'Auto loan',
        })
        expect(versionSyncService.storeData).toHaveBeenCalled()
      })
    })

    it('opens edit modal when clicking edit button on debt', async () => {
      render(<Assets />)

      await waitFor(() => {
        expect(screen.getByTestId('edit-debt-debt1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('edit-debt-debt1'))

      await waitFor(() => {
        expect(screen.getByText('Edit Debt')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Student Loan')).toBeInTheDocument()
      })
    })

    it('updates a debt successfully', async () => {
      const updatedDebt = { ...mockDebts[0], name: 'Updated Student Loan' }
      ;(debtsAPI.updateDebt as any).mockResolvedValue({ data: updatedDebt })

      render(<Assets />)

      await waitFor(() => {
        expect(screen.getByTestId('edit-debt-debt1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('edit-debt-debt1'))

      await waitFor(() => {
        expect(screen.getByText('Edit Debt')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Student Loan')).toBeInTheDocument()
      })

      // Change name
      fireEvent.change(screen.getByDisplayValue('Student Loan'), {
        target: { value: 'Updated Student Loan' }
      })

      // Submit the form by finding the form element
      const nameInput = screen.getByDisplayValue('Updated Student Loan')
      const form = nameInput.closest('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(debtsAPI.updateDebt).toHaveBeenCalled()
        expect(versionSyncService.storeData).toHaveBeenCalled()
      })
    })

    it('deletes a debt after confirmation', async () => {
      ;(debtsAPI.deleteDebt as any).mockResolvedValue({})

      render(<Assets />)

      await waitFor(() => {
        expect(screen.getByTestId('edit-debt-debt1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('edit-debt-debt1'))

      await waitFor(() => {
        expect(screen.getByText('Edit Debt')).toBeInTheDocument()
      })

      // Click delete button in edit modal
      const deleteButtons = screen.getAllByText('Delete Debt')
      fireEvent.click(deleteButtons[0]) // Click the first one (in edit modal)

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument()
      })

      // Confirm deletion - click the delete button in the confirmation modal
      fireEvent.click(screen.getByRole('button', { name: /delete debt/i }))

      await waitFor(() => {
        expect(debtsAPI.deleteDebt).toHaveBeenCalledWith('debt1')
        expect(versionSyncService.storeData).toHaveBeenCalled()
      })
    })
  })

  describe('Modal State Management', () => {
    it('closes modals when clicking outside', async () => {
      render(<Assets />)

      // Open create modal
      fireEvent.click(screen.getByTitle('Add new asset'))

      await waitFor(() => {
        expect(screen.getByText('Create New Asset')).toBeInTheDocument()
      })

      // Click outside modal (on backdrop)
      const backdrop = document.querySelector('.modal-overlay')
      if (backdrop) {
        fireEvent.click(backdrop)
      }

      expect(screen.queryByText('Create New Asset')).not.toBeInTheDocument()
    })

    it('closes modals with cancel buttons', async () => {
      render(<Assets />)

      // Open create modal
      fireEvent.click(screen.getByTitle('Add new asset'))

      await waitFor(() => {
        expect(screen.getByText('Create New Asset')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Cancel'))
      expect(screen.queryByText('Create New Asset')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('displays error message on create failure', async () => {
      ;(assetsAPI.createAsset as any).mockRejectedValue(new Error('Create failed'))

      render(<Assets />)

      // Open create modal
      fireEvent.click(screen.getByTitle('Add new asset'))

      await waitFor(() => {
        expect(screen.getByText('Create New Asset')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test Asset' } })
      
      // Submit the form
      fireEvent.click(screen.getByText('Create Asset'))

      await waitFor(() => {
        expect(screen.getByText('Failed to create asset. Please try again.')).toBeInTheDocument()
      })
    })

    it('displays error message on update failure', async () => {
      ;(assetsAPI.updateAsset as any).mockRejectedValue(new Error('Update failed'))

      render(<Assets />)

      await waitFor(() => {
        expect(screen.getByTestId('edit-asset-asset1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('edit-asset-asset1'))

      await waitFor(() => {
        expect(screen.getByText('Edit Asset')).toBeInTheDocument()
      })

      // Submit the form by finding the form element
      const nameInput = screen.getByDisplayValue('Savings Account')
      const form = nameInput.closest('form')
      if (form) {
        fireEvent.submit(form)
      }

      // Close the modal to see the error message
      fireEvent.click(screen.getByText('Cancel'))

      await waitFor(() => {
        expect(screen.getByText('Failed to update asset. Please try again.')).toBeInTheDocument()
      })
    })

    it('displays error message on delete failure', async () => {
      ;(assetsAPI.deleteAsset as any).mockRejectedValue(new Error('Delete failed'))

      render(<Assets />)

      await waitFor(() => {
        expect(screen.getByTestId('edit-asset-asset1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('edit-asset-asset1'))

      await waitFor(() => {
        expect(screen.getByText('Edit Asset')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Delete Asset'))

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument()
      })

      // Click the delete button in the confirmation modal
      const deleteButtons = screen.getAllByText('Delete Asset')
      fireEvent.click(deleteButtons[1]) // The second one is the button, not the heading

      await waitFor(() => {
        expect(screen.getByText('Failed to delete asset. Please try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Drag and Drop', () => {
    it('renders drag and drop context', async () => {
      render(<Assets />)

      await waitFor(() => {
        expect(screen.getAllByTestId('dnd-context')).toHaveLength(2) // One for assets, one for debts
      })
    })
  })

  describe('Calculations', () => {
    it('calculates assets total correctly', async () => {
      render(<Assets />)

      await waitFor(() => {
        expect(screen.getByText('Assets: $60,000.00')).toBeInTheDocument()
      })
    })

    it('calculates debts total correctly', async () => {
      render(<Assets />)

      await waitFor(() => {
        expect(screen.getByText('Debts: $25,000.00')).toBeInTheDocument()
      })
    })

    it('updates net worth when assets change', async () => {
      const newAsset = {
        id: 'asset3',
        name: 'New Asset',
        currentValue: 10000,
        annualAPY: 0,
        notes: '',
      }

      ;(assetsAPI.createAsset as any).mockResolvedValue({ data: newAsset })

      render(<Assets />)

      // Open create modal
      fireEvent.click(screen.getByTitle('Add new asset'))

      await waitFor(() => {
        expect(screen.getByText('Create New Asset')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New Asset' } })
      fireEvent.change(screen.getByLabelText(/current value/i), { target: { value: '10000' } })
      
      // Submit the form
      fireEvent.click(screen.getByText('Create Asset'))

      await waitFor(() => {
        // Original net worth: 35000 + 10000 = 45000
        expect(screen.getByText('$45,000.00')).toBeInTheDocument()
      })
    })
  })
})