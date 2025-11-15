import { Nav } from '../components/Nav'
import { Footer } from '../components/Footer'
import { useDashboard } from '../hooks/useDashboard'
import { formatDate, formatBirthdayDate } from '../services/dashboardService'
import './Home.css'

export function Home() {
  const { dashboardData, loading, error } = useDashboard()
  const { user, assetsTotal, debtsTotal, netWorth, age } = dashboardData

  // Calculate dates
  const today = new Date()
  const birthDate = user ? new Date(user.birthdayString.split('T')[0]) : new Date()

  return (
    <div className="home-page">
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
          {!loading && !error && user && (
            <div className="home-welcome-card">
              <h2 className="home-welcome-title">
                Welcome back, {user.displayName}!
              </h2>
              <p className="home-welcome-subtitle">
                Here's your financial overview for today.
              </p>
            </div>
          )}

          {/* Main Overview Grid */}
          {!loading && !error && user && (
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
                  <span className="home-info-value">{user?.retirementAge || 65} years old</span>
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
      <Footer />
    </div>
  )
}