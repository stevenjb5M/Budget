import { useState } from 'react'
import dummyAssets from '../data/assets.json'
import { Nav } from '../components/Nav'
import { SortableAssetItem, Asset } from '../components/SortableAssetItem'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'

export function Assets() {
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
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#0171bd] hover:bg-[#0156a3]"
            >
              New Asset
            </button>
          </div>
          <div className="mt-8">
            <div className="mt-4 bg-white shadow rounded-lg overflow-hidden">
              <div className="grid grid-cols-[60px_1fr_120px_120px_100px] gap-4 p-4 bg-gray-50 font-medium text-gray-700 border-b">
                <div></div>
                <div className="text-left">Name</div>
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
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#0171bd] hover:bg-[#0156a3]"
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
                    Delete Asset
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
                      className="inline-flex justify-center py-1 px-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#0171bd] hover:bg-[#0156a3]"
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