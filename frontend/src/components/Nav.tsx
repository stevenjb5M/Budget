import { NavLink } from 'react-router-dom'
import { useAuth } from './Auth'
import { useState, useEffect } from 'react'
import { usersAPI } from '../api/client'
import { updateUserAttributes } from 'aws-amplify/auth'
import './Nav.css'

export function Nav() {
  const { user, signOut } = useAuth()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [retirementAge, setRetirementAge] = useState(65)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isSettingsOpen && user) {
      fetchUserData()
    }
  }, [isSettingsOpen, user])

  const fetchUserData = async () => {
    try {
      const response = await usersAPI.getCurrentUser()
      setCurrentUser(response.data)
      setDisplayName(response.data.displayName || '')
      setBirthday(response.data.birthdayString ? response.data.birthdayString.split('T')[0] : '')
      setRetirementAge(response.data.retirementAge || 65)
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const updatedUser = {
        ...currentUser,
        displayName,
        birthdayString: birthday,
        retirementAge
      }
      await usersAPI.updateCurrentUser(updatedUser)
      
      // Update Cognito attributes
      await updateUserAttributes({
        userAttributes: {
          name: displayName
        }
      })
      
      setIsSettingsOpen(false)
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('userUpdated'))
    } catch (error) {
      console.error('Error updating user:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <nav className="nav">
      <div className="nav-container">
        <div className="nav-content">
          <div className="nav-links">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                isActive
                  ? "nav-link nav-link-active"
                  : "nav-link nav-link-inactive"
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/assets"
              className={({ isActive }) =>
                isActive
                  ? "nav-link nav-link-active"
                  : "nav-link nav-link-inactive"
              }
            >
              Assets & Debts
            </NavLink>
            <NavLink
              to="/budgets"
              className={({ isActive }) =>
                isActive
                  ? "nav-link nav-link-active"
                  : "nav-link nav-link-inactive"
              }
            >
              Budgets
            </NavLink>
            <NavLink
              to="/plans"
              className={({ isActive }) =>
                isActive
                  ? "nav-link nav-link-active"
                  : "nav-link nav-link-inactive"
              }
            >
              Financial Forecaster
            </NavLink>
          </div>

          <div className="nav-user-section">
            {user && (
              <>
                <span className="nav-user-name">
                  {user.attributes?.name || user.attributes?.email}
                </span>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="nav-settings-button"
                  title="Settings"
                >
                  <svg className="nav-settings-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  onClick={signOut}
                  className="nav-sign-out-button"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Edit Profile</h2>
            <div>
              <div className="form-group">
                <label className="form-label">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="form-input"
                  placeholder="Enter your display name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Birthday
                </label>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="form-input"
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Retirement Age
                </label>
                <input
                  type="number"
                  value={retirementAge}
                  onChange={(e) => setRetirementAge(Number(e.target.value))}
                  className="form-input"
                  placeholder="65"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="modal-cancel-button"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="modal-save-button"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}