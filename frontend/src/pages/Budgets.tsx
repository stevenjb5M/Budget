import { useState } from 'react'
import dummyBudgets from '../data/budgets.json'
import { Nav } from '../components/Nav'

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
  }>
  createdAt: string
  updatedAt: string
}

interface BudgetItem {
  id: string
  name: string
  amount: number
  category: string
}

export function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>(dummyBudgets)
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>(
    budgets.find(b => b.isActive)?.id || budgets[0]?.id || ''
  )
  const [showNewBudgetModal, setShowNewBudgetModal] = useState(false)
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [newBudgetName, setNewBudgetName] = useState('')
  const [newItem, setNewItem] = useState({ name: '', amount: 0, category: '' })
  const [editingBudgetName, setEditingBudgetName] = useState(false)
  const [editingItem, setEditingItem] = useState<{ type: 'income' | 'expenses', id: string, field: 'name' | 'amount' | 'category' } | null>(null)
  const [editValue, setEditValue] = useState('')

  const selectedBudget = budgets.find(b => b.id === selectedBudgetId)

  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault()
    const newBudget: Budget = {
      id: Date.now().toString(),
      userId: 'user1',
      name: newBudgetName,
      isActive: budgets.length === 0,
      income: [],
      expenses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setBudgets([...budgets, newBudget])
    if (budgets.length === 0) {
      setSelectedBudgetId(newBudget.id)
    }
    setNewBudgetName('')
    setShowNewBudgetModal(false)
  }

  const handleSelectBudget = (budgetId: string) => {
    setSelectedBudgetId(budgetId)
    setBudgets(budgets.map(b => ({
      ...b,
      isActive: b.id === budgetId
    })))
  }

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBudget) return

    const newIncomeItem: BudgetItem = {
      id: Date.now().toString(),
      name: newItem.name,
      amount: newItem.amount,
      category: newItem.category
    }

    setBudgets(budgets.map(b =>
      b.id === selectedBudgetId
        ? { ...b, income: [...b.income, newIncomeItem], updatedAt: new Date().toISOString() }
        : b
    ))
    setNewItem({ name: '', amount: 0, category: '' })
    setShowIncomeModal(false)
  }

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBudget) return

    const newExpenseItem: BudgetItem = {
      id: Date.now().toString(),
      name: newItem.name,
      amount: newItem.amount,
      category: newItem.category
    }

    setBudgets(budgets.map(b =>
      b.id === selectedBudgetId
        ? { ...b, expenses: [...b.expenses, newExpenseItem], updatedAt: new Date().toISOString() }
        : b
    ))
    setNewItem({ name: '', amount: 0, category: '' })
    setShowExpenseModal(false)
  }

  const handleDeleteIncome = (incomeId: string) => {
    if (!selectedBudget) return
    setBudgets(budgets.map(b =>
      b.id === selectedBudgetId
        ? { ...b, income: b.income.filter(i => i.id !== incomeId), updatedAt: new Date().toISOString() }
        : b
    ))
  }

  const handleDeleteExpense = (expenseId: string) => {
    if (!selectedBudget) return
    setBudgets(budgets.map(b =>
      b.id === selectedBudgetId
        ? { ...b, expenses: b.expenses.filter(e => e.id !== expenseId), updatedAt: new Date().toISOString() }
        : b
    ))
  }

  const handleEditBudgetName = () => {
    if (!selectedBudget) return
    setEditValue(selectedBudget.name)
    setEditingBudgetName(true)
  }

  const handleSaveBudgetName = () => {
    if (!selectedBudget || !editValue.trim()) return
    setBudgets(budgets.map(b =>
      b.id === selectedBudgetId
        ? { ...b, name: editValue.trim(), updatedAt: new Date().toISOString() }
        : b
    ))
    setEditingBudgetName(false)
    setEditValue('')
  }

  const handleEditItem = (type: 'income' | 'expenses', id: string, field: 'name' | 'amount' | 'category', currentValue: string | number) => {
    setEditValue(currentValue.toString())
    setEditingItem({ type, id, field })
  }

  const handleSaveItem = () => {
    if (!editingItem || !selectedBudget) return

    const { type, id, field } = editingItem
    const value = field === 'amount' ? parseFloat(editValue) : editValue.trim()

    if (field === 'amount' && (isNaN(value as number) || value as number < 0)) return

    setBudgets(budgets.map(b =>
      b.id === selectedBudgetId
        ? {
            ...b,
            [type]: b[type].map((item: any) =>
              item.id === id
                ? { ...item, [field]: value }
                : item
            ),
            updatedAt: new Date().toISOString()
          }
        : b
    ))

    setEditingItem(null)
    setEditValue('')
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">Budget Planner</h1>
        </div>
      </header>
      <Nav />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Budgets</h2>
            <button
              onClick={() => setShowNewBudgetModal(true)}
              className="bg-[#0171bd] text-white px-4 py-2 rounded-md hover:bg-[#0156a3] transition-colors"
            >
              Create New Budget
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Budgets List */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Budgets</h3>
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

            {/* Budget Details */}
            <div className="lg:col-span-3">
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
                  <p className="text-gray-500">Select a budget to view details</p>
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