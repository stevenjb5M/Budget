import { useState, useEffect } from 'react'
import { Nav } from '../components/Nav'
import { budgetsAPI, assetsAPI, debtsAPI } from '../api/client'
import { versionSyncService } from '../services/versionSyncService'
import { versioningService } from '../services/versioningService'
import { getCurrentUserId } from '../utils/auth'
import './Budgets.css'

interface Budget {
  id: string
  userId: string
  name: string
  isActive: boolean
  income: Array<{
    id: string
    name: string
    amount: number
    category: string
  }>
  expenses: Array<{
    id: string
    name: string
    amount: number
    category: string
    linkedAssetId?: string
    linkedDebtId?: string
    type?: 'regular' | 'asset' | 'debt'
  }>
  createdAt: string
  updatedAt: string
}

interface BudgetItem {
  id: string
  name: string
  amount: number
  category: string
  linkedAssetId?: string
  linkedDebtId?: string
  type?: 'regular' | 'asset' | 'debt'
}

interface Asset {
  id: string
  name: string
  currentValue: number
}

interface Debt {
  id: string
  name: string
  amount: number
}

export function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('')
  const [showNewBudgetModal, setShowNewBudgetModal] = useState(false)
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [newBudgetName, setNewBudgetName] = useState('')
  const [newItem, setNewItem] = useState({ name: '', amount: 0, category: '', type: 'regular' as 'regular' | 'asset' | 'debt', linkedAssetId: '', linkedDebtId: '' })
  const [editingBudgetName, setEditingBudgetName] = useState(false)
  const [editingItem, setEditingItem] = useState<{ type: 'income' | 'expenses', id: string, field: 'name' | 'amount' | 'category' } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [budgetsMinimized, setBudgetsMinimized] = useState(true)

  // Fetch budgets, assets, and debts on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null)
        const userId = await getCurrentUserId()
        
        // Use version sync to check if cache is fresh
        await versionSyncService.syncData()
        
        // Now fetch from cache (which will be fresh if server versions are newer)
        const [budgetsData, assetsData, debtsData] = await Promise.all([
          versionSyncService.getData('budgets', () => budgetsAPI.getBudgets().then(r => r.data)),
          versionSyncService.getData('assets', () => assetsAPI.getAssets().then(r => r.data)),
          versionSyncService.getData('debts', () => debtsAPI.getDebts().then(r => r.data))
        ])
        
        // Validate and clean up orphaned expense links
        const cleanedBudgets = validateAndCleanBudgets(budgetsData, assetsData, debtsData)
        
        // If any expenses were removed, update them in the backend
        const budgetsWithChanges = cleanedBudgets.filter((cleanedBudget, index) => {
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
        
        setBudgets(cleanedBudgets)
        setAssets(assetsData)
        setDebts(debtsData)
        
        if (cleanedBudgets.length > 0) {
          const activeBudget = cleanedBudgets.find((b: Budget) => b.isActive)
          setSelectedBudgetId(activeBudget?.id || cleanedBudgets[0].id)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Failed to load data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const selectedBudget = budgets.find(b => b.id === selectedBudgetId)

  // Helper function to validate and clean up orphaned expense links
  const validateAndCleanBudgets = (budgetsToValidate: Budget[], assetsList: Asset[], debtsList: Debt[]): Budget[] => {
    const assetIds = new Set(assetsList.map(a => a.id))
    const debtIds = new Set(debtsList.map(d => d.id))

    return budgetsToValidate.map(budget => ({
      ...budget,
      expenses: budget.expenses
        .filter(expense => {
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

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const userId = await getCurrentUserId()
      const newBudget = {
        name: newBudgetName,
        isActive: budgets.length === 0,
        income: [],
        expenses: []
      }

      const response = await budgetsAPI.createBudget(newBudget)
      const updatedBudgets = [...budgets, response.data]

      // Store updated data locally
      versionSyncService.storeData('budgets', userId, updatedBudgets)

      setBudgets(updatedBudgets)
      if (budgets.length === 0) {
        setSelectedBudgetId(response.data.id)
      }
      setNewBudgetName('')
      setShowNewBudgetModal(false)
    } catch (error) {
      console.error('Error creating budget:', error)
      setError('Failed to create budget. Please try again.')
    }
  }

  const handleSelectBudget = async (budgetId: string) => {
    try {
      const userId = await getCurrentUserId()
      // Update all budgets to set the selected one as active
      const updatedBudgets = await Promise.all(
        budgets.map(async (b) => {
          const isActive = b.id === budgetId
          if (b.isActive !== isActive) {
            const updatedBudget = {
              ...b,
              isActive,
              updatedAt: new Date().toISOString()
            }
            await budgetsAPI.updateBudget(b.id, updatedBudget)
            return updatedBudget
          }
          return b
        })
      )

      setBudgets(updatedBudgets)
      setSelectedBudgetId(budgetId)

      // Store updated data locally
      versioningService.storeData('budgets', userId, updatedBudgets)
    } catch (error) {
      console.error('Error selecting budget:', error)
      setError('Failed to select budget. Please try again.')
    }
  }

  const handleAddIncome = async (e: React.FormEvent) => {
    debugger;
    e.preventDefault()
    if (!selectedBudget) return

    try {
      const userId = await getCurrentUserId()
      const newIncomeItem: BudgetItem = {
        id: Date.now().toString(),
        name: newItem.name,
        amount: newItem.amount,
        category: newItem.category
      }

      const updatedBudget = {
        ...selectedBudget,
        income: [...selectedBudget.income, newIncomeItem],
        updatedAt: new Date().toISOString()
      }

      const response = await budgetsAPI.updateBudget(selectedBudgetId, updatedBudget)
      const savedBudget = response.data
      const updatedBudgets = budgets.map(b =>
        b.id === selectedBudgetId ? savedBudget : b
      )

      // Store updated data locally
      versioningService.storeData('budgets', userId, updatedBudgets)

      setBudgets(updatedBudgets)
      setNewItem({ name: '', amount: 0, category: '', type: 'regular', linkedAssetId: '', linkedDebtId: '' })
      setShowIncomeModal(false)
    } catch (error) {
      console.error('Error adding income:', error)
      setError('Failed to add income. Please try again.')
    }
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBudget) return

    try {
      const userId = await getCurrentUserId()
      const newExpenseItem: BudgetItem = {
        id: Date.now().toString(),
        name: newItem.name,
        amount: newItem.amount,
        category: newItem.type === 'regular' ? newItem.category : '',
        type: newItem.type,
        linkedAssetId: newItem.type === 'asset' ? newItem.linkedAssetId : undefined,
        linkedDebtId: newItem.type === 'debt' ? newItem.linkedDebtId : undefined
      }

      const updatedBudget = {
        ...selectedBudget,
        expenses: [...selectedBudget.expenses, newExpenseItem],
        updatedAt: new Date().toISOString()
      }

      const response = await budgetsAPI.updateBudget(selectedBudgetId, updatedBudget)
      const savedBudget = response.data
      const updatedBudgets = budgets.map(b =>
        b.id === selectedBudgetId ? savedBudget : b
      )

      // Store updated data locally
      versioningService.storeData('budgets', userId, updatedBudgets)

      setBudgets(updatedBudgets)
      setNewItem({ name: '', amount: 0, category: '', type: 'regular', linkedAssetId: '', linkedDebtId: '' })
      setShowExpenseModal(false)
    } catch (error) {
      console.error('Error adding expense:', error)
      setError('Failed to add expense. Please try again.')
    }
  }

  const handleDeleteIncome = async (incomeId: string) => {
    if (!selectedBudget) return

    try {
      const userId = await getCurrentUserId()
      const updatedBudget = {
        ...selectedBudget,
        income: selectedBudget.income.filter(i => i.id !== incomeId),
        updatedAt: new Date().toISOString()
      }

      const response = await budgetsAPI.updateBudget(selectedBudgetId, updatedBudget)
      const savedBudget = response.data
      const updatedBudgets = budgets.map(b =>
        b.id === selectedBudgetId ? savedBudget : b
      )

      // Store updated data locally
      versioningService.storeData('budgets', userId, updatedBudgets)

      setBudgets(updatedBudgets)
    } catch (error) {
      console.error('Error deleting income:', error)
      setError('Failed to delete income. Please try again.')
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!selectedBudget) return

    try {
      const userId = await getCurrentUserId()
      const updatedBudget = {
        ...selectedBudget,
        expenses: selectedBudget.expenses.filter(e => e.id !== expenseId),
        updatedAt: new Date().toISOString()
      }

      const response = await budgetsAPI.updateBudget(selectedBudgetId, updatedBudget)
      const savedBudget = response.data
      const updatedBudgets = budgets.map(b =>
        b.id === selectedBudgetId ? savedBudget : b
      )

      // Store updated data locally
      versioningService.storeData('budgets', userId, updatedBudgets)

      setBudgets(updatedBudgets)
    } catch (error) {
      console.error('Error deleting expense:', error)
      setError('Failed to delete expense. Please try again.')
    }
  }

  const handleEditBudgetName = () => {
    if (!selectedBudget) return
    setEditValue(selectedBudget.name)
    setEditingBudgetName(true)
  }

  const handleSaveBudgetName = async () => {
    if (!selectedBudget || !editValue.trim()) return

    try {
      const userId = await getCurrentUserId()
      const updatedBudget = {
        ...selectedBudget,
        name: editValue.trim(),
        updatedAt: new Date().toISOString()
      }

      const response = await budgetsAPI.updateBudget(selectedBudgetId, updatedBudget)
      const savedBudget = response.data
      const updatedBudgets = budgets.map(b =>
        b.id === selectedBudgetId ? savedBudget : b
      )

      // Store updated data locally
      versioningService.storeData('budgets', userId, updatedBudgets)

      setBudgets(updatedBudgets)
      setEditingBudgetName(false)
      setEditValue('')
    } catch (error) {
      console.error('Error updating budget name:', error)
      setError('Failed to update budget name. Please try again.')
    }
  }

  const handleEditItem = (type: 'income' | 'expenses', id: string, field: 'name' | 'amount' | 'category', currentValue: string | number) => {
    setEditValue(currentValue.toString())
    setEditingItem({ type, id, field })
  }

  const handleSaveItem = async () => {
    if (!editingItem || !selectedBudget) return

    const { type, id, field } = editingItem
    const value = field === 'amount' ? parseFloat(editValue) : editValue.trim()

    if (field === 'amount' && (isNaN(value as number) || value as number < 0)) return

    try {
      const userId = await getCurrentUserId()
      const updatedBudget = {
        ...selectedBudget,
        [type]: selectedBudget[type].map((item: any) =>
          item.id === id
            ? { ...item, [field]: value }
            : item
        ),
        updatedAt: new Date().toISOString()
      }

      const response = await budgetsAPI.updateBudget(selectedBudgetId, updatedBudget)
      const savedBudget = response.data
      const updatedBudgets = budgets.map(b =>
        b.id === selectedBudgetId ? savedBudget : b
      )

      // Store updated data locally
      versioningService.storeData('budgets', userId, updatedBudgets)

      setBudgets(updatedBudgets)
      setEditingItem(null)
      setEditValue('')
    } catch (error) {
      console.error('Error updating item:', error)
      setError('Failed to update item. Please try again.')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (editingBudgetName) {
        handleSaveBudgetName()
      } else if (editingItem) {
        handleSaveItem()
      }
    } else if (e.key === 'Escape') {
      setEditingBudgetName(false)
      setEditingItem(null)
      setEditValue('')
    }
  }

  const totalIncome = selectedBudget?.income.reduce((sum, item) => sum + item.amount, 0) || 0
  const totalExpenses = selectedBudget?.expenses.reduce((sum, item) => sum + item.amount, 0) || 0
  const netAmount = totalIncome - totalExpenses

  return (
    <div className="budgets-page">
      <header className="budgets-header">
        <div className="budgets-header-container">
          <h1 className="budgets-header-title">Budget Planner</h1>
        </div>
      </header>
      <Nav />
      <main className="budgets-main">
        <div className="budgets-content">
          {/* Loading Overlay */}
          {loading && (
            <div className="budgets-loading-overlay">
              <div className="budgets-loading-container">
                <div className="budgets-loading-pulse">
                  <div className="budgets-loading-title"></div>
                  <div className="budgets-loading-subtitle"></div>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="budgets-error-container">
              <div className="budgets-error-text">
                <strong>Error:</strong> {error}
                <button
                  onClick={() => window.location.reload()}
                  className="budgets-error-retry-button"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="budgets-section-header">
            <h2 className="text-2xl font-bold text-gray-900">Budgets</h2>
            <button
              onClick={() => setShowNewBudgetModal(true)}
              className="budgets-create-button"
            >
              Create New Budget
            </button>
          </div>

          {budgetsMinimized && (
            <div className="mt-4 mb-4">
              <button
                onClick={() => setBudgetsMinimized(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors flex items-center space-x-2"
                title="Show budgets list"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="text-sm">Show Budgets</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Budgets List */}
            {!budgetsMinimized && (
              <div className="lg:col-span-1">
                <div className="bg-white shadow rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Your Budgets</h3>
                    <button
                      onClick={() => setBudgetsMinimized(!budgetsMinimized)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      title={budgetsMinimized ? "Show all budgets" : "Hide budgets"}
                    >
                      {budgetsMinimized ? "Show All Budgets" : "Hide Budgets"}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {budgets.map((budget) => (
                      <div
                        key={budget.id}
                        onClick={() => handleSelectBudget(budget.id)}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          budget.id === selectedBudgetId
                            ? 'bg-[#0171bd] text-white'
                            : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium">{budget.name}</div>
                        <div className={`text-sm ${budget.id === selectedBudgetId ? 'text-blue-100' : 'text-gray-500'}`}>
                          ${budget.income.reduce((sum, i) => sum + i.amount, 0).toLocaleString()} income
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Budget Details */}
            <div className={budgetsMinimized ? "lg:col-span-4" : "lg:col-span-3"}>
              {selectedBudget ? (
                <div className="space-y-6">
                  {/* Budget Header */}
                  <div className="bg-white shadow rounded-lg p-6">
                    {editingBudgetName ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSaveBudgetName}
                        onKeyDown={handleKeyPress}
                        className="text-xl font-bold text-gray-900 bg-transparent border-b-2 border-[#0171bd] outline-none w-full"
                        placeholder="Budget name"
                        autoFocus
                      />
                    ) : (
                      <h3
                        className="text-xl font-bold text-gray-900 cursor-pointer hover:text-[#0171bd] transition-colors"
                        onClick={handleEditBudgetName}
                      >
                        {selectedBudget.name}
                      </h3>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm text-gray-600">Total Income</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm text-gray-600">Total Expenses</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm text-gray-600">Net Amount</div>
                      </div>
                    </div>
                  </div>

                  {/* Income Section */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Income</h4>
                      <button
                        onClick={() => setShowIncomeModal(true)}
                        className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors text-sm"
                      >
                        Add Income
                      </button>
                    </div>
                    <div className="space-y-2">
                      {selectedBudget.income.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <div className="flex-1">
                            {editingItem?.type === 'income' && editingItem.id === item.id && editingItem.field === 'name' ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleSaveItem}
                                onKeyDown={handleKeyPress}
                                className="font-medium text-gray-900 bg-transparent border-b border-gray-300 outline-none w-full"
                                placeholder="Income name"
                                autoFocus
                              />
                            ) : (
                              <div
                                className="font-medium text-gray-900 cursor-pointer hover:text-[#0171bd] transition-colors"
                                onClick={() => handleEditItem('income', item.id, 'name', item.name)}
                              >
                                {item.name}
                              </div>
                            )}
                            <div className="text-sm text-gray-500">
                              {editingItem?.type === 'income' && editingItem.id === item.id && editingItem.field === 'category' ? (
                                <select
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={handleSaveItem}
                                  className="bg-transparent border-b border-gray-300 outline-none text-gray-500"
                                  title="Select income category"
                                  autoFocus
                                >
                                  <option value="Employment">Employment</option>
                                  <option value="Self-Employment">Self-Employment</option>
                                  <option value="Investments">Investments</option>
                                  <option value="Other">Other</option>
                                </select>
                              ) : (
                                <span
                                  className="cursor-pointer hover:text-[#0171bd] transition-colors"
                                  onClick={() => handleEditItem('income', item.id, 'category', item.category)}
                                >
                                  {item.category}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {editingItem?.type === 'income' && editingItem.id === item.id && editingItem.field === 'amount' ? (
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleSaveItem}
                                onKeyDown={handleKeyPress}
                                className="font-medium text-green-600 bg-transparent border-b border-gray-300 outline-none text-right w-24"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                autoFocus
                              />
                            ) : (
                              <span
                                className="font-medium text-green-600 cursor-pointer hover:text-[#0171bd] transition-colors"
                                onClick={() => handleEditItem('income', item.id, 'amount', item.amount)}
                              >
                                ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteIncome(item.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete income item"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expenses Section */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Expenses</h4>
                      <button
                        onClick={() => setShowExpenseModal(true)}
                        className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors text-sm"
                      >
                        Add Expense
                      </button>
                    </div>
                    <div className="space-y-2">
                      {selectedBudget.expenses.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <div className="flex-1">
                            {editingItem?.type === 'expenses' && editingItem.id === item.id && editingItem.field === 'name' ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleSaveItem}
                                onKeyDown={handleKeyPress}
                                className="font-medium text-gray-900 bg-transparent border-b border-gray-300 outline-none w-full"
                                placeholder="Expense name"
                                autoFocus
                              />
                            ) : (
                              <div
                                className="font-medium text-gray-900 cursor-pointer hover:text-[#0171bd] transition-colors"
                                onClick={() => handleEditItem('expenses', item.id, 'name', item.name)}
                              >
                                {item.name}
                              </div>
                            )}
                            <div className="text-sm text-gray-500">
                              {editingItem?.type === 'expenses' && editingItem.id === item.id && editingItem.field === 'category' ? (
                                <select
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={handleSaveItem}
                                  className="bg-transparent border-b border-gray-300 outline-none text-gray-500"
                                  title="Select expense category"
                                  autoFocus
                                >
                                  <option value="Housing">Housing</option>
                                  <option value="Food">Food</option>
                                  <option value="Transportation">Transportation</option>
                                  <option value="Entertainment">Entertainment</option>
                                  <option value="Insurance">Insurance</option>
                                  <option value="Utilities">Utilities</option>
                                  <option value="Healthcare">Healthcare</option>
                                  <option value="Other">Other</option>
                                </select>
                              ) : (
                                <span
                                  className="cursor-pointer hover:text-[#0171bd] transition-colors"
                                  onClick={() => handleEditItem('expenses', item.id, 'category', item.category)}
                                >
                                  {item.category}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {editingItem?.type === 'expenses' && editingItem.id === item.id && editingItem.field === 'amount' ? (
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleSaveItem}
                                onKeyDown={handleKeyPress}
                                className="font-medium text-red-600 bg-transparent border-b border-gray-300 outline-none text-right w-24"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                autoFocus
                              />
                            ) : (
                              <span
                                className="font-medium text-red-600 cursor-pointer hover:text-[#0171bd] transition-colors"
                                onClick={() => handleEditItem('expenses', item.id, 'amount', item.amount)}
                              >
                                ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteExpense(item.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete expense item"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg p-6 text-center">
                  <p className="text-gray-500">
                    {budgets.length === 0 
                      ? "Looks like you haven't created any budgets yet. Ready to get started?" 
                      : "Select a budget to view details"
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* New Budget Modal */}
      {showNewBudgetModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" onClick={() => setShowNewBudgetModal(false)}>
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Budget</h3>
              <form onSubmit={handleCreateBudget}>
                <div className="mb-4">
                  <label htmlFor="budgetName" className="block text-sm font-medium text-gray-700 mb-2">Budget Name</label>
                  <input
                    type="text"
                    id="budgetName"
                    value={newBudgetName}
                    onChange={(e) => setNewBudgetName(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm text-black"
                    placeholder="e.g., Monthly Budget - December 2025"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowNewBudgetModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0171bd] text-white rounded-md hover:bg-[#0156a3]"
                  >
                    Create Budget
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Income Modal */}
      {showIncomeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" onClick={() => setShowIncomeModal(false)}>
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Income</h3>
              <form onSubmit={handleAddIncome}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="incomeName" className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      id="incomeName"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      className="mt-1 w-full border-gray-300 rounded-md shadow-sm text-black"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="incomeAmount" className="block text-sm font-medium text-gray-700">Amount</label>
                    <input
                      type="number"
                      id="incomeAmount"
                      value={newItem.amount}
                      onChange={(e) => setNewItem({ ...newItem, amount: parseFloat(e.target.value) })}
                      className="mt-1 w-full border-gray-300 rounded-md shadow-sm text-black"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="incomeCategory" className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      id="incomeCategory"
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="mt-1 w-full border-gray-300 rounded-md shadow-sm text-black"
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="Employment">Employment</option>
                      <option value="Self-Employment">Self-Employment</option>
                      <option value="Investments">Investments</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowIncomeModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Add Income
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" onClick={() => setShowExpenseModal(false)}>
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Expense</h3>
              <form onSubmit={handleAddExpense}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="expenseType" className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      id="expenseType"
                      value={newItem.type}
                      onChange={(e) => setNewItem({ ...newItem, type: e.target.value as 'regular' | 'asset' | 'debt', linkedAssetId: '', linkedDebtId: '' })}
                      className="mt-1 w-full border-gray-300 rounded-md shadow-sm text-black"
                    >
                      <option value="regular">Regular Expense</option>
                      <option value="asset">Asset Deposit</option>
                      <option value="debt">Debt Payment</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="expenseName" className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      id="expenseName"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      className="mt-1 w-full border-gray-300 rounded-md shadow-sm text-black"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="expenseAmount" className="block text-sm font-medium text-gray-700">Amount</label>
                    <input
                      type="number"
                      id="expenseAmount"
                      value={newItem.amount}
                      onChange={(e) => setNewItem({ ...newItem, amount: parseFloat(e.target.value) })}
                      className="mt-1 w-full border-gray-300 rounded-md shadow-sm text-black"
                      step="0.01"
                      required
                    />
                  </div>
                  {newItem.type === 'regular' && (
                    <div>
                      <label htmlFor="expenseCategory" className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        id="expenseCategory"
                        value={newItem.category}
                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                        className="mt-1 w-full border-gray-300 rounded-md shadow-sm text-black"
                        required
                      >
                        <option value="">Select Category</option>
                        <option value="Housing">Housing</option>
                        <option value="Food">Food</option>
                        <option value="Transportation">Transportation</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  )}
                  {newItem.type === 'asset' && (
                    <div>
                      <label htmlFor="linkedAsset" className="block text-sm font-medium text-gray-700">Asset</label>
                      <select
                        id="linkedAsset"
                        value={newItem.linkedAssetId}
                        onChange={(e) => setNewItem({ ...newItem, linkedAssetId: e.target.value })}
                        className="mt-1 w-full border-gray-300 rounded-md shadow-sm text-black"
                        required
                      >
                        <option value="">Select Asset</option>
                        {assets.map((asset) => (
                          <option key={asset.id} value={asset.id}>{asset.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {newItem.type === 'debt' && (
                    <div>
                      <label htmlFor="linkedDebt" className="block text-sm font-medium text-gray-700">Debt</label>
                      <select
                        id="linkedDebt"
                        value={newItem.linkedDebtId}
                        onChange={(e) => setNewItem({ ...newItem, linkedDebtId: e.target.value })}
                        className="mt-1 w-full border-gray-300 rounded-md shadow-sm text-black"
                        required
                      >
                        <option value="">Select Debt</option>
                        {debts.map((debt) => (
                          <option key={debt.id} value={debt.id}>{debt.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowExpenseModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Add Expense
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