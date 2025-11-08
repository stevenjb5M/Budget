import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Debt {
  id: string
  userId: string
  name: string
  currentBalance: number
  interestRate: number
  minimumPayment: number
  notes?: string
  createdAt: string
  updatedAt: string
}

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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-[60px_1fr_120px_120px_100px] gap-4 p-4 border-b border-gray-200 hover:bg-gray-50"
    >
      <div className="flex justify-center">
        <button
          {...attributes}
          {...listeners}
          className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-1 bg-transparent border-none"
          title="Drag to reorder"
        >
          <svg className="w-3 h-3 fill-none stroke-gray-400 stroke-2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </button>
      </div>
      <div className="text-left">
        <div className="font-medium text-black">{debt.name}</div>
        {debt.notes && <div className="text-sm text-gray-500 mt-1">{debt.notes}</div>}
      </div>
      <div className="text-gray-600 text-center">${debt.currentBalance.toFixed(2)}</div>
      <div className="text-gray-600 text-center">{debt.interestRate}%</div>
      <div className="flex justify-center">
        <button
          onClick={() => onEdit(debt)}
          className="text-gray-400 hover:text-gray-600 p-2 bg-transparent border-none"
          title="Edit debt"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-none stroke-gray-400 stroke-2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export type { Debt }