import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SortableDebtItem, Debt } from '../components/SortableDebtItem'
import { DndContext } from '@dnd-kit/core'

// Mock DndContext and its hooks
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSortable: () => ({
    attributes: {},
    listeners: { onClick: vi.fn() },
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  closestCenter: vi.fn(),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => '',
    },
  },
}))

describe('SortableDebtItem', () => {
  const mockDebt: Debt = {
    id: '1',
    userId: 'user-1',
    name: 'Student Loan',
    currentBalance: 25000,
    interestRate: 5.25,
    minimumPayment: 350,
    notes: 'Federal student loan',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  const mockOnEdit = vi.fn()

  it('renders debt information correctly', () => {
    render(
      <DndContext>
        <SortableDebtItem debt={mockDebt} onEdit={mockOnEdit} />
      </DndContext>
    )

    expect(screen.getByText('Student Loan')).toBeInTheDocument()
    expect(screen.getByText('$25,000.00')).toBeInTheDocument()
    expect(screen.getByText('5.25%')).toBeInTheDocument()
    expect(screen.getByText('$350.00')).toBeInTheDocument()
    expect(screen.getByText('Federal student loan')).toBeInTheDocument()
  })

  it('displays debt balance with proper formatting', () => {
    const largeDebt: Debt = {
      ...mockDebt,
      currentBalance: 987654.32,
    }

    render(
      <DndContext>
        <SortableDebtItem debt={largeDebt} onEdit={mockOnEdit} />
      </DndContext>
    )

    expect(screen.getByText('$987,654.32')).toBeInTheDocument()
  })

  it('displays minimum payment with proper formatting', () => {
    const highPaymentDebt: Debt = {
      ...mockDebt,
      minimumPayment: 1250.75,
    }

    render(
      <DndContext>
        <SortableDebtItem debt={highPaymentDebt} onEdit={mockOnEdit} />
      </DndContext>
    )

    expect(screen.getByText('$1,250.75')).toBeInTheDocument()
  })

  it('displays interest rate with one decimal place', () => {
    const debtWithDecimalRate: Debt = {
      ...mockDebt,
      interestRate: 7.89,
    }

    render(
      <DndContext>
        <SortableDebtItem debt={debtWithDecimalRate} onEdit={mockOnEdit} />
      </DndContext>
    )

    expect(screen.getByText('7.89%')).toBeInTheDocument()
  })

  it('shows placeholder text when notes are empty', () => {
    const debtWithoutNotes: Debt = {
      ...mockDebt,
      notes: undefined,
    }

    render(
      <DndContext>
        <SortableDebtItem debt={debtWithoutNotes} onEdit={mockOnEdit} />
      </DndContext>
    )

    expect(screen.getByText('No notes')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    render(
      <DndContext>
        <SortableDebtItem debt={mockDebt} onEdit={mockOnEdit} />
      </DndContext>
    )

    const editButton = screen.getByRole('button', { name: /edit/i })
    fireEvent.click(editButton)

    expect(mockOnEdit).toHaveBeenCalledWith(mockDebt)
  })

  it('has proper accessibility attributes', () => {
    render(
      <DndContext>
        <SortableDebtItem debt={mockDebt} onEdit={mockOnEdit} />
      </DndContext>
    )

    // Check for drag handle with proper accessibility
    const dragHandle = screen.getByLabelText('Drag to reorder Student Loan')
    expect(dragHandle).toBeInTheDocument()
  })

  it('displays zero balance correctly', () => {
    const zeroBalanceDebt: Debt = {
      ...mockDebt,
      currentBalance: 0,
    }

    render(
      <DndContext>
        <SortableDebtItem debt={zeroBalanceDebt} onEdit={mockOnEdit} />
      </DndContext>
    )

    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  it('displays zero minimum payment correctly', () => {
    const zeroPaymentDebt: Debt = {
      ...mockDebt,
      minimumPayment: 0,
    }

    render(
      <DndContext>
        <SortableDebtItem debt={zeroPaymentDebt} onEdit={mockOnEdit} />
      </DndContext>
    )

    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })
})