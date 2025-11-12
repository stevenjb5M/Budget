import { NavLink } from 'react-router-dom'
import { useAuth } from './Auth'
import { useState, useEffect } from 'react'
import { usersAPI } from '../api/client'
import { updateUserAttributes } from 'aws-amplify/auth'

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
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-8">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive
                  ? "border-[#0171bd] text-gray-900 border-b-2 py-4 px-1 text-sm font-medium"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 border-b-2 py-4 px-1 text-sm font-medium"
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/plans"
              className={({ isActive }) =>
                isActive
                  ? "border-[#0171bd] text-gray-900 border-b-2 py-4 px-1 text-sm font-medium"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 border-b-2 py-4 px-1 text-sm font-medium"
              }
            >
              Plans
            </NavLink>
            <NavLink
              to="/budgets"
              className={({ isActive }) =>
                isActive
                  ? "border-[#0171bd] text-gray-900 border-b-2 py-4 px-1 text-sm font-medium"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 border-b-2 py-4 px-1 text-sm font-medium"
              }
            >
              Budgets
            </NavLink>
            <NavLink
              to="/assets"
              className={({ isActive }) =>
                isActive
                  ? "border-[#0171bd] text-gray-900 border-b-2 py-4 px-1 text-sm font-medium"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 border-b-2 py-4 px-1 text-sm font-medium"
              }
            >
              Assets & Debts
            </NavLink>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                <span className="text-sm text-gray-600">
                  {user.attributes?.name || user.attributes?.email}
                </span>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100 transition-colors"
                  title="Settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  onClick={signOut}
                  className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 transition-colors text-sm"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0171bd] text-gray-900"
                  placeholder="Enter your display name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Birthday
                </label>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0171bd] text-gray-900"
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Retirement Age
                </label>
                <input
                  type="number"
                  value={retirementAge}
                  onChange={(e) => setRetirementAge(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0171bd] text-gray-900"
                  placeholder="65"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-[#0171bd] text-white rounded-md hover:bg-[#0156a3] disabled:opacity-50"
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