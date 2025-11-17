import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SortableAssetItem, Asset } from '../components/SortableAssetItem'
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

describe('SortableAssetItem', () => {
  const mockAsset: Asset = {
    id: '1',
    userId: 'user-1',
    name: 'Emergency Fund',
    currentValue: 5000,
    annualAPY: 2.5,
    notes: 'Savings account',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  const mockOnEdit = vi.fn()

  it('renders asset information correctly', () => {
    render(
      <DndContext>
        <SortableAssetItem asset={mockAsset} onEdit={mockOnEdit} />
      </DndContext>
    )

    expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
    expect(screen.getByText('$5,000.00')).toBeInTheDocument()
    expect(screen.getByText('2.50%')).toBeInTheDocument()
    expect(screen.getByText('Savings account')).toBeInTheDocument()
  })

  it('displays asset value with proper formatting', () => {
    const largeAsset: Asset = {
      ...mockAsset,
      currentValue: 1234567.89,
    }

    render(
      <DndContext>
        <SortableAssetItem asset={largeAsset} onEdit={mockOnEdit} />
      </DndContext>
    )

    expect(screen.getByText('$1,234,567.89')).toBeInTheDocument()
  })

  it('displays APY with one decimal place', () => {
    const assetWithDecimalAPY: Asset = {
      ...mockAsset,
      annualAPY: 3.75,
    }

    render(
      <DndContext>
        <SortableAssetItem asset={assetWithDecimalAPY} onEdit={mockOnEdit} />
      </DndContext>
    )

    expect(screen.getByText('3.75%')).toBeInTheDocument()
  })

  it('shows placeholder text when notes are empty', () => {
    const assetWithoutNotes: Asset = {
      ...mockAsset,
      notes: undefined,
    }

    render(
      <DndContext>
        <SortableAssetItem asset={assetWithoutNotes} onEdit={mockOnEdit} />
      </DndContext>
    )

    expect(screen.getByText('No notes')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    render(
      <DndContext>
        <SortableAssetItem asset={mockAsset} onEdit={mockOnEdit} />
      </DndContext>
    )

    const editButton = screen.getByRole('button', { name: /edit/i })
    fireEvent.click(editButton)

    expect(mockOnEdit).toHaveBeenCalledWith(mockAsset)
  })

  it('has proper accessibility attributes', () => {
    render(
      <DndContext>
        <SortableAssetItem asset={mockAsset} onEdit={mockOnEdit} />
      </DndContext>
    )

    // Check for drag handle with proper accessibility
    const dragHandle = screen.getByLabelText('Drag to reorder Emergency Fund')
    expect(dragHandle).toBeInTheDocument()
  })

  it('displays zero value correctly', () => {
    const zeroValueAsset: Asset = {
      ...mockAsset,
      currentValue: 0,
    }

    render(
      <DndContext>
        <SortableAssetItem asset={zeroValueAsset} onEdit={mockOnEdit} />
      </DndContext>
    )

    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  it('displays negative APY correctly', () => {
    const negativeAPYAsset: Asset = {
      ...mockAsset,
      annualAPY: -1.5,
    }

    render(
      <DndContext>
        <SortableAssetItem asset={negativeAPYAsset} onEdit={mockOnEdit} />
      </DndContext>
    )

    expect(screen.getByText('-1.50%')).toBeInTheDocument()
  })
})