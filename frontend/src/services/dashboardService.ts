// Dashboard/Home page business logic and calculations

import { User, Asset, Debt } from '../types'

export interface DashboardData {
  user: User | null
  assets: Asset[]
  debts: Debt[]
  assetsTotal: number
  debtsTotal: number
  netWorth: number
  age: number
}

/**
 * Calculate total value of all assets
 */
export function calculateAssetsTotal(assets: Asset[]): number {
  return assets.reduce((sum, asset) => sum + asset.currentValue, 0)
}

/**
 * Calculate total value of all debts
 */
export function calculateDebtsTotal(debts: Debt[]): number {
  return debts.reduce((sum, debt) => sum + debt.currentBalance, 0)
}

/**
 * Calculate net worth (assets - debts)
 */
export function calculateNetWorth(assetsTotal: number, debtsTotal: number): number {
  return assetsTotal - debtsTotal
}

/**
 * Calculate user's age based on birthday
 */
export function calculateAge(birthdayString: string): number {
  const today = new Date()
  const birthDate = new Date(birthdayString.split('T')[0]) // Remove time part if present
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  })
}

/**
 * Format birthday date for display (UTC timezone to avoid timezone issues)
 */
export function formatBirthdayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  })
}

/**
 * Get complete dashboard data with all calculations
 */
export function getDashboardData(
  user: User | null,
  assets: Asset[],
  debts: Debt[]
): DashboardData {
  const assetsTotal = calculateAssetsTotal(assets)
  const debtsTotal = calculateDebtsTotal(debts)
  const netWorth = calculateNetWorth(assetsTotal, debtsTotal)
  const age = user ? calculateAge(user.birthdayString) : 0

  return {
    user,
    assets,
    debts,
    assetsTotal,
    debtsTotal,
    netWorth,
    age
  }
}