import { Nav } from '../components/Nav'
import { useAuth } from '../components/Auth'
import { useEffect, useState } from 'react'
import { usersAPI, assetsAPI, debtsAPI } from '../api/client'
import './Home.css'

interface User {
  id: string
  displayName: string
  email: string
  birthdayString: string
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

    // Listen for user update events
    const handleUserUpdate = () => {
      fetchData()
    }
    window.addEventListener('userUpdated', handleUserUpdate)

    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate)
    }
  }, [user])

  // Calculate totals
  const assetsTotal = assets.reduce((sum: number, asset: Asset) => sum + asset.currentValue, 0)
  const debtsTotal = debts.reduce((sum: number, debt: Debt) => sum + debt.currentBalance, 0)
  const netWorth = assetsTotal - debtsTotal

  // Calculate age
  const today = new Date()
  const birthDate = currentUser ? new Date(currentUser.birthdayString.split('T')[0]) : new Date()
  const age = currentUser ? today.getFullYear() - birthDate.getFullYear() -
    (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0) : 0

  // Format dates
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
  }

  const formatBirthdayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { timeZone: 'UTC', month: '2-digit', day: '2-digit', year: 'numeric' })
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-header-container">
          <h1 className="home-header-title">Budget Planner</h1>
        </div>
      </header>
      <Nav />
      <main className="home-main">
        <div className="home-content">
          {/* Loading State */}
          {loading && (
            <div className="home-loading-container">
              <div className="home-loading-pulse">
                <div className="home-loading-title"></div>
                <div className="home-loading-subtitle"></div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="home-error-container">
              <div className="home-error-text">
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          {/* Welcome Section */}
          {!loading && !error && currentUser && (
            <div className="home-welcome-card">
              <h2 className="home-welcome-title">
                Welcome back, {currentUser.displayName}!
              </h2>
              <p className="home-welcome-subtitle">
                Here's your financial overview for today.
              </p>
            </div>
          )}

          {/* Main Overview Grid */}
          {!loading && !error && currentUser && (
            <div className="home-dashboard-grid">
            {/* Date & Age Information */}
            <div className="home-info-card">
              <h3 className="home-info-card-title">Date & Age</h3>
              <div className="home-info-list">
                <div className="home-info-item">
                  <span className="home-info-label">Today's Date</span>
                  <span className="home-info-value">{formatDate(today)}</span>
                </div>
                <div className="home-info-item">
                  <span className="home-info-label">Your Birthday</span>
                  <span className="home-info-value">{formatBirthdayDate(birthDate)}</span>
                </div>
                <div className="home-info-item">
                  <span className="home-info-label">Your Age</span>
                  <span className="home-info-value">{age} years old</span>
                </div>
                <div className="home-info-item">
                  <span className="home-info-label">Retirement Age</span>
                  <span className="home-info-value">{currentUser?.retirementAge || 65} years old</span>
                </div>
              </div>
            </div>

            {/* Net Worth Summary */}
            <div className="home-summary-card">
              <h3 className="home-summary-title">Net Worth</h3>
              <div className="home-summary-grid">
                <div className="home-summary-item">
                  <div className="home-summary-amount home-summary-amount-neutral">
                    ${assetsTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="home-summary-label">Total Assets</div>
                </div>
                <div className="home-summary-item">
                  <div className="home-summary-amount home-summary-amount-negative">
                    ${debtsTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="home-summary-label">Total Debts</div>
                </div>
                <div className="home-net-worth">
                  <div className="home-net-worth-label">Net Worth</div>
                  <div className={`home-net-worth-amount ${netWorth >= 0 ? 'home-summary-amount-positive' : 'home-summary-amount-negative'}`}>
                    ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

        </div>
      </main>
    </div>
  )
}