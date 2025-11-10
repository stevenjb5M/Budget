import { useState, useEffect } from 'react'
import dummyPlans from '../data/plans.json'
import dummyBudgets from '../data/budgets.json'
import dummyAssets from '../data/assets.json'
import dummyDebts from '../data/debts.json'
import { Nav } from '../components/Nav'

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
  const [plans, setPlans] = useState<Plan[]>(dummyPlans)
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    plans.find(p => p.isActive)?.id || plans[0]?.id || ''
  )
  const [showNewPlanModal, setShowNewPlanModal] = useState(false)
  const [newPlanName, setNewPlanName] = useState('')
  const [newPlanDescription, setNewPlanDescription] = useState('')
  const [plansMinimized, setPlansMinimized] = useState(false)
  const [budgetPlanningMinimized, setBudgetPlanningMinimized] = useState(false)

  const selectedPlan = plans.find(p => p.id === selectedPlanId)
  const budgets = dummyBudgets as Budget[]

  // Calculate current net worth (assets - debts)
  const currentAssetsTotal = dummyAssets.reduce((sum, asset) => sum + asset.currentValue, 0)
  const currentDebtsTotal = dummyDebts.reduce((sum, debt) => sum + debt.currentBalance, 0)
  const currentNetWorth = currentAssetsTotal - currentDebtsTotal

  // Recalculate net worth values when component mounts or current net worth changes
  useEffect(() => {
    setPlans(currentPlans => 
      currentPlans.map(plan => ({
        ...plan,
        months: plan.months.map((month, index) => {
          if (!month.budgetId) {
            // No budget - use previous month's net worth or current net worth for first month
            const previousNetWorth = index === 0 ? currentNetWorth : plan.months[index - 1].netWorth
            return { ...month, netWorth: previousNetWorth }
          }

          const budget = budgets.find(b => b.id === month.budgetId)
          if (!budget) return month

          const budgetIncome = budget.income.reduce((sum, item) => sum + item.amount, 0)
          const budgetExpenses = budget.expenses.reduce((sum, item) => sum + item.amount, 0)
          const budgetNet = budgetIncome - budgetExpenses

          const previousNetWorth = index === 0 ? currentNetWorth : plan.months[index - 1].netWorth
          return {
            ...month,
            netWorth: previousNetWorth + budgetNet
          }
        })
      }))
    )
  }, [currentNetWorth, budgets])

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault()
    const newPlan: Plan = {
      id: Date.now().toString(),
      userId: 'user1',
      name: newPlanName,
      description: newPlanDescription,
      isActive: plans.length === 0,
      months: Array.from({ length: 24 }, (_, i) => {
        const date = new Date(2025, i, 1)
        return {
          month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
          budgetId: null,
          netWorth: currentNetWorth
        }
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setPlans([...plans, newPlan])
    if (plans.length === 0) {
      setSelectedPlanId(newPlan.id)
    }
    setNewPlanName('')
    setNewPlanDescription('')
    setShowNewPlanModal(false)
  }

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId)
    setPlans(plans.map(p => ({
      ...p,
      isActive: p.id === planId
    })))
  }

  const handleBudgetChange = (monthIndex: number, budgetId: string) => {
    if (!selectedPlan) return

    setPlans(plans.map(p =>
      p.id === selectedPlanId
        ? {
            ...p,
            months: p.months.map((month, index) => {
              if (index < monthIndex) {
                // Keep previous months unchanged
                return month
              } else if (index === monthIndex) {
                // Update this month
                if (!budgetId) {
                  // No budget selected - use previous month's net worth
                  const previousNetWorth = index === 0 ? currentNetWorth : p.months[index - 1].netWorth
                  return {
                    ...month,
                    budgetId: null,
                    netWorth: previousNetWorth
                  }
                } else {
                  // Budget selected - calculate new net worth
                  const selectedBudget = budgets.find(b => b.id === budgetId)
                  if (!selectedBudget) return month

                  const budgetIncome = selectedBudget.income.reduce((sum, item) => sum + item.amount, 0)
                  const budgetExpenses = selectedBudget.expenses.reduce((sum, item) => sum + item.amount, 0)
                  const budgetNet = budgetIncome - budgetExpenses

                  const previousNetWorth = index === 0 ? currentNetWorth : p.months[index - 1].netWorth
                  return {
                    ...month,
                    budgetId,
                    netWorth: previousNetWorth + budgetNet
                  }
                }
              } else {
                // Recalculate all future months
                const prevMonth = p.months[index - 1]
                if (!prevMonth.budgetId) {
                  // Previous month has no budget, so this month should match
                  return {
                    ...month,
                    netWorth: prevMonth.netWorth
                  }
                } else {
                  // Previous month has budget, continue with same calculation
                  const selectedBudget = budgets.find(b => b.id === prevMonth.budgetId)
                  if (!selectedBudget) return month

                  const budgetIncome = selectedBudget.income.reduce((sum, item) => sum + item.amount, 0)
                  const budgetExpenses = selectedBudget.expenses.reduce((sum, item) => sum + item.amount, 0)
                  const budgetNet = budgetIncome - budgetExpenses

                  return {
                    ...month,
                    netWorth: prevMonth.netWorth + budgetNet
                  }
                }
              }
            }),
            updatedAt: new Date().toISOString()
          }
        : p
    ))
  }

  const getMonthName = (monthString: string) => {
    const [year, month] = monthString.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
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
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Financial Plans</h2>
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
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                      title={plansMinimized ? "Expand plans" : "Minimize plans"}
                    >
                      {plansMinimized ? (
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
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedPlan.name}</h3>
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
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <h5 className="font-medium text-gray-900 w-24">{getMonthName(monthData.month)}</h5>
                                    <div className="flex-1 max-w-xs">
                                      <div className="flex items-center space-x-2">
                                        <label className="text-sm font-medium text-gray-700">Budget:</label>
                                        <select
                                          value={monthData.budgetId || ''}
                                          onChange={(e) => handleBudgetChange(index, e.target.value)}
                                          className="flex-1 border-gray-300 rounded-md shadow-sm text-black text-sm"
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
                                    </div>
                                  </div>
                                  <div className={`text-lg font-bold ${monthData.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${monthData.netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
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
    </div>
  )
}