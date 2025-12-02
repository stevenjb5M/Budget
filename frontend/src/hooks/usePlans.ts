import { useState, useEffect } from 'react'
import { Plan, Budget, Asset, Debt } from '../services/planService'
import { plansAPI, budgetsAPI, assetsAPI, debtsAPI } from '../api/client'
import { versionSyncService } from '../services/versionSyncService'
import { getCurrentUserId } from '../utils/auth'
import { calculateAssetValueForMonth, calculateDebtRemainingForMonth } from '../services/planService'

export const usePlans = () => {
  const [plans, setPlans] = useState<Plan[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recalcTrigger, setRecalcTrigger] = useState(0)

  // Fetch data on hook mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null)
        // Use version sync service for cache-first loading
        const [plansData, budgetsData, assetsData, debtsData] = await Promise.all([
          versionSyncService.getData('plans', async () => {
            const response = await plansAPI.getPlans()
            // Normalize transaction data
            const normalizedData = response.data.map((plan: Plan) => ({
              ...plan,
              months: plan.months?.map(month => ({
                ...month,
                transactions: (month.transactions || []).map(transaction => ({
                  ...transaction,
                  amount: typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : (transaction.amount || 0),
                  description: transaction.description || ''
                }))
              })) || []
            }))
            return normalizedData
          }),
          versionSyncService.getData('budgets', () => budgetsAPI.getBudgets().then(r => r.data)),
          versionSyncService.getData('assets', () => assetsAPI.getAssets().then(r => {
            const data = r.data
            // Normalize asset data
            const normalizedAssets = data.map((asset: any) => ({
              ...asset,
              currentValue: typeof asset.currentValue === 'string' ? parseFloat(asset.currentValue) : asset.currentValue
            }))
            return normalizedAssets
          })),
          versionSyncService.getData('debts', () => debtsAPI.getDebts().then(r => {
            const data = r.data
            // Normalize debt data
            const normalizedDebts = data.map((debt: any) => ({
              ...debt,
              currentBalance: typeof debt.currentBalance === 'string' ? parseFloat(debt.currentBalance) : debt.currentBalance
            }))
            return normalizedDebts
          }))
        ])

        // Validate and clean up orphaned expense links in budgets
        const cleanedBudgets = validateAndCleanBudgets(budgetsData, assetsData, debtsData)

        // Normalize asset and debt values to numbers
        const normalizedAssets = assetsData.map((asset: any) => ({
          ...asset,
          currentValue: typeof asset.currentValue === 'string' ? parseFloat(asset.currentValue) : asset.currentValue
        }))
        const normalizedDebts = debtsData.map((debt: any) => ({
          ...debt,
          currentBalance: typeof debt.currentBalance === 'string' ? parseFloat(debt.currentBalance) : debt.currentBalance
        }))

        const currentAssetsTotal = normalizedAssets.reduce((sum: number, asset: any) => sum + asset.currentValue, 0)
        const currentDebtsTotal = normalizedDebts.reduce((sum: number, debt: any) => sum + debt.currentBalance, 0)
        const currentNetWorth = currentAssetsTotal - currentDebtsTotal

        // Update plans if first month has changed
        const currentDate = new Date()
        const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
        const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`
        const updatedPlansData = await Promise.all(plansData.map(async (plan: Plan) => {
          if (plan.months && plan.months.length > 0) {
            const firstMonth = plan.months[0].month
            if (firstMonth !== nextMonth) {
              const firstDate = new Date(firstMonth + '-01')
              const diffMonths = (nextDate.getFullYear() - firstDate.getFullYear()) * 12 + nextDate.getMonth() - firstDate.getMonth()
              
              let updatedMonths = [...plan.months]
              let changed = false
              
              if (diffMonths > 0 && diffMonths < plan.months.length) {
                // Plan starts in past, shift forward by removing past months
                updatedMonths = plan.months.slice(diffMonths)
                // Add new months at the end
                const lastMonth = updatedMonths[updatedMonths.length - 1]
                const lastDate = new Date(lastMonth.month + '-01')
                for (let i = 1; i <= diffMonths; i++) {
                  const newDate = new Date(lastDate.getFullYear(), lastDate.getMonth() + i, 1)
                  const newMonthStr = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`
                  updatedMonths.push({
                    month: newMonthStr,
                    budgetId: null,
                    netWorth: currentNetWorth,
                    transactions: []
                  })
                }
              } else if (diffMonths != 0) {
                // Regenerate from next month if starts in future or too far in past
                const startYear = nextDate.getFullYear()
                const startMonth = nextDate.getMonth()
                updatedMonths = Array.from({ length: 24 }, (_, i) => {
                  const date = new Date(startYear, startMonth + i, 1)
                  return {
                    month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
                    budgetId: null,
                    netWorth: currentNetWorth,
                    transactions: []
                  }
                })
                changed = true
              }
              
              if (changed) {
                const updatedPlan = { ...plan, months: updatedMonths }
                // Update via API
                await plansAPI.updatePlan(plan.id, updatedPlan)
                return updatedPlan
              }
            }
          }
          return plan
        }))

        setPlans(updatedPlansData)
        setBudgets(cleanedBudgets)
        setAssets(normalizedAssets)
        setDebts(normalizedDebts)

        // Store updated plans data locally
        const userId = await getCurrentUserId()
        versionSyncService.storeData('plans', userId, updatedPlansData)

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

  // Recalculate net worth values when component mounts or current net worth changes
  useEffect(() => {
    setPlans(currentPlans =>
      currentPlans.map(plan => ({
        ...plan,
        months: plan.months.map((month, index) => {
          // Calculate net worth as projected assets - projected debts + cumulative income - cumulative regular expenses
          let totalAssets = assets.reduce((sum, asset) => sum + calculateAssetValueForMonth(asset, month.month, plan, budgets), 0)
          let totalDebts = debts.reduce((sum, debt) => sum + calculateDebtRemainingForMonth(debt, month.month, plan, budgets), 0)

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

                cumulativeIncome += income
                cumulativeRegularExpenses += regularExpenses
                // Note: assetDeposits and debtPayments are already included in calculateAssetValueForMonth and calculateDebtRemainingForMonth
              }
            }
          }

          // Net worth = projected assets + cumulative income - cumulative regular expenses - projected debts
          const netWorth = totalAssets + cumulativeIncome - cumulativeRegularExpenses - totalDebts

          return {
            ...month,
            netWorth: netWorth
          }
        })
      }))
    )
  }, [assets, debts, budgets, recalcTrigger])

  const handleCreatePlan = async (newPlanName: string, newPlanDescription: string, autofillBudgetId: string) => {
    try {
      const userId = await getCurrentUserId()
      const currentDate = new Date()
      const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
      const startYear = nextDate.getFullYear()
      const startMonth = nextDate.getMonth()
      const newPlan = {
        name: newPlanName,
        description: newPlanDescription,
        isActive: plans.length === 0,
        months: Array.from({ length: 24 }, (_, i) => {
          const date = new Date(startYear, startMonth + i, 1)
          return {
            month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
            budgetId: autofillBudgetId || null,
            netWorth: currentNetWorth,
            transactions: []
          }
        })
      }

      const response = await plansAPI.createPlan(newPlan)
      const updatedPlans = [...plans, response.data]

      // Store updated data locally
      versionSyncService.storeData('plans', userId, updatedPlans)

      setPlans(updatedPlans)
      setSelectedPlanId(response.data.id)
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
      versionSyncService.storeData('plans', userId, updatedPlans)
    } catch (error) {
      console.error('Error selecting plan:', error)
      setError('Failed to select plan. Please try again.')
    }
  }

  const handleAddEmptyTransaction = async (monthIndex: number) => {
    if (!selectedPlan) return

    try {
      const newTransaction = {
        id: `temp-${Date.now()}`,
        type: 'asset' as 'asset' | 'debt',
        targetId: '',
        amount: 0,
        description: '',
        isEditing: true
      }

      const updatedMonths = [...selectedPlan.months]
      if (!updatedMonths[monthIndex].transactions) {
        updatedMonths[monthIndex].transactions = []
      }
      updatedMonths[monthIndex].transactions!.push(newTransaction)

      const updatedPlan = {
        ...selectedPlan,
        months: updatedMonths,
        updatedAt: new Date().toISOString()
      }

      // Update local state only, don't save to API yet
      const updatedPlans = plans.map(p =>
        p.id === selectedPlanId ? updatedPlan : p
      )
      setPlans(updatedPlans)
    } catch (error) {
      console.error('Error adding empty transaction:', error)
      setError('Failed to add transaction. Please try again.')
    }
  }

  const handleUpdateTransaction = (monthIndex: number, transactionId: string, field: string, value: any) => {
    if (!selectedPlan) return

    const updatedMonths = [...selectedPlan.months]
    const transactionIndex = updatedMonths[monthIndex].transactions?.findIndex(t => t.id === transactionId)

    if (transactionIndex !== undefined && transactionIndex >= 0) {
      updatedMonths[monthIndex].transactions![transactionIndex] = {
        ...updatedMonths[monthIndex].transactions![transactionIndex],
        [field]: value
      }

      const updatedPlan = {
        ...selectedPlan,
        months: updatedMonths
      }

      const updatedPlans = plans.map(p =>
        p.id === selectedPlanId ? updatedPlan : p
      )
      setPlans(updatedPlans)
    }
  }

  const handleSaveTransaction = async (monthIndex: number, transactionId: string) => {
    if (!selectedPlan) return

    try {
      const userId = await getCurrentUserId()
      const transaction = selectedPlan.months[monthIndex].transactions?.find(t => t.id === transactionId)

      if (!transaction) {
        return
      }

      const dashIndex = transaction.targetId.indexOf('-')
      const transId = dashIndex > 0 ? transaction.targetId.substring(dashIndex + 1) : transaction.targetId
      const transType = dashIndex > 0 ? transaction.targetId.substring(0, dashIndex) : 'asset'

      if (!transId || transaction.amount === 0) {
        // Remove invalid transaction
        handleRemoveTransaction(monthIndex, transactionId)
        return
      }

      // Update transaction to remove editing flag and save to API
      const updatedMonths = [...selectedPlan.months]
      const transactionIndex = updatedMonths[monthIndex].transactions?.findIndex(t => t.id === transactionId)

      if (transactionIndex !== undefined && transactionIndex >= 0) {
        const cleanTransaction = {
          ...updatedMonths[monthIndex].transactions![transactionIndex],
          id: transaction.id.startsWith('temp-') ? Date.now().toString() : transaction.id,
          type: transType as 'asset' | 'debt',
          targetId: transId,
          isEditing: false
        }
        updatedMonths[monthIndex].transactions![transactionIndex] = cleanTransaction

        const updatedPlan = {
          ...selectedPlan,
          months: updatedMonths,
          updatedAt: new Date().toISOString()
        }

        await plansAPI.updatePlan(selectedPlanId, updatedPlan)

        const updatedPlans = plans.map(p =>
          p.id === selectedPlanId ? updatedPlan : p
        )
        setPlans(updatedPlans)
        versionSyncService.storeData('plans', userId, updatedPlans)
        setRecalcTrigger(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error saving transaction:', error)
      setError('Failed to save transaction. Please try again.')
    }
  }

  const handleRemoveTransaction = async (monthIndex: number, transactionId: string) => {
    if (!selectedPlan) return

    try {
      const userId = await getCurrentUserId()
      const updatedMonths = [...selectedPlan.months]
      updatedMonths[monthIndex].transactions = updatedMonths[monthIndex].transactions?.filter(t => t.id !== transactionId) || []

      const updatedPlan = {
        ...selectedPlan,
        months: updatedMonths,
        updatedAt: new Date().toISOString()
      }

      await plansAPI.updatePlan(selectedPlanId, updatedPlan)

      const updatedPlans = plans.map(p =>
        p.id === selectedPlanId ? updatedPlan : p
      )

      setPlans(updatedPlans)
      versionSyncService.storeData('plans', userId, updatedPlans)
      setRecalcTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error removing transaction:', error)
      setError('Failed to remove transaction. Please try again.')
    }
  }

  const handleRenamePlan = async (newName: string) => {
    if (!selectedPlan || !newName.trim()) return

    try {
      const userId = await getCurrentUserId()
      const updatedPlan = {
        ...selectedPlan,
        name: newName.trim(),
        updatedAt: new Date().toISOString()
      }

      await plansAPI.updatePlan(selectedPlanId, updatedPlan)

      const updatedPlans = plans.map(p =>
        p.id === selectedPlanId ? updatedPlan : p
      )

      setPlans(updatedPlans)
      versionSyncService.storeData('plans', userId, updatedPlans)
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

      // If we deleted the active plan, activate the first remaining plan
      let newSelectedPlanId = ''
      if (selectedPlan.isActive && updatedPlans.length > 0) {
        newSelectedPlanId = updatedPlans[0].id
        const activatedPlan = {
          ...updatedPlans[0],
          isActive: true,
          updatedAt: new Date().toISOString()
        }
        await plansAPI.updatePlan(newSelectedPlanId, activatedPlan)
        updatedPlans[0] = activatedPlan
      }

      setPlans(updatedPlans)
      setSelectedPlanId(newSelectedPlanId)
      versionSyncService.storeData('plans', userId, updatedPlans)
    } catch (error) {
      console.error('Error deleting plan:', error)
      setError('Failed to delete plan. Please try again.')
    }
  }

  const handleBudgetChange = async (monthIndex: number, budgetId: string) => {
    if (!selectedPlan) return

    try {
      const userId = await getCurrentUserId()
      const updatedMonths = [...selectedPlan.months]
      updatedMonths[monthIndex] = {
        ...updatedMonths[monthIndex],
        budgetId: budgetId || null
      }

      const updatedPlan = {
        ...selectedPlan,
        months: updatedMonths,
        updatedAt: new Date().toISOString()
      }

      await plansAPI.updatePlan(selectedPlanId, updatedPlan)

      const updatedPlans = plans.map(p =>
        p.id === selectedPlanId ? updatedPlan : p
      )

      setPlans(updatedPlans)
      versionSyncService.storeData('plans', userId, updatedPlans)
      
      // Trigger net worth recalculation
      setRecalcTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error updating budget:', error)
      setError('Failed to update budget. Please try again.')
    }
  }

  return {
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
  }
}