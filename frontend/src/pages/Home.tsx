import { Nav } from '../components/Nav'
import { useAuth } from '../components/Auth'
import { useEffect, useState } from 'react'
import { usersAPI, assetsAPI, debtsAPI } from '../api/client'

interface User {
  id: string
  name: string
  email: string
  birthday: string
  retirementAge: number
  createdAt: string
  updatedAt: string
}

interface Asset {
  id: string
  name: string
  currentValue: number
  annualAPY: number
  notes?: string
  userId: string
  createdAt: string
  updatedAt: string
}

interface Debt {
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

export function Home() {
  const { user } = useAuth()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setError(null)

        // Fetch user data
        const userResponse = await usersAPI.getCurrentUser()
        setCurrentUser(userResponse.data)

        // Fetch assets and debts for net worth calculation
        const [assetsResponse, debtsResponse] = await Promise.all([
          assetsAPI.getAssets(),
          debtsAPI.getDebts()
        ])

        setAssets(assetsResponse.data)
        setDebts(debtsResponse.data)

      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Failed to load financial data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // Calculate totals
  const assetsTotal = assets.reduce((sum: number, asset: Asset) => sum + asset.currentValue, 0)
  const debtsTotal = debts.reduce((sum: number, debt: Debt) => sum + debt.currentBalance, 0)
  const netWorth = assetsTotal - debtsTotal

  // Calculate age
  const today = new Date()
  const birthDate = currentUser ? new Date(currentUser.birthday) : new Date()
  const age = currentUser ? today.getFullYear() - birthDate.getFullYear() -
    (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0) : 0

  // Format dates
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
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
          {/* Loading State */}
          {loading && (
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <div className="text-red-800">
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          {/* Welcome Section */}
          {!loading && !error && currentUser && (
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {currentUser.name}!
              </h2>
              <p className="text-gray-600">
                Here's your financial overview for today.
              </p>
            </div>
          )}

          {/* Main Overview Grid */}
          {!loading && !error && currentUser && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Date & Age Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Date & Age</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Today's Date</span>
                  <span className="font-medium text-gray-900">{formatDate(today)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Your Birthday</span>
                  <span className="font-medium text-gray-900">{formatDate(birthDate)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Your Age</span>
                  <span className="font-medium text-gray-900">{age} years old</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Retirement Age</span>
                  <span className="font-medium text-gray-900">{currentUser?.retirementAge || 65} years old</span>
                </div>
              </div>
            </div>

            {/* Net Worth Summary */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Net Worth</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Assets</span>
                  <span className="font-bold text-lg text-gray-900">
                    ${assetsTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Debts</span>
                  <span className="font-bold text-lg text-red-600">
                    ${debtsTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Net Worth</span>
                  <span className={`font-bold text-xl ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Settings Section */}
          {!loading && !error && currentUser && (
            <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Account Information</h4>
                <p className="text-sm text-gray-600">Update your personal details and preferences</p>
                <button className="mt-2 px-4 py-2 bg-[#0171bd] text-white rounded-md hover:bg-[#0156a3] transition-colors">
                  Edit Profile
                </button>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Financial Goals</h4>
                <p className="text-sm text-gray-600">Set and track your financial objectives</p>
                <button className="mt-2 px-4 py-2 bg-[#0171bd] text-white rounded-md hover:bg-[#0156a3] transition-colors">
                  Manage Goals
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      </main>
    </div>
  )
}