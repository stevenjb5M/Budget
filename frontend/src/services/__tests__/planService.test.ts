import { describe, it, expect } from 'vitest'
import {
  calculateAssetValueForMonth,
  calculateDebtRemainingForMonth,
  type Plan,
  type Budget,
  type Asset,
  type Debt
} from '../../services/planService'

// Mock data for testing
const mockAsset: Asset = {
  id: 'asset-1',
  name: 'Savings Account',
  currentValue: 1000
}

const mockDebt: Debt = {
  id: 'debt-1',
  name: 'Credit Card',
  currentBalance: 500
}

const mockBudget: Budget = {
  id: 'budget-1',
  name: 'Monthly Budget',
  income: [{ amount: 3000 }],
  expenses: [
    { type: 'regular', name: 'Rent', amount: 1200, category: 'Housing' },
    { type: 'asset', name: 'Savings Deposit', amount: 200, linkedAssetId: 'asset-1' },
    { type: 'debt', name: 'Credit Card Payment', amount: 100, linkedDebtId: 'debt-1' }
  ]
}

const mockPlan: Plan = {
  id: 'plan-1',
  userId: 'user-1',
  name: 'Test Plan',
  description: 'A test plan',
  isActive: true,
  months: [
    {
      month: '2025-01',
      budgetId: 'budget-1',
      netWorth: 500,
      transactions: []
    },
    {
      month: '2025-02',
      budgetId: 'budget-1',
      netWorth: 600,
      transactions: [
        { id: 'trans-1', type: 'asset', targetId: 'asset-1', amount: 50, description: 'Bonus' },
        { id: 'trans-2', type: 'debt', targetId: 'debt-1', amount: 25, description: 'Extra payment' }
      ]
    }
  ],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z'
}

describe('planService', () => {
  describe('calculateAssetValueForMonth', () => {
    it('returns current value when no plan is provided', () => {
      const result = calculateAssetValueForMonth(mockAsset, '2025-01', undefined, [])
      expect(result).toBe(1000)
    })

    it('returns current value when month is not in plan', () => {
      const result = calculateAssetValueForMonth(mockAsset, '2025-03', mockPlan, [mockBudget])
      expect(result).toBe(1000)
    })

    it('calculates asset value with budget deposits', () => {
      const result = calculateAssetValueForMonth(mockAsset, '2025-01', mockPlan, [mockBudget])
      // Current value (1000) + deposit from budget (200) = 1200
      expect(result).toBe(1200)
    })

    it('calculates asset value with transactions', () => {
      const result = calculateAssetValueForMonth(mockAsset, '2025-02', mockPlan, [mockBudget])
      // Month 0: 1000 + 200 = 1200
      // Month 1: 1200 + 200 + 50 = 1450
      expect(result).toBe(1450)
    })

    it('handles multiple months correctly', () => {
      const extendedPlan: Plan = {
        ...mockPlan,
        months: [
          ...mockPlan.months,
          {
            month: '2025-03',
            budgetId: 'budget-1',
            netWorth: 700,
            transactions: []
          }
        ]
      }

      const result = calculateAssetValueForMonth(mockAsset, '2025-03', extendedPlan, [mockBudget])
      // Month 0: 1000 + 200 = 1200
      // Month 1: 1200 + 200 + 50 = 1450
      // Month 2: 1450 + 200 = 1650
      expect(result).toBe(1650)
    })
  })

  describe('calculateDebtRemainingForMonth', () => {
    it('returns current balance when no plan is provided', () => {
      const result = calculateDebtRemainingForMonth(mockDebt, '2025-01', undefined, [])
      expect(result).toBe(500)
    })

    it('returns current balance when month is not in plan', () => {
      const result = calculateDebtRemainingForMonth(mockDebt, '2025-03', mockPlan, [mockBudget])
      expect(result).toBe(500)
    })

    it('calculates debt remaining with budget payments', () => {
      const result = calculateDebtRemainingForMonth(mockDebt, '2025-01', mockPlan, [mockBudget])
      // Current balance (500) - payment from budget (100) = 400
      expect(result).toBe(400)
    })

    it('calculates debt remaining with transactions', () => {
      const result = calculateDebtRemainingForMonth(mockDebt, '2025-02', mockPlan, [mockBudget])
      // Month 0: 500 - 100 = 400
      // Month 1: 400 - 100 - 25 = 275
      expect(result).toBe(275)
    })

    it('handles multiple months correctly', () => {
      const extendedPlan: Plan = {
        ...mockPlan,
        months: [
          ...mockPlan.months,
          {
            month: '2025-03',
            budgetId: 'budget-1',
            netWorth: 700,
            transactions: []
          }
        ]
      }

      const result = calculateDebtRemainingForMonth(mockDebt, '2025-03', extendedPlan, [mockBudget])
      // Month 0: 500 - 100 = 400
      // Month 1: 400 - 100 - 25 = 275
      // Month 2: 275 - 100 = 175
      expect(result).toBe(175)
    })

    it('never goes below zero', () => {
      const largePaymentBudget: Budget = {
        ...mockBudget,
        expenses: [
          ...mockBudget.expenses,
          { type: 'debt', name: 'Large Payment', amount: 600, linkedDebtId: 'debt-1' }
        ]
      }

      const result = calculateDebtRemainingForMonth(mockDebt, '2025-01', mockPlan, [largePaymentBudget])
      expect(result).toBe(0)
    })
  })
})