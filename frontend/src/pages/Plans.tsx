import React, { useState } from 'react'
import { Nav } from '../components/Nav'
import { Footer } from '../components/Footer'
import { usePlans } from '../hooks/usePlans'
import { calculateAssetValueForMonth, calculateDebtRemainingForMonth } from '../services/planService'
import './Plans.css'

const Plans: React.FC = () => {
  const {
    plans,
    budgets,
    assets,
    debts,
    selectedPlan,
    selectedPlanId,
    loading,
    error,
    currentAssetsTotal,
    currentDebtsTotal,
    currentNetWorth,
    handleCreatePlan,
    handleSelectPlan,
    handleAddEmptyTransaction,
    handleUpdateTransaction,
    handleSaveTransaction,
    handleRemoveTransaction,
    handleRenamePlan,
    handleDeletePlan,
    handleBudgetChange
  } = usePlans()

  // UI-specific state
  const [plansMinimized, setPlansMinimized] = useState(true)
  const [budgetPlanningMinimized, setBudgetPlanningMinimized] = useState(false)
  const [showMonthDetailsModal, setShowMonthDetailsModal] = useState(false)
  const [selectedMonthForDetails, setSelectedMonthForDetails] = useState<string>('')
  const [showPlanSettingsModal, setShowPlanSettingsModal] = useState(false)
  const [editingPlanName, setEditingPlanName] = useState('')
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false)
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([])
  const [showNewPlanModal, setShowNewPlanModal] = useState(false)
  const [newPlanName, setNewPlanName] = useState('')
  const [newPlanDescription, setNewPlanDescription] = useState('')
  const [autofillBudgetId, setAutofillBudgetId] = useState('')

  // Initialize selected assets with first 3 assets
  React.useEffect(() => {
    if (assets.length > 0 && selectedAssetIds.length === 0) {
      setSelectedAssetIds(assets.slice(0, 3).map((asset) => `asset-${asset.id}`))
    }
  }, [assets, selectedAssetIds.length])

  const getMonthName = (monthString: string) => {
    const [year, month] = monthString.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const handleCreatePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await handleCreatePlan(newPlanName, newPlanDescription, autofillBudgetId)
      setNewPlanName('')
      setNewPlanDescription('')
      setAutofillBudgetId('')
      setShowNewPlanModal(false)
    } catch (error) {
      // Error is handled in the hook
    }
  }

  const handleRenamePlanSubmit = async () => {
    try {
      await handleRenamePlan(editingPlanName)
      setShowPlanSettingsModal(false)
      setEditingPlanName('')
    } catch (error) {
      // Error is handled in the hook
    }
  }

  const handleDeletePlanConfirm = async () => {
    try {
      await handleDeletePlan()
      setShowDeleteConfirmationModal(false)
    } catch (error) {
      // Error is handled in the hook
    }
  }

  if (loading) {
    return (
      <div className="plans-page">
        <Nav />
        <div className="loading">Loading plans...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="plans-page">
        <Nav />
        <div className="error">{error}</div>
      </div>
    )
  }

  return (
    <div className="plans-page">
      <header className="plans-header">
        <div className="plans-header-container">
          <h1 className="plans-header-title">Budget Planner</h1>
        </div>
      </header>
      <Nav />
      <main className="plans-main">
        <div className="plans-content">
          {/* Loading Overlay */}
          {loading && (
            <div className="plans-loading-overlay">
              <div className="plans-loading-container">
                <div className="plans-loading-pulse">
                  <div className="plans-loading-title"></div>
                  <div className="plans-loading-subtitle"></div>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="plans-error-container">
              <div className="plans-error-text">
                <strong>Error:</strong> {error}
                <button
                  onClick={() => window.location.reload()}
                  className="plans-error-retry-button"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          <div className="mb-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Financial Forecaster</h2>
              <button
                onClick={() => setShowNewPlanModal(true)}
                className="bg-[#0171bd] text-white px-4 py-2 rounded-md hover:bg-[#0156a3] transition-colors"
              >
                Create New Plan
              </button>
            </div>
            {plansMinimized && (
              <div className="mt-4">
                <button
                  onClick={() => setPlansMinimized(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors flex items-center space-x-2"
                  title="Show plans list"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="text-sm">Show Plans</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Plans List */}
            {!plansMinimized && (
              <div className="lg:col-span-1">
                <div className="bg-white shadow rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Your Plans</h3>
                    <button
                      onClick={() => setPlansMinimized(!plansMinimized)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      title={plansMinimized ? "Show all plans" : "Hide plans"}
                    >
                      {plansMinimized ? "Show All Plans" : "Hide Plans"}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        onClick={() => handleSelectPlan(plan.id)}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          plan.id === selectedPlanId
                            ? 'bg-[#0171bd] text-white'
                          : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium">{plan.name}</div>
                      <div className={`text-sm ${plan.id === selectedPlanId ? 'text-blue-100' : 'text-gray-500'}`}>
                        {plan.description}
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            )}

            {/* Plan Details */}
            <div className={plansMinimized ? "lg:col-span-4" : "lg:col-span-3"}>
              {selectedPlan ? (
                <div className="space-y-6">
                  {/* Plan Header */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="relative mb-2">
                      <h3 className="text-xl font-bold text-gray-900 text-center">{selectedPlan.name}</h3>
                      <button
                        onClick={() => {
                          setEditingPlanName(selectedPlan.name)
                          setShowPlanSettingsModal(true)
                        }}
                        className="absolute right-0 top-0 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        title="Plan settings"
                      >
                        Edit Plan
                      </button>
                    </div>
                    <p className="text-gray-600 mb-4">{selectedPlan.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Current Net Worth</div>
                        <div className={`text-2xl font-bold ${currentNetWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${currentNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Plan Duration</div>
                        <div className="text-2xl font-bold text-gray-900">2 Years (24 Months)</div>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Grid */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Monthly Budget Planning</h4>
                      <button
                        onClick={() => setBudgetPlanningMinimized(!budgetPlanningMinimized)}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                        title={budgetPlanningMinimized ? "Expand budget planning" : "Minimize budget planning"}
                      >
                        {budgetPlanningMinimized ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {!budgetPlanningMinimized && (
                      <div>
                        {/* Column Headers */}
                        <div className="grid grid-cols-7 gap-4 mb-3 pb-2 border-b border-gray-200">
                          <div className="font-medium text-gray-700">Month</div>
                          <div className="font-medium text-gray-700">Budget</div>
                          {[0, 1, 2].map((index) => (
                              <div key={index} className="text-center">
                                <select
                                  value={selectedAssetIds[index] || ''}
                                  onChange={(e) => {
                                    const newSelectedAssetIds = [...selectedAssetIds]
                                    newSelectedAssetIds[index] = e.target.value
                                    setSelectedAssetIds(newSelectedAssetIds)
                                  }}
                                  className="w-full border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-transparent"
                                  title={`Select asset or debt ${index + 1} to display`}
                                >
                                  <option value="">None</option>
                                  {assets.map((assetOption: any) => (
                                    <option key={assetOption.id} value={`asset-${assetOption.id}`}>
                                      {assetOption.name}
                                    </option>
                                  ))}
                                  {debts.map((debtOption: any) => (
                                    <option key={debtOption.id} value={`debt-${debtOption.id}`}>
                                      {debtOption.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          <div className="font-medium text-gray-700 text-center">Net Worth</div>
                          <div className="font-medium text-gray-700 text-center">Details</div>
                        </div>
                        
                        <div className="space-y-3">
                          {selectedPlan.months.map((monthData, index) => {
                            const isNewYear = monthData.month.endsWith('-01') // January indicates new year
                            const year = monthData.month.split('-')[0]

                            return (
                              <div key={`month-${monthData.month}`}>
                                {isNewYear && index > 0 && (
                                  <div className="flex items-center justify-center py-2 my-2 bg-blue-50 border border-blue-100 rounded-md">
                                    <span className="text-sm font-medium text-blue-700">{year}</span>
                                  </div>
                                )}
                                <div className="border border-gray-200 rounded-lg p-4 relative">
                                  <div className="grid grid-cols-7 gap-4 items-center">
                                    <div>
                                      <h5 className="font-medium text-gray-900">{getMonthName(monthData.month)}</h5>
                                    </div>
                                    <div>
                                      <select
                                        value={monthData.budgetId || ''}
                                        onChange={(e) => handleBudgetChange(index, e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm text-black text-sm"
                                        title={`Select budget for ${getMonthName(monthData.month)}`}
                                      >
                                        <option value="">No Budget</option>
                                        {budgets.map((budget) => (
                                          <option key={budget.id} value={budget.id}>
                                            {budget.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    {[0, 1, 2].map((assetIndex) => {
                                      const itemId = selectedAssetIds[assetIndex]
                                      let displayValue = '-'
                                      if (itemId) {
                                        const dashIndex = itemId.indexOf('-')
                                        const type = itemId.substring(0, dashIndex)
                                        const id = itemId.substring(dashIndex + 1)
                                        if (type === 'asset') {
                                          const asset = assets.find((a: any) => a.id === id)
                                          const assetValue = asset ? calculateAssetValueForMonth(asset, monthData.month, selectedPlan, budgets) : 0
                                          displayValue = `$${assetValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        } else if (type === 'debt') {
                                          const debt = debts.find((d: any) => d.id === id)
                                          const debtValue = debt ? calculateDebtRemainingForMonth(debt, monthData.month, selectedPlan, budgets) : 0
                                          displayValue = `$${debtValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        }
                                      }
                                      return (
                                        <div key={assetIndex} className="text-center">
                                          <div className="text-sm font-medium text-gray-900">
                                            {displayValue}
                                          </div>
                                        </div>
                                      )
                                    })}
                                    <div className="text-center">
                                      <div className={`text-lg font-bold ${monthData.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ${monthData.netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <div className="flex justify-center space-x-2 ml-4">
                                        <button
                                          onClick={() => {
                                            setSelectedMonthForDetails(monthData.month)
                                            setShowMonthDetailsModal(true)
                                          }}
                                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
                                          title={`View assets & debts for ${getMonthName(monthData.month)}`}
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                          </svg>
                                        </button>
                                        <button
                                          onClick={() => handleAddEmptyTransaction(index)}
                                          className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors group"
                                          title=""
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                          </svg>
                                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                            Add transaction
                                          </div>
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Transactions for this month */}
                                  {monthData.transactions && monthData.transactions.length > 0 && (
                                    <div className="mt-3 ml-8">
                                      <div className="bg-blue-50 p-3 rounded-md border-2 border-blue-200 space-y-2">
                                        {monthData.transactions.map((transaction) => {
                                          debugger;
                                          const target = transaction.type === 'asset' 
                                            ? assets.find(a => a.id === transaction.targetId)
                                            : debts.find(d => d.id === transaction.targetId)
                                          
                                          if (transaction.isEditing) {
                                            return (
                                              <div key={transaction.id} className="flex items-center space-x-2">
                                                <select
                                                  value={transaction.targetId ? `${transaction.type}-${transaction.targetId}` : ''}
                                                  onChange={(e) => handleUpdateTransaction(index, transaction.id, 'targetId', e.target.value)}
                                                  className="flex-1 border-gray-300 rounded-md shadow-sm text-xs text-black"
                                                  title="Select asset or debt"
                                                >
                                                  <option value="">Select asset/debt...</option>
                                                  {assets.map(asset => (
                                                    <option key={asset.id} value={`asset-${asset.id}`}>{asset.name} (Asset)</option>
                                                  ))}
                                                  {debts.map(debt => (
                                                    <option key={debt.id} value={`debt-${debt.id}`}>{debt.name} (Debt)</option>
                                                  ))}
                                                </select>
                                                <input
                                                  type="number"
                                                  value={transaction.amount}
                                                  onChange={(e) => handleUpdateTransaction(index, transaction.id, 'amount', parseFloat(e.target.value) || 0)}
                                                  onFocus={(e) => {
                                                    if (parseFloat(e.target.value) === 0) {
                                                      e.target.value = '';
                                                    }
                                                  }}
                                                  className="w-20 border-gray-300 rounded-md shadow-sm text-xs text-center text-black"
                                                  placeholder="0.00"
                                                  step="0.01"
                                                />
                                                <input
                                                  type="text"
                                                  value={transaction.description}
                                                  onChange={(e) => handleUpdateTransaction(index, transaction.id, 'description', e.target.value)}
                                                  className="flex-1 border-gray-300 rounded-md shadow-sm text-xs text-black"
                                                  placeholder="Note"
                                                />
                                                <button
                                                  onClick={() => handleSaveTransaction(index, transaction.id)}
                                                  disabled={!transaction.targetId || transaction.amount === 0}
                                                  className="px-2 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                                  title="Save transaction"
                                                >
                                                  ✓
                                                </button>
                                                <button
                                                  onClick={() => handleRemoveTransaction(index, transaction.id)}
                                                  className="px-2 py-1 text-xs text-red-600 hover:text-red-800"
                                                  title="Cancel"
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            )
                                          }
                                          
                                          return (
                                            <div key={transaction.id} className="flex items-center justify-between bg-white p-2 rounded-md">
                                              <div className="flex items-center space-x-2">
                                                <span className={`text-xs px-2 py-1 rounded font-medium ${
                                                  transaction.type === 'asset' 
                                                    ? 'bg-green-100 text-green-800 border border-green-200' 
                                                    : 'bg-red-100 text-red-800 border border-red-200'
                                                }`}>
                                                  {transaction.type === 'asset' ? 'Asset' : 'Debt'}
                                                </span>
                                                <span className="text-sm font-medium text-gray-900">
                                                  {target?.name || 'Unknown'}
                                                </span>
                                                <span className="text-sm text-gray-600">
                                                  {transaction.description}
                                                </span>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <span className={`text-sm font-medium ${
                                                  transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                  ${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                                <button
                                                  onClick={() => handleRemoveTransaction(index, transaction.id)}
                                                  className="text-red-500 hover:text-red-700 text-sm"
                                                  title="Remove transaction"
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )}



                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg p-6 text-center">
                  <p className="text-gray-500">
                    {plans.length === 0 
                      ? "No financial plans yet. Let's create your first one!" 
                      : "Select a plan to view details"
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* New Plan Modal */}
      {showNewPlanModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" onClick={() => setShowNewPlanModal(false)}>
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Plan</h3>
              <form onSubmit={handleCreatePlanSubmit}>
                <div className="mb-4">
                  <label htmlFor="planName" className="block text-sm font-medium text-gray-700 mb-2">Plan Name</label>
                  <input
                    type="text"
                    id="planName"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm text-black"
                    placeholder="e.g., 5-Year Financial Plan"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="planDescription" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    id="planDescription"
                    value={newPlanDescription}
                    onChange={(e) => setNewPlanDescription(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm text-black"
                    placeholder="Describe your financial plan..."
                    rows={3}
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="autofillBudget" className="block text-sm font-medium text-gray-700 mb-2">Autofill All Months With Budget (Optional)</label>
                  <select
                    id="autofillBudget"
                    value={autofillBudgetId}
                    onChange={(e) => setAutofillBudgetId(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm text-black"
                  >
                    <option value="">None - Set manually later</option>
                    {budgets.map((budget) => (
                      <option key={budget.id} value={budget.id}>{budget.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowNewPlanModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0171bd] text-white rounded-md hover:bg-[#0156a3]"
                  >
                    Create Plan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Month Details Modal */}
      {showMonthDetailsModal && selectedMonthForDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" onClick={() => setShowMonthDetailsModal(false)}>
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-6">{getMonthName(selectedMonthForDetails)} - Assets & Debts Breakdown</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assets */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-4 border-b pb-2">Assets</h4>
                  {assets.length > 0 ? (
                    <div className="space-y-3">
                      {assets.map((asset) => {
                        const projectedValue = calculateAssetValueForMonth(asset, selectedMonthForDetails, selectedPlan, budgets)
                        const depositAmount = projectedValue - asset.currentValue
                        return (
                          <div key={asset.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-medium text-gray-900">{asset.name}</div>
                              <div className="text-right">
                                <div className="text-sm text-gray-600">Projected</div>
                                <div className="text-lg font-bold text-green-600">${projectedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 border-t pt-2">
                              <div className="flex justify-between">
                                <span>Starting:</span>
                                <span>${asset.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between text-green-600">
                                <span>Deposits:</span>
                                <span>+${depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">No assets created yet</div>
                  )}
                </div>

                {/* Debts */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-4 border-b pb-2">Debts</h4>
                  {debts.length > 0 ? (
                    <div className="space-y-3">
                      {debts.map((debt) => {
                        const remainingBalance = calculateDebtRemainingForMonth(debt, selectedMonthForDetails, selectedPlan, budgets)
                        const paymentAmount = debt.currentBalance - remainingBalance
                        return (
                          <div key={debt.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-medium text-gray-900">{debt.name}</div>
                              <div className="text-right">
                                <div className="text-sm text-gray-600">Remaining</div>
                                <div className="text-lg font-bold text-red-600">${remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 border-t pt-2">
                              <div className="flex justify-between">
                                <span>Starting:</span>
                                <span>${debt.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between text-red-600">
                                <span>Payments:</span>
                                <span>-${paymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">No debts created yet</div>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowMonthDetailsModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Settings Modal */}
      {showPlanSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Plan Settings</h2>

            {/* Rename Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name</label>
              <input
                type="text"
                value={editingPlanName}
                onChange={(e) => setEditingPlanName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Enter plan name"
              />
              <button
                onClick={handleRenamePlanSubmit}
                disabled={!editingPlanName.trim() || editingPlanName === selectedPlan?.name}
                className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Rename Plan
              </button>
            </div>

            {/* Delete Section */}
            <div className="border-t pt-4 mb-4">
              <button
                onClick={() => setShowDeleteConfirmationModal(true)}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Plan
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                setShowPlanSettingsModal(false)
                setEditingPlanName('')
              }}
              className="w-full px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Delete Plan</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete "{selectedPlan?.name}"? This action cannot be undone.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirmationModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirmationModal(false)
                  handleDeletePlanConfirm()
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  )
}

export { Plans }