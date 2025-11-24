import React, { useState, useEffect } from 'react'
import { Nav } from '../components/Nav'
import { Footer } from '../components/Footer'
import { SortableAssetItem, Asset } from '../components/SortableAssetItem'
import { SortableDebtItem, Debt } from '../components/SortableDebtItem'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { assetsAPI, debtsAPI } from '../api/client'
import { versionSyncService } from '../services/versionSyncService'
import { getCurrentUserId } from '../utils/auth'
import './Assets.css'

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
      const updatedAssets = [...assets, response.data]
      setAssets(updatedAssets)
      
      // Update version sync cache
      const userId = await getCurrentUserId()
      versionSyncService.storeData('assets', userId, updatedAssets)
      
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
      const updatedAssets = assets.map(asset =>
        asset.id === editingAsset.id ? response.data : asset
      )
      setAssets(updatedAssets)
      
      // Update version sync cache
      const userId = await getCurrentUserId()
      versionSyncService.storeData('assets', userId, updatedAssets)
      
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
      const updatedAssets = assets.filter(asset => asset.id !== editingAsset.id)
      setAssets(updatedAssets)
      
      // Update version sync cache
      const userId = await getCurrentUserId()
      versionSyncService.storeData('assets', userId, updatedAssets)
      
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
      const updatedDebts = [...debts, response.data]
      setDebts(updatedDebts)
      
      // Update version sync cache
      const userId = await getCurrentUserId()
      versionSyncService.storeData('debts', userId, updatedDebts)
      
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
      const updatedDebts = debts.map(debt =>
        debt.id === editingDebt.id ? response.data : debt
      )
      setDebts(updatedDebts)
      
      // Update version sync cache
      const userId = await getCurrentUserId()
      versionSyncService.storeData('debts', userId, updatedDebts)
      
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
      const updatedDebts = debts.filter(debt => debt.id !== editingDebt.id)
      setDebts(updatedDebts)
      
      // Update version sync cache
      const userId = await getCurrentUserId()
      versionSyncService.storeData('debts', userId, updatedDebts)
      
      setShowDebtDeleteModal(false)
      setEditingDebt(null)
      setNewDebt({ name: '', currentBalance: 0, interestRate: 0, minimumPayment: 0, notes: '' })
    } catch (error) {
      console.error('Error deleting debt:', error)
      setError('Failed to delete debt. Please try again.')
    }
  }

  return (
    <div className="assets-page">
      <Nav />
      <main className="assets-main">
        <div className="assets-content">
          {/* Loading State */}
          {loading && (
            <div className="loading-container">
              <div className="loading-pulse">
                <div className="loading-title"></div>
                <div className="loading-subtitle"></div>
                <div className="loading-lines">
                  <div className="loading-line"></div>
                  <div className="loading-line"></div>
                  <div className="loading-line"></div>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="error-container">
              <div className="error-text">
                <strong>Error:</strong> {error}
                <button
                  onClick={() => window.location.reload()}
                  className="error-retry-button"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="net-worth-card">
            <h1 className="net-worth-title">Net Worth</h1>
            <p className={`net-worth-amount ${netWorth >= 0 ? 'net-worth-positive' : 'net-worth-negative'}`}>
              ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="net-worth-details">
              <span>Assets: ${assetsTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span>Debts: ${debtsTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <h2 className="section-title">Assets</h2>
          <div className="section-container">
            <div className="table-container">
              <div className="table-header">
                <div></div>
                <div className="table-header-cell-left">Name</div>
                <div className="table-header-cell-center">Value</div>
                <div className="table-header-cell-center">APY</div>
                <div className="table-header-cell-center">Actions</div>
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
            <div className="table-footer">
              <div className="table-footer-content">
                <span className="table-footer-label">Total Assets</span>
                <span className="table-footer-amount">
                  ${assetsTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="add-button-container">
              <button
                onClick={() => setShowModal(true)}
                className="add-button"
                title="Add new asset"
              >
                <svg className="add-button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Debts Section */}
        <div className="debts-section-container">
          <h2 className="section-title">Debts</h2>
          <div className="section-container">
            <div className="table-container">
              <div className="table-header">
                <div></div>
                <div className="table-header-cell-left">Name</div>
                <div className="table-header-cell-center">Balance</div>
                <div className="table-header-cell-center">Rate</div>
                <div className="table-header-cell-center">Actions</div>
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
            <div className="table-footer">
              <div className="table-footer-content">
                <span className="table-footer-label">Total Debts</span>
                <span className="table-footer-amount-negative">
                  ${debtsTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="add-button-container">
              <button
                onClick={() => setShowDebtModal(true)}
                className="add-button"
                title="Add new debt"
              >
                <svg className="add-button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <h3>Create New Asset</h3>
              <form onSubmit={handleCreate} className="modal-form">
                <div className="form-field">
                  <label htmlFor="name" className="form-label">Name</label>
                  <input
                    type="text"
                    id="name"
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="currentValue" className="form-label">Current Value</label>
                  <input
                    type="number"
                    id="currentValue"
                    value={newAsset.currentValue}
                    onChange={(e) => setNewAsset({ ...newAsset, currentValue: parseFloat(e.target.value) })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="annualAPY" className="form-label">Annual APY (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="annualAPY"
                    value={newAsset.annualAPY}
                    onChange={(e) => setNewAsset({ ...newAsset, annualAPY: parseFloat(e.target.value) })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="notes" className="form-label">Notes</label>
                  <textarea
                    id="notes"
                    value={newAsset.notes}
                    onChange={(e) => setNewAsset({ ...newAsset, notes: e.target.value })}
                    className="form-textarea"
                    rows={3}
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="modal-cancel-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="modal-submit-button"
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
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <h3>Edit Asset</h3>
              <form onSubmit={handleUpdate} className="modal-form">
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
                      setShowEditModal(false)
                      setShowDeleteModal(true)
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
                  onClick={() => {
                    setShowDeleteModal(false)
                    setShowEditModal(true)
                  }}
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
                    onClick={() => {
                      setShowDebtEditModal(false)
                      setShowDebtDeleteModal(true)
                    }}
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
      <Footer />

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
                  onClick={() => {
                    setShowDebtDeleteModal(false)
                    setShowDebtEditModal(true)
                  }}
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