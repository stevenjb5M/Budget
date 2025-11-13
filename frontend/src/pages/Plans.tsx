import { useState, useEffect } from 'react'
import { Nav } from '../components/Nav'
import { plansAPI, budgetsAPI, assetsAPI, debtsAPI } from '../api/client'
import { versionSyncService } from '../services/versionSyncService'
import { versioningService } from '../services/versioningService'
import { getCurrentUserId } from '../utils/auth'
import './Plans.css'

interface Plan {
  id: string
  userId: string
  name: string
  description: string
  isActive: boolean
  months: Array<{
    month: string
    budgetId: string | null
    netWorth: number
  }>
  createdAt: string
  updatedAt: string
}

interface Budget {
  id: string
  name: string
  income: Array<{ amount: number }>
  expenses: Array<{ amount: number }>
}

export function Plans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [debts, setDebts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [showNewPlanModal, setShowNewPlanModal] = useState(false)
  const [newPlanName, setNewPlanName] = useState('')
  const [newPlanDescription, setNewPlanDescription] = useState('')
  const [autofillBudgetId, setAutofillBudgetId] = useState<string>('')
  const [plansMinimized, setPlansMinimized] = useState(true)
  const [budgetPlanningMinimized, setBudgetPlanningMinimized] = useState(false)
  const [showMonthDetailsModal, setShowMonthDetailsModal] = useState(false)
  const [selectedMonthForDetails, setSelectedMonthForDetails] = useState<string>('')
  const [showPlanSettingsModal, setShowPlanSettingsModal] = useState(false)
  const [editingPlanName, setEditingPlanName] = useState('')
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false)
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([])

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null)
        const userId = await getCurrentUserId()
        // Use version sync service for cache-first loading
        const [plansData, budgetsData, assetsData, debtsData] = await Promise.all([
          versionSyncService.getData('plans', () => plansAPI.getPlans().then(r => r.data)),
          versionSyncService.getData('budgets', () => budgetsAPI.getBudgets().then(r => r.data)),
          versionSyncService.getData('assets', () => assetsAPI.getAssets().then(r => r.data)),
          versionSyncService.getData('debts', () => debtsAPI.getDebts().then(r => r.data))
        ])
        
        // Validate and clean up orphaned expense links in budgets
        const cleanedBudgets = validateAndCleanBudgets(budgetsData, assetsData, debtsData)
        
        // If any expenses were removed, update them in the backend
        const budgetsWithChanges = cleanedBudgets.filter((cleanedBudget: any, index: number) => {
          const originalExpenseCount = budgetsData[index].expenses.length
          const cleanedExpenseCount = cleanedBudget.expenses.length
          return originalExpenseCount !== cleanedExpenseCount
        })
        
        if (budgetsWithChanges.length > 0) {
          // Update budgets that had orphaned expenses removed
          for (const budget of budgetsWithChanges) {
            await budgetsAPI.updateBudget(budget.id, budget)
          }
          console.log(`Cleaned up ${budgetsWithChanges.length} budget(s) with orphaned expenses`)
        }
        
        setPlans(plansData)
        setBudgets(cleanedBudgets)
        setAssets(assetsData)
        setDebts(debtsData)

        // Initialize selected assets with first 3 assets
        if (assetsData.length > 0) {
          setSelectedAssetIds(assetsData.slice(0, 3).map((asset: any) => asset.id))
        }

        if (plansData.length > 0) {
          const activePlan = plansData.find((p: Plan) => p.isActive)
          setSelectedPlanId(activePlan?.id || plansData[0].id)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Failed to load plans data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const selectedPlan = plans.find(p => p.id === selectedPlanId)

  // Helper function to validate and clean up orphaned expense links
  const validateAndCleanBudgets = (budgetsToValidate: Budget[], assetsList: any[], debtsList: any[]): Budget[] => {
    const assetIds = new Set(assetsList.map((a: any) => a.id))
    const debtIds = new Set(debtsList.map((d: any) => d.id))

    return budgetsToValidate.map((budget: any) => ({
      ...budget,
      expenses: budget.expenses
        .filter((expense: any) => {
          // Keep regular expenses
          if (expense.type === 'regular') return true
          
          // Remove asset expenses if asset no longer exists
          if (expense.type === 'asset' && expense.linkedAssetId && !assetIds.has(expense.linkedAssetId)) {
            console.warn(`Removed orphaned asset expense "${expense.name}" - asset no longer exists`)
            return false
          }
          
          // Remove debt expenses if debt no longer exists
          if (expense.type === 'debt' && expense.linkedDebtId && !debtIds.has(expense.linkedDebtId)) {
            console.warn(`Removed orphaned debt expense "${expense.name}" - debt no longer exists`)
            return false
          }
          
          return true
        })
    }))
  }

  // Calculate current net worth (assets - debts)
  const currentAssetsTotal = assets.reduce((sum: number, asset: any) => sum + asset.currentValue, 0)
  const currentDebtsTotal = debts.reduce((sum: number, debt: any) => sum + debt.currentBalance, 0)
  const currentNetWorth = currentAssetsTotal - currentDebtsTotal

  // Helper function to calculate asset value for a given month (cumulative from start)
  const calculateAssetValueForMonth = (asset: any, monthString: string): number => {
    if (!selectedPlan) return asset.currentValue

    const monthIndex = selectedPlan.months.findIndex(m => m.month === monthString)
    if (monthIndex === -1) return asset.currentValue

    // Calculate cumulative deposits from month 0 to current month
    let totalDeposits = 0
    for (let i = 0; i <= monthIndex; i++) {
      const monthData = selectedPlan.months[i]
      if (monthData.budgetId) {
        const budget = budgets.find(b => b.id === monthData.budgetId)
        if (budget) {
          const assetDeposits = budget.expenses
            .filter((exp: any) => exp.type === 'asset' && exp.linkedAssetId === asset.id)
            .reduce((sum: number, exp: any) => sum + exp.amount, 0)
          totalDeposits += assetDeposits
        }
      }
    }

    return asset.currentValue + totalDeposits
  }

  // Helper function to calculate debt remaining for a given month (cumulative from start)
  const calculateDebtRemainingForMonth = (debt: any, monthString: string): number => {
    if (!selectedPlan) return debt.currentBalance

    const monthIndex = selectedPlan.months.findIndex(m => m.month === monthString)
    if (monthIndex === -1) return debt.currentBalance

    // Calculate cumulative payments from month 0 to current month
    let totalPayments = 0
    for (let i = 0; i <= monthIndex; i++) {
      const monthData = selectedPlan.months[i]
      if (monthData.budgetId) {
        const budget = budgets.find(b => b.id === monthData.budgetId)
        if (budget) {
          const debtPayments = budget.expenses
            .filter((exp: any) => exp.type === 'debt' && exp.linkedDebtId === debt.id)
            .reduce((sum: number, exp: any) => sum + exp.amount, 0)
          totalPayments += debtPayments
        }
      }
    }

    return Math.max(0, debt.currentBalance - totalPayments)
  }

  // Recalculate net worth values when component mounts or current net worth changes
  useEffect(() => {
    setPlans(currentPlans => 
      currentPlans.map(plan => ({
        ...plan,
        months: plan.months.map((month, index) => {
          // Calculate net worth as cumulative assets - cumulative debts
          let totalAssets = currentAssetsTotal
          let totalDebts = currentDebtsTotal
          
          // Add up all income and regular expenses from month 0 to current month
          let cumulativeIncome = 0
          let cumulativeRegularExpenses = 0
          
          for (let i = 0; i <= index; i++) {
            const monthData = plan.months[i]
            if (monthData.budgetId) {
              const budget = budgets.find(b => b.id === monthData.budgetId)
              if (budget) {
                const income = budget.income.reduce((sum, item) => sum + item.amount, 0)
                const regularExpenses = budget.expenses
                  .filter((exp: any) => exp.type === 'regular')
                  .reduce((sum, item) => sum + item.amount, 0)
                const assetDeposits = budget.expenses
                  .filter((exp: any) => exp.type === 'asset')
                  .reduce((sum, item) => sum + item.amount, 0)
                const debtPayments = budget.expenses
                  .filter((exp: any) => exp.type === 'debt')
                  .reduce((sum, item) => sum + item.amount, 0)
                
                cumulativeIncome += income
                cumulativeRegularExpenses += regularExpenses
                totalAssets += assetDeposits
                totalDebts -= debtPayments
              }
            }
          }
          
          // Net worth = current assets + cumulative income - cumulative regular expenses - current debts
          const netWorth = totalAssets - Math.max(0, totalDebts)
          
          return {
            ...month,
            netWorth: netWorth
          }
        })
      }))
    )
  }, [currentNetWorth, currentAssetsTotal, currentDebtsTotal, budgets, assets, debts])

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const userId = await getCurrentUserId()
      const newPlan = {
        name: newPlanName,
        description: newPlanDescription,
        isActive: plans.length === 0,
        months: Array.from({ length: 24 }, (_, i) => {
          const date = new Date(2025, i, 1)
          return {
            month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
            budgetId: autofillBudgetId || null,
            netWorth: currentNetWorth
          }
        })
      }
      
      const response = await plansAPI.createPlan(newPlan)
      const updatedPlans = [...plans, response.data]

      // Store updated data locally
      versioningService.storeData('plans', userId, updatedPlans)

      setPlans(updatedPlans)
      setSelectedPlanId(response.data.id)
      setNewPlanName('')
      setNewPlanDescription('')
      setAutofillBudgetId('')
      setShowNewPlanModal(false)
    } catch (error) {
      console.error('Error creating plan:', error)
      setError('Failed to create plan. Please try again.')
    }
  }

  const handleSelectPlan = async (planId: string) => {
    try {
      const userId = await getCurrentUserId()
      // Update all plans to set the selected one as active
      const updatedPlans = await Promise.all(
        plans.map(async (p) => {
          const isActive = p.id === planId
          if (p.isActive !== isActive) {
            const updatedPlan = {
              ...p,
              isActive,
              updatedAt: new Date().toISOString()
            }
            await plansAPI.updatePlan(p.id, updatedPlan)
            return updatedPlan
          }
          return p
        })
      )

      setPlans(updatedPlans)
      setSelectedPlanId(planId)

      // Store updated data locally
      versioningService.storeData('plans', userId, updatedPlans)
    } catch (error) {
      console.error('Error selecting plan:', error)
      setError('Failed to select plan. Please try again.')
    }
  }

  const handleRenamePlan = async () => {
    if (!selectedPlan || !editingPlanName.trim()) return

    try {
      const userId = await getCurrentUserId()
      const updatedPlan = {
        ...selectedPlan,
        name: editingPlanName.trim()
      }

      await plansAPI.updatePlan(selectedPlanId, updatedPlan)
      const updatedPlans = plans.map(p => p.id === selectedPlanId ? updatedPlan : p)

      setPlans(updatedPlans)
      versioningService.storeData('plans', userId, updatedPlans)
      setShowPlanSettingsModal(false)
      setEditingPlanName('')
    } catch (error) {
      console.error('Error renaming plan:', error)
      setError('Failed to rename plan. Please try again.')
    }
  }

  const handleDeletePlan = async () => {
    if (!selectedPlan) return

    try {
      const userId = await getCurrentUserId()
      await plansAPI.deletePlan(selectedPlanId)

      const updatedPlans = plans.filter(p => p.id !== selectedPlanId)
      setPlans(updatedPlans)
      versioningService.storeData('plans', userId, updatedPlans)

      if (updatedPlans.length > 0) {
        setSelectedPlanId(updatedPlans[0].id)
      } else {
        setSelectedPlanId('')
      }

      setShowPlanSettingsModal(false)
    } catch (error) {
      console.error('Error deleting plan:', error)
      setError('Failed to delete plan. Please try again.')
    }
  }

  const handleBudgetChange = async (monthIndex: number, budgetId: string) => {
    try {
      const userId = await getCurrentUserId()
      const plan = plans.find(p => p.id === selectedPlanId)
      if (!plan) return

      const updatedMonths = [...plan.months]
      updatedMonths[monthIndex] = {
        ...updatedMonths[monthIndex],
        budgetId: budgetId || null
      }

      const updatedPlan = {
        ...plan,
        months: updatedMonths,
        updatedAt: new Date().toISOString()
      }

      await plansAPI.updatePlan(selectedPlanId, updatedPlan)

      const updatedPlans = plans.map(p =>
        p.id === selectedPlanId ? updatedPlan : p
      )

      setPlans(updatedPlans)

      // Store updated data locally
      versioningService.storeData('plans', userId, updatedPlans)
    } catch (error) {
      console.error('Error updating budget:', error)
      setError('Failed to update budget. Please try again.')
    }
  }

  const getMonthName = (monthString: string) => {
    const [year, month] = monthString.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
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
                                  title={`Select asset ${index + 1} to display`}
                                >
                                  <option value="">None</option>
                                  {assets.map((assetOption: any) => (
                                    <option key={assetOption.id} value={assetOption.id}>
                                      {assetOption.name}
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
                                <div className="border border-gray-200 rounded-lg p-4">
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
                                      const assetId = selectedAssetIds[assetIndex]
                                      const asset = assets.find((a: any) => a.id === assetId)
                                      const assetValue = asset ? calculateAssetValueForMonth(asset, monthData.month) : 0
                                      return (
                                        <div key={assetIndex} className="text-center">
                                          <div className="text-sm font-medium text-gray-900">
                                            {assetId ? `$${assetValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
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
                                      <button
                                        onClick={() => {
                                          setSelectedMonthForDetails(monthData.month)
                                          setShowMonthDetailsModal(true)
                                        }}
                                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                                        title={`View assets & debts for ${getMonthName(monthData.month)}`}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
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
                  <p className="text-gray-500">Select a plan to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* New Plan Modal */}
      {showNewPlanModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" onClick={() => setShowNewPlanModal(false)}>
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Plan</h3>
              <form onSubmit={handleCreatePlan}>
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
                        const projectedValue = calculateAssetValueForMonth(asset, selectedMonthForDetails)
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
                        const remainingBalance = calculateDebtRemainingForMonth(debt, selectedMonthForDetails)
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
                onClick={handleRenamePlan}
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
                  handleDeletePlan()
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