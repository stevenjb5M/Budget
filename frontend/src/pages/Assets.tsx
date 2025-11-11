import { useState, useEffect } from 'react'
import { Nav } from '../components/Nav'
import { SortableAssetItem, Asset } from '../components/SortableAssetItem'
import { SortableDebtItem, Debt } from '../components/SortableDebtItem'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { assetsAPI, debtsAPI } from '../api/client'

export function Assets() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showDebtModal, setShowDebtModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDebtEditModal, setShowDebtEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDebtDeleteModal, setShowDebtDeleteModal] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)
  const [newAsset, setNewAsset] = useState({ name: '', currentValue: 0, annualAPY: 0, notes: '' })
  const [newDebt, setNewDebt] = useState({ name: '', currentBalance: 0, interestRate: 0, minimumPayment: 0, notes: '' })

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null)
        const [assetsResponse, debtsResponse] = await Promise.all([
          assetsAPI.getAssets(),
          debtsAPI.getDebts()
        ])
        setAssets(assetsResponse.data)
        setDebts(debtsResponse.data)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Failed to load assets and debts. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate totals
  const assetsTotal = assets.reduce((sum, asset) => sum + asset.currentValue, 0)
  const debtsTotal = debts.reduce((sum, debt) => sum + debt.currentBalance, 0)
  const netWorth = assetsTotal - debtsTotal

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const assetData = {
        name: newAsset.name,
        currentValue: newAsset.currentValue,
        annualAPY: newAsset.annualAPY,
        notes: newAsset.notes || undefined
      }

      const response = await assetsAPI.createAsset(assetData)
      setAssets([...assets, response.data])
      setNewAsset({ name: '', currentValue: 0, annualAPY: 0, notes: '' })
      setShowModal(false)
    } catch (error) {
      console.error('Error creating asset:', error)
      setError('Failed to create asset. Please try again.')
    }
  }

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset)
    setNewAsset({ name: asset.name, currentValue: asset.currentValue, annualAPY: asset.annualAPY, notes: asset.notes || '' })
    setShowEditModal(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAsset) return

    try {
      const assetData = {
        name: newAsset.name,
        currentValue: newAsset.currentValue,
        annualAPY: newAsset.annualAPY,
        notes: newAsset.notes || undefined
      }

      const response = await assetsAPI.updateAsset(editingAsset.id, assetData)
      setAssets(assets.map(asset =>
        asset.id === editingAsset.id ? response.data : asset
      ))
      setShowEditModal(false)
      setEditingAsset(null)
      setNewAsset({ name: '', currentValue: 0, annualAPY: 0, notes: '' })
    } catch (error) {
      console.error('Error updating asset:', error)
      setError('Failed to update asset. Please try again.')
    }
  }

  const handleDelete = async () => {
    if (!editingAsset) return

    try {
      await assetsAPI.deleteAsset(editingAsset.id)
      setAssets(assets.filter(asset => asset.id !== editingAsset.id))
      setShowDeleteModal(false)
      setEditingAsset(null)
      setNewAsset({ name: '', currentValue: 0, annualAPY: 0, notes: '' })
    } catch (error) {
      console.error('Error deleting asset:', error)
      setError('Failed to delete asset. Please try again.')
    }
  }

  function handleDebtDragEnd(event: any) {
    const { active, over } = event

    if (active.id !== over.id) {
      setDebts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleDebtCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const debtData = {
        name: newDebt.name,
        currentBalance: newDebt.currentBalance,
        interestRate: newDebt.interestRate,
        minimumPayment: newDebt.minimumPayment,
        notes: newDebt.notes || undefined
      }

      const response = await debtsAPI.createDebt(debtData)
      setDebts([...debts, response.data])
      setNewDebt({ name: '', currentBalance: 0, interestRate: 0, minimumPayment: 0, notes: '' })
      setShowDebtModal(false)
    } catch (error) {
      console.error('Error creating debt:', error)
      setError('Failed to create debt. Please try again.')
    }
  }

  const handleDebtEdit = (debt: Debt) => {
    setEditingDebt(debt)
    setNewDebt({ name: debt.name, currentBalance: debt.currentBalance, interestRate: debt.interestRate, minimumPayment: debt.minimumPayment, notes: debt.notes || '' })
    setShowDebtEditModal(true)
  }

  const handleDebtUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDebt) return

    try {
      const debtData = {
        name: newDebt.name,
        currentBalance: newDebt.currentBalance,
        interestRate: newDebt.interestRate,
        minimumPayment: newDebt.minimumPayment,
        notes: newDebt.notes || undefined
      }

      const response = await debtsAPI.updateDebt(editingDebt.id, debtData)
      setDebts(debts.map(debt =>
        debt.id === editingDebt.id ? response.data : debt
      ))
      setShowDebtEditModal(false)
      setEditingDebt(null)
      setNewDebt({ name: '', currentBalance: 0, interestRate: 0, minimumPayment: 0, notes: '' })
    } catch (error) {
      console.error('Error updating debt:', error)
      setError('Failed to update debt. Please try again.')
    }
  }

  const handleDebtDelete = async () => {
    if (!editingDebt) return

    try {
      await debtsAPI.deleteDebt(editingDebt.id)
      setDebts(debts.filter(debt => debt.id !== editingDebt.id))
      setShowDebtDeleteModal(false)
      setEditingDebt(null)
      setNewDebt({ name: '', currentBalance: 0, interestRate: 0, minimumPayment: 0, notes: '' })
    } catch (error) {
      console.error('Error deleting debt:', error)
      setError('Failed to delete debt. Please try again.')
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
          {/* Loading State */}
          {loading && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="text-red-800">
                <strong>Error:</strong> {error}
                <button
                  onClick={() => window.location.reload()}
                  className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="bg-white shadow rounded-lg p-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 text-center">Net Worth</h1>
            <p className={`text-3xl font-bold text-center mt-1 ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="flex justify-center space-x-6 mt-2 text-sm text-gray-600">
              <span>Assets: ${assetsTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span>Debts: ${debtsTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 text-left">Assets</h2>
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
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <div className="flex justify-end items-center">
                <span className="font-medium text-gray-900 mr-4">Total Assets</span>
                <span className="font-bold text-lg text-gray-900">
                  ${assetsTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="flex justify-center py-4">
              <button
                onClick={() => setShowModal(true)}
                className="group text-[#0171bd] hover:text-[#0156a3] p-2 rounded-full transition-colors"
                title="Add new asset"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Debts Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 text-left">Debts</h2>
          <div className="mt-8">
            <div className="mt-4 bg-white shadow rounded-lg overflow-hidden">
              <div className="grid grid-cols-[60px_1fr_120px_120px_100px] gap-4 p-4 bg-gray-50 font-medium text-gray-700 border-b">
                <div></div>
                <div className="text-left">Name</div>
                <div className="text-center">Balance</div>
                <div className="text-center">Rate</div>
                <div className="text-center">Actions</div>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDebtDragEnd}
              >
                <SortableContext items={debts.map(debt => debt.id)} strategy={verticalListSortingStrategy}>
                  {debts.map((debt) => (
                    <SortableDebtItem key={debt.id} debt={debt} onEdit={handleDebtEdit} />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <div className="flex justify-end items-center">
                <span className="font-medium text-gray-900 mr-4">Total Debts</span>
                <span className="font-bold text-lg text-red-600">
                  ${debtsTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="flex justify-center py-4">
              <button
                onClick={() => setShowDebtModal(true)}
                className="group text-[#0171bd] hover:text-[#0156a3] p-2 rounded-full transition-colors"
                title="Add new debt"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

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
                    onClick={() => setShowDeleteModal(true)}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && editingAsset && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" onClick={() => setShowDeleteModal(false)}>
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Asset</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete <span className="font-medium text-gray-900">"{editingAsset.name}"</span>? 
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDelete()
                    setShowDeleteModal(false)
                  }}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Delete Asset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debt Create Modal */}
      {showDebtModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" onClick={() => setShowDebtModal(false)}>
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900">Create New Debt</h3>
              <form onSubmit={handleDebtCreate} className="mt-4 space-y-4 px-6">
                <div>
                  <label htmlFor="debt-name" className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    id="debt-name"
                    value={newDebt.name}
                    onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                    className="mt-1 mb-2 block w-4/5 mx-auto border-gray-300 rounded-md shadow-sm text-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="debt-currentBalance" className="block text-sm font-medium text-gray-700">Current Balance</label>
                  <input
                    type="number"
                    id="debt-currentBalance"
                    value={newDebt.currentBalance}
                    onChange={(e) => setNewDebt({ ...newDebt, currentBalance: parseFloat(e.target.value) })}
                    className="mt-1 mb-2 block w-4/5 mx-auto border-gray-300 rounded-md shadow-sm text-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="debt-interestRate" className="block text-sm font-medium text-gray-700">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="debt-interestRate"
                    value={newDebt.interestRate}
                    onChange={(e) => setNewDebt({ ...newDebt, interestRate: parseFloat(e.target.value) })}
                    className="mt-1 mb-2 block w-4/5 mx-auto border-gray-300 rounded-md shadow-sm text-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="debt-minimumPayment" className="block text-sm font-medium text-gray-700">Minimum Payment</label>
                  <input
                    type="number"
                    id="debt-minimumPayment"
                    value={newDebt.minimumPayment}
                    onChange={(e) => setNewDebt({ ...newDebt, minimumPayment: parseFloat(e.target.value) })}
                    className="mt-1 mb-2 block w-4/5 mx-auto border-gray-300 rounded-md shadow-sm text-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="debt-notes" className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    id="debt-notes"
                    value={newDebt.notes}
                    onChange={(e) => setNewDebt({ ...newDebt, notes: e.target.value })}
                    className="mt-1 mb-2 block w-4/5 mx-auto border-gray-300 rounded-md shadow-sm text-black"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowDebtModal(false)}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#0171bd] hover:bg-[#0156a3]"
                  >
                    Create Debt
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Debt Edit Modal */}
      {showDebtEditModal && editingDebt && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" onClick={() => setShowDebtEditModal(false)}>
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900">Edit Debt</h3>
              <form onSubmit={handleDebtUpdate} className="mt-4 space-y-4 px-6">
                <div>
                  <label htmlFor="edit-debt-name" className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    id="edit-debt-name"
                    value={newDebt.name}
                    onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                    className="mt-1 mb-2 block w-4/5 mx-auto border-gray-300 rounded-md shadow-sm text-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-debt-currentBalance" className="block text-sm font-medium text-gray-700">Current Balance</label>
                  <input
                    type="number"
                    id="edit-debt-currentBalance"
                    value={newDebt.currentBalance}
                    onChange={(e) => setNewDebt({ ...newDebt, currentBalance: parseFloat(e.target.value) })}
                    className="mt-1 mb-2 block w-4/5 mx-auto border-gray-300 rounded-md shadow-sm text-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-debt-interestRate" className="block text-sm font-medium text-gray-700">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="edit-debt-interestRate"
                    value={newDebt.interestRate}
                    onChange={(e) => setNewDebt({ ...newDebt, interestRate: parseFloat(e.target.value) })}
                    className="mt-1 mb-2 block w-4/5 mx-auto border-gray-300 rounded-md shadow-sm text-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-debt-minimumPayment" className="block text-sm font-medium text-gray-700">Minimum Payment</label>
                  <input
                    type="number"
                    id="edit-debt-minimumPayment"
                    value={newDebt.minimumPayment}
                    onChange={(e) => setNewDebt({ ...newDebt, minimumPayment: parseFloat(e.target.value) })}
                    className="mt-1 mb-2 block w-4/5 mx-auto border-gray-300 rounded-md shadow-sm text-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-debt-notes" className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    id="edit-debt-notes"
                    value={newDebt.notes}
                    onChange={(e) => setNewDebt({ ...newDebt, notes: e.target.value })}
                    className="mt-1 mb-2 block w-4/5 mx-auto border-gray-300 rounded-md shadow-sm text-black"
                    rows={3}
                  />
                </div>
                <div className="flex justify-between space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowDebtDeleteModal(true)}
                    className="inline-flex justify-center py-1 px-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    Delete Debt
                  </button>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowDebtEditModal(false)}
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
      </main>

      {/* Modals */}
      {showDebtDeleteModal && editingDebt && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" onClick={() => setShowDebtDeleteModal(false)}>
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Debt</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete <span className="font-medium text-gray-900">"{editingDebt.name}"</span>?
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDebtDeleteModal(false)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDebtDelete()
                    setShowDebtDeleteModal(false)
                  }}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Delete Debt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}