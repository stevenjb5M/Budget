import { NavLink } from 'react-router-dom'
import { useAuth } from './Auth'

export function Nav() {
  const { user, signOut } = useAuth()

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
                  Welcome, {user.attributes?.name || user.attributes?.email}
                </span>
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
    </nav>
  )
}