// Plan-related business logic and calculations

export interface Plan {
  id: string
  userId: string
  name: string
  description: string
  isActive: boolean
  months: Array<{
    month: string
    budgetId: string | null
    netWorth: number
    transactions?: Array<{
      id: string
      type: 'asset' | 'debt'
      targetId: string
      amount: number
      description: string
      isEditing?: boolean
    }>
  }>
  createdAt: string
  updatedAt: string
}

export interface Budget {
  id: string
  name: string
  income: Array<{ amount: number }>
  expenses: Array<{ amount: number }>
}

export interface Asset {
  id: string
  name: string
  currentValue: number
}

export interface Debt {
  id: string
  name: string
  currentBalance: number
}

// Helper function to calculate asset value for a given month (cumulative from start)
export const calculateAssetValueForMonth = (
  asset: Asset,
  monthString: string,
  selectedPlan: Plan | undefined,
  budgets: Budget[]
): number => {
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
    // Add transaction deposits
    if (monthData.transactions) {
      const transactionDeposits = monthData.transactions
        .filter((t: any) => t.type === 'asset' && t.targetId === asset.id)
        .reduce((sum: number, t: any) => sum + t.amount, 0)
      totalDeposits += transactionDeposits
    }
  }

  return asset.currentValue + totalDeposits
}

// Helper function to calculate debt remaining for a given month (cumulative from start)
export const calculateDebtRemainingForMonth = (
  debt: Debt,
  monthString: string,
  selectedPlan: Plan | undefined,
  budgets: Budget[]
): number => {
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
    // Add transaction payments
    if (monthData.transactions) {
      const transactionPayments = monthData.transactions
        .filter((t: any) => t.type === 'debt' && t.targetId === debt.id)
        .reduce((sum: number, t: any) => sum + t.amount, 0)
      totalPayments += transactionPayments
    }
  }

  return Math.max(0, debt.currentBalance - totalPayments)
}