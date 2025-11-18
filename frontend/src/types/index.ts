// Shared type definitions for the Budget Planner application

import React from 'react'

export interface User {
  id: string
  displayName: string
  email: string
  birthdayString: string
  retirementAge: number
  createdAt: string
  updatedAt: string
}

export interface Asset {
  id: string
  name: string
  currentValue: number
  annualAPY: number
  notes?: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Debt {
  id: string
  name: string
  currentBalance: number
  interestRate: number
  minimumPayment: number
  notes?: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Budget {
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

export interface BudgetItem {
  id: string
  name: string
  amount: number
  category: string
  linkedAssetId?: string
  linkedDebtId?: string
  type?: 'regular' | 'asset' | 'debt'
}

export interface AuthProps {
  children: React.ReactNode
}

export interface AuthContextType {
  user: any
  signOut: () => void
}

export interface SortableAssetItemProps {
  asset: Asset
  onUpdate: (asset: Asset) => void
  onDelete: (id: string) => void
}

export interface SortableDebtItemProps {
  debt: Debt
  onUpdate: (debt: Debt) => void
  onDelete: (id: string) => void
}