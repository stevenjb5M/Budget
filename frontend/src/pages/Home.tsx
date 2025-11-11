import { Nav } from '../components/Nav'
import { useAuth } from '../components/Auth'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import dummyAssets from '../data/assets.json'
import dummyDebts from '../data/debts.json'
import dummyUser from '../data/user.json'

export function Home() {
  const { user } = useAuth()
  const [currentUser, setCurrentUser] = useState(dummyUser)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const client = generateClient()

          // Try to get user from API
          const userData = await client.models.User.list({
            filter: {
              id: {
                eq: user.username // Using username as user ID for now
              }
            }
          })

          if (userData.data && userData.data.length > 0) {
            setCurrentUser(userData.data[0])
          } else {
            // If no user data in API, use authenticated user info
            setCurrentUser({
              id: user.username,
              name: user.attributes?.name || user.attributes?.given_name || 'User',
              email: user.attributes?.email || '',
              birthday: user.attributes?.birthdate || dummyUser.birthday,
              retirementAge: dummyUser.retirementAge,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          // Fallback to authenticated user data
          setCurrentUser({
            id: user.username,
            name: user.attributes?.name || user.attributes?.given_name || 'User',
            email: user.attributes?.email || '',
            birthday: user.attributes?.birthdate || dummyUser.birthday,
            retirementAge: dummyUser.retirementAge,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        }
      } else {
        setCurrentUser(dummyUser)
      }
      setLoading(false)
    }

    fetchUserData()
  }, [user])

  // Calculate totals
  const assetsTotal = dummyAssets.reduce((sum, asset) => sum + asset.currentValue, 0)
  const debtsTotal = dummyDebts.reduce((sum, debt) => sum + debt.currentBalance, 0)
  const netWorth = assetsTotal - debtsTotal

  // Calculate age
  const today = new Date()
  const birthDate = new Date(currentUser.birthday)
  const age = today.getFullYear() - birthDate.getFullYear() -
    (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0)

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
          {/* Welcome Section */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {currentUser.name}!
            </h2>
            <p className="text-gray-600">
              Here's your financial overview for today.
            </p>
          </div>

          {/* Main Overview Grid */}
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
                  <span className="font-medium text-gray-900">{dummyUser.retirementAge} years old</span>
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

          {/* Settings Section */}
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
        </div>
      </main>
    </div>
  )
}