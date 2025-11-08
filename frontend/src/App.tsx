import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useState } from 'react'
import dummyAssets from './data/assets.json'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './App.css'

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

function SortableAssetItem({ asset, onEdit }: SortableAssetItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: asset.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-[60px_2fr_1fr_1fr_100px] gap-4 p-4 border-b border-gray-200 hover:bg-gray-50"
    >
      <div className="flex justify-center">
        <button
          {...attributes}
          {...listeners}
          className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-0.5"
          title="Drag to reorder"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </button>
      </div>
      <div>
        <div className="font-medium text-black">{asset.name}</div>
        {asset.notes && <div className="text-sm text-gray-500 mt-1">{asset.notes}</div>}
      </div>
      <div className="text-gray-600 text-center">${asset.currentValue.toFixed(2)}</div>
      <div className="text-gray-600 text-center">{asset.annualAPY}%</div>
      <div className="flex justify-center">
        <button
          onClick={() => onEdit(asset)}
          className="text-blue-600 hover:text-blue-800 p-2"
          title="Edit asset"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/assets" element={<Assets />} />
      </Routes>
    </BrowserRouter>
  )
}

function Nav() {
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-8">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "border-indigo-500 text-gray-900 border-b-2 py-4 px-1 text-sm font-medium"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 border-b-2 py-4 px-1 text-sm font-medium"
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/plans"
            className={({ isActive }) =>
              isActive
                ? "border-indigo-500 text-gray-900 border-b-2 py-4 px-1 text-sm font-medium"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 border-b-2 py-4 px-1 text-sm font-medium"
            }
          >
            Plans
          </NavLink>
          <NavLink
            to="/budgets"
            className={({ isActive }) =>
              isActive
                ? "border-indigo-500 text-gray-900 border-b-2 py-4 px-1 text-sm font-medium"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 border-b-2 py-4 px-1 text-sm font-medium"
            }
          >
            Budgets
          </NavLink>
          <NavLink
            to="/assets"
            className={({ isActive }) =>
              isActive
                ? "border-indigo-500 text-gray-900 border-b-2 py-4 px-1 text-sm font-medium"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 border-b-2 py-4 px-1 text-sm font-medium"
            }
          >
            Assets
          </NavLink>
        </div>
      </div>
    </nav>
  )
}

function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">Budget Planner</h1>
        </div>
      </header>
      <Nav />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <p>Welcome to Budget Planner</p>
      </main>
    </div>
  )
}

function Plans() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">Budget Planner</h1>
        </div>
      </header>
      <Nav />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div>Plans Page</div>
      </main>
    </div>
  )
}

function Budgets() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">Budget Planner</h1>
        </div>
      </header>
      <Nav />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div>Budgets Page</div>
      </main>
    </div>
  )
}

function Assets() {
  const [assets, setAssets] = useState<Asset[]>(dummyAssets)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [newAsset, setNewAsset] = useState({ name: '', currentValue: 0, annualAPY: 0, notes: '' })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: any) {
    const { active, over } = event

    if (active.id !== over.id) {
      setAssets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const asset: Asset = {
      id: Date.now().toString(),
      userId: 'user1',
      name: newAsset.name,
      currentValue: newAsset.currentValue,
      annualAPY: newAsset.annualAPY,
      notes: newAsset.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setAssets([...assets, asset])
    setNewAsset({ name: '', currentValue: 0, annualAPY: 0, notes: '' })
    setShowModal(false)
  }

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset)
    setNewAsset({ name: asset.name, currentValue: asset.currentValue, annualAPY: asset.annualAPY, notes: asset.notes || '' })
    setShowEditModal(true)
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingAsset) {
      setAssets(assets.map(asset => 
        asset.id === editingAsset.id 
          ? { ...asset, name: newAsset.name, currentValue: newAsset.currentValue, annualAPY: newAsset.annualAPY, notes: newAsset.notes, updatedAt: new Date().toISOString() }
          : asset
      ))
      setShowEditModal(false)
      setEditingAsset(null)
      setNewAsset({ name: '', currentValue: 0, annualAPY: 0, notes: '' })
    }
  }

  const handleDelete = () => {
    if (editingAsset) {
      setAssets(assets.filter(asset => asset.id !== editingAsset.id))
      setShowEditModal(false)
      setEditingAsset(null)
      setNewAsset({ name: '', currentValue: 0, annualAPY: 0, notes: '' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">Budget Planner</h1>
        </div>
      </header>
      <Nav />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Assets</h2>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              New Asset
            </button>
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900">Your Assets</h3>
            <div className="mt-4 bg-white shadow rounded-lg overflow-hidden">
              <div className="grid grid-cols-[60px_2fr_1fr_1fr_100px] gap-4 p-4 bg-gray-50 font-medium text-gray-700 border-b">
                <div></div>
                <div>Name</div>
                <div className="text-center">Value</div>
                <div className="text-center">APY</div>
                <div className="text-center">Actions</div>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={assets.map(asset => asset.id)} strategy={verticalListSortingStrategy}>
                  {assets.map((asset) => (
                    <SortableAssetItem key={asset.id} asset={asset} onEdit={handleEdit} />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" onClick={() => setShowModal(false)}>
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900">Create New Asset</h3>
              <form onSubmit={handleCreate} className="mt-4 space-y-4 px-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    id="name"
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                    className="mt-1 mb-2 block w-4/5 mx-auto border-gray-300 rounded-md shadow-sm text-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="currentValue" className="block text-sm font-medium text-gray-700">Current Value</label>
                  <input
                    type="number"
                    id="currentValue"
                    value={newAsset.currentValue}
                    onChange={(e) => setNewAsset({ ...newAsset, currentValue: parseFloat(e.target.value) })}
                    className="mt-1 mb-2 block w-4/5 mx-auto border-gray-300 rounded-md shadow-sm text-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="annualAPY" className="block text-sm font-medium text-gray-700">Annual APY (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="annualAPY"
                    value={newAsset.annualAPY}
                    onChange={(e) => setNewAsset({ ...newAsset, annualAPY: parseFloat(e.target.value) })}
                    className="mt-1 mb-2 block w-4/5 mx-auto border-gray-300 rounded-md shadow-sm text-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    id="notes"
                    value={newAsset.notes}
                    onChange={(e) => setNewAsset({ ...newAsset, notes: e.target.value })}
                    className="mt-1 mb-2 block w-4/5 mx-auto border-gray-300 rounded-md shadow-sm text-black"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Create Asset
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingAsset && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" onClick={() => setShowEditModal(false)}>
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900">Edit Asset</h3>
              <form onSubmit={handleUpdate} className="mt-4 space-y-4 px-6">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    id="edit-name"
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                    className="mt-1 mb-2 block w-4/5 mx-auto border-gray-300 rounded-md shadow-sm text-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-currentValue" className="block text-sm font-medium text-gray-700">Current Value</label>
                  <input
                    type="number"
                    id="edit-currentValue"
                    value={newAsset.currentValue}
                    onChange={(e) => setNewAsset({ ...newAsset, currentValue: parseFloat(e.target.value) })}
                    className="mt-1 mb-2 block w-4/5 mx-auto border-gray-300 rounded-md shadow-sm text-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-annualAPY" className="block text-sm font-medium text-gray-700">Annual APY (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="edit-annualAPY"
                    value={newAsset.annualAPY}
                    onChange={(e) => setNewAsset({ ...newAsset, annualAPY: parseFloat(e.target.value) })}
                    className="mt-1 mb-2 block w-4/5 mx-auto border-gray-300 rounded-md shadow-sm text-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-notes" className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    id="edit-notes"
                    value={newAsset.notes}
                    onChange={(e) => setNewAsset({ ...newAsset, notes: e.target.value })}
                    className="mt-1 mb-2 block w-4/5 mx-auto border-gray-300 rounded-md shadow-sm text-black"
                    rows={3}
                  />
                </div>
                <div className="flex justify-between space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete the asset "${editingAsset.name}"? This action cannot be undone.`)) {
                        handleDelete()
                      }
                    }}
                    className="inline-flex justify-center py-1 px-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="inline-flex justify-center py-1 px-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-1 px-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
