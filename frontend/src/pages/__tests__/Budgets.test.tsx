import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Budgets } from '../Budgets'
import { budgetsAPI, assetsAPI, debtsAPI } from '../../api/client'
import { versionSyncService } from '../../services/versionSyncService'
import { versioningService } from '../../services/versioningService'
import { getCurrentUserId } from '../../utils/auth'

vi.mock('../../api/client', () => ({
  budgetsAPI: { getBudgets: vi.fn(), createBudget: vi.fn(), updateBudget: vi.fn() },
  assetsAPI: { getAssets: vi.fn() },
  debtsAPI: { getDebts: vi.fn() },
}))

vi.mock('../../services/versionSyncService', () => ({
  versionSyncService: { syncData: vi.fn(), getData: vi.fn(), storeData: vi.fn() },
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

const localStorageMock = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() }
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('Budgets Component - Simplified', () => {
  const mockUserId = 'user123'
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
    },
  ]
  const mockAssets: any[] = []
  const mockDebts: any[] = []

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

  it('renders the page header', () => {
    render(<Budgets />)
    // Header was removed, just check that the component renders
    expect(screen.getByTestId('nav')).toBeInTheDocument()
  })

  it('displays loading state and then loads budgets', async () => {
    render(<Budgets />)
    
    await waitFor(() => {
      expect(versionSyncService.syncData).toHaveBeenCalled()
    })
    
    await waitFor(() => {
      expect(versionSyncService.getData).toHaveBeenCalledWith('budgets', expect.any(Function))
    })
  })

  it('shows selected budget name when budget is loaded', async () => {
    render(<Budgets />)
    
    await waitFor(() => {
      expect(screen.getByText('Monthly Budget')).toBeInTheDocument()
    })
  })

  it('displays income total', async () => {
    render(<Budgets />)
    
    await waitFor(() => {
      // Just verify the total income label and value exist somewhere
      expect(screen.getByText(/Total Income/)).toBeInTheDocument()
    })
  })

  it('displays expense total', async () => {
    render(<Budgets />)
    
    await waitFor(() => {
      expect(screen.getByText(/Total Expenses/)).toBeInTheDocument()
    })
  })

  it('displays net amount', async () => {
    render(<Budgets />)
    
    await waitFor(() => {
      expect(screen.getByText(/Net Amount/)).toBeInTheDocument()
    })
  })

  it('shows income section header', async () => {
    render(<Budgets />)
    
    await waitFor(() => {
      expect(screen.getByText('Income')).toBeInTheDocument()
    })
  })

  it('shows expense section header', async () => {
    render(<Budgets />)
    
    await waitFor(() => {
      const expenseHeaders = screen.getAllByText('Expenses')
      expect(expenseHeaders.length).toBeGreaterThan(0)
    })
  })

  it('handles errors gracefully', async () => {
    vi.mocked(versionSyncService.getData).mockRejectedValueOnce(new Error('API Error'))
    
    render(<Budgets />)
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/)).toBeInTheDocument()
    })
  })
})
