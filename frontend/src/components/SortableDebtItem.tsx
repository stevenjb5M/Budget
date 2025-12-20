import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Debt } from '../types'
import './SortableDebtItem.css'

interface SortableDebtItemProps {
  debt: Debt
  onEdit: (debt: Debt) => void
}

export function SortableDebtItem({ debt, onEdit }: SortableDebtItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: debt.id })

  // Note: Transform styles are required for drag-and-drop functionality
  // These cannot be moved to CSS as they are dynamic values from the library
  const transformStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={transformStyle}
      className={`sortable-debt-item ${isDragging ? 'is-dragging' : ''}`}
    >
      <div className="debt-drag-handle-container">
        <button
          {...attributes}
          {...listeners}
          className="debt-drag-handle"
          title="Drag to reorder"
          aria-label={`Drag to reorder ${debt.name}`}
        >
          <svg className="debt-drag-icon" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </button>
      </div>
      <div className="debt-info">
        <div className="debt-name">{debt.name}</div>
        <div className="debt-notes">{debt.notes || 'No notes'}</div>
      </div>
      <div className="debt-balance">${(debt.currentBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      <div className="debt-rate">{(debt.interestRate ?? 0).toFixed(2)}%</div>
      <div className="debt-minimum-payment">${(debt.minimumPayment ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      <div className="debt-edit-button-container">
        <button
          onClick={() => onEdit(debt)}
          className="debt-edit-button"
          title="Edit debt"
          data-testid={`edit-debt-${debt.id}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="debt-edit-icon" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export type { Debt }