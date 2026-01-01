import { describe, it, expect } from 'vitest'
import {
  calculateAssetsTotal,
  calculateDebtsTotal,
  calculateNetWorth,
  calculateAge,
  formatDate,
  formatBirthdayDate,
  getDashboardData,
} from '../services/dashboardService'
import { User, Asset, Debt } from '../types'

describe('Dashboard Service', () => {
  describe('calculateAssetsTotal', () => {
    it('returns 0 for empty assets array', () => {
      expect(calculateAssetsTotal([])).toBe(0)
    })

    it('calculates total of asset values', () => {
      const assets: Asset[] = [
        { id: '1', name: 'House', currentValue: 300000, annualAPY: 0, notes: '', userId: '1', createdAt: '', updatedAt: '' },
        { id: '2', name: 'Car', currentValue: 25000, annualAPY: 0, notes: '', userId: '1', createdAt: '', updatedAt: '' },
      ]
      expect(calculateAssetsTotal(assets)).toBe(325000)
    })

    it('handles decimal values', () => {
      const assets: Asset[] = [
        { id: '1', name: 'Savings', currentValue: 12345.67, annualAPY: 0, notes: '', userId: '1', createdAt: '', updatedAt: '' },
      ]
      expect(calculateAssetsTotal(assets)).toBe(12345.67)
    })
  })

  describe('calculateDebtsTotal', () => {
    it('returns 0 for empty debts array', () => {
      expect(calculateDebtsTotal([])).toBe(0)
    })

    it('calculates total of debt balances', () => {
      const debts: Debt[] = [
        { id: '1', name: 'Mortgage', currentBalance: 250000, interestRate: 3.5, minimumPayment: 1500, notes: '', userId: '1', createdAt: '', updatedAt: '' },
        { id: '2', name: 'Car Loan', currentBalance: 15000, interestRate: 5.0, minimumPayment: 300, notes: '', userId: '1', createdAt: '', updatedAt: '' },
      ]
      expect(calculateDebtsTotal(debts)).toBe(265000)
    })
  })

  describe('calculateNetWorth', () => {
    it('calculates positive net worth', () => {
      expect(calculateNetWorth(100000, 50000)).toBe(50000)
    })

    it('calculates negative net worth', () => {
      expect(calculateNetWorth(50000, 100000)).toBe(-50000)
    })

    it('calculates zero net worth', () => {
      expect(calculateNetWorth(100000, 100000)).toBe(0)
    })
  })

  describe('calculateAge', () => {
    it('calculates age correctly', () => {
      // Test with a known date - person born in 1990 should be 35 in 2025
      const birthdayString = '1990-01-01'
      const result = calculateAge(birthdayString)
      // Since current year is 2025, age should be 35
      expect(result).toBe(36)
    })

    it('handles birthday not yet reached this year', () => {
      // Mock today's date to be before the birthday
      const mockToday = new Date('2024-06-15') // June 15, 2024
      vi.setSystemTime(mockToday)

      const birthdayString = '1990-12-25' // December 25, 1990 - birthday hasn't occurred yet in 2024
      const result = calculateAge(birthdayString)
      expect(result).toBe(33) // Should be 33 (2024 - 1990 - 1 = 33)

      vi.useRealTimers()
    })
  })

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-05-15')
      const result = formatDate(date)
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/) // MM/DD/YYYY format
    })
  })

  describe('formatBirthdayDate', () => {
    it('formats birthday date with UTC timezone', () => {
      const date = new Date('1990-05-15')
      const result = formatBirthdayDate(date)
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/) // MM/DD/YYYY format
    })
  })

  describe('getDashboardData', () => {
    it('returns complete dashboard data', () => {
      const user: User = {
        id: '1',
        displayName: 'John Doe',
        email: 'john@example.com',
        birthdayString: '1990-01-01',
        retirementAge: 65,
        createdAt: '',
        updatedAt: '',
      }

      const assets: Asset[] = [
        { id: '1', name: 'House', currentValue: 300000, annualAPY: 0, notes: '', userId: '1', createdAt: '', updatedAt: '' },
      ]

      const debts: Debt[] = [
        { id: '1', name: 'Mortgage', currentBalance: 250000, interestRate: 3.5, minimumPayment: 1500, notes: '', userId: '1', createdAt: '', updatedAt: '' },
      ]

      const result = getDashboardData(user, assets, debts)

      expect(result.user).toBe(user)
      expect(result.assets).toEqual(assets)
      expect(result.debts).toEqual(debts)
      expect(result.assetsTotal).toBe(300000)
      expect(result.debtsTotal).toBe(250000)
      expect(result.netWorth).toBe(50000)
      expect(typeof result.age).toBe('number')
      expect(result.age).toBeGreaterThan(0)
    })

    it('handles null user', () => {
      const result = getDashboardData(null, [], [])
      expect(result.user).toBeNull()
      expect(result.age).toBe(0)
    })
  })
})