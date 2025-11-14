import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './SortableAssetItem.css'

interface Asset {
  id: string
  userId: string
  name: string
  currentValue: number
  annualAPY: number
  notes?: string
  createdAt: string
  updatedAt: string
}

interface SortableAssetItemProps {
  asset: Asset
  onEdit: (asset: Asset) => void
}

export function SortableAssetItem({ asset, onEdit }: SortableAssetItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: asset.id })

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
      className={`sortable-asset-item ${isDragging ? 'is-dragging' : ''}`}
    >
      <div className="drag-handle-container">
        <button
          {...attributes}
          {...listeners}
          className="drag-handle"
          title="Drag to reorder"
          aria-label={`Drag to reorder ${asset.name}`}
        >
          <svg className="drag-icon" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </button>
      </div>
      <div className="asset-info">
        <div className="asset-name">{asset.name}</div>
        <div className="asset-notes">{asset.notes || 'No notes'}</div>
      </div>
      <div className="asset-value">${asset.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      <div className="asset-apy">{asset.annualAPY.toFixed(2)}%</div>
      <div className="edit-button-container">
        <button
          onClick={() => onEdit(asset)}
          className="edit-button"
          title="Edit asset"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="edit-icon" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export type { Asset }