import { NavLink } from 'react-router-dom'

export function Nav() {
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-8">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "border-indigo-500 text-gray-900 border-b-2 py-4 px-1 text-sm font-medium"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 border-b-2 py-4 px-1 text-sm font-medium"
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/plans"
            className={({ isActive }) =>
              isActive
                ? "border-indigo-500 text-gray-900 border-b-2 py-4 px-1 text-sm font-medium"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 border-b-2 py-4 px-1 text-sm font-medium"
            }
          >
            Plans
          </NavLink>
          <NavLink
            to="/budgets"
            className={({ isActive }) =>
              isActive
                ? "border-indigo-500 text-gray-900 border-b-2 py-4 px-1 text-sm font-medium"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 border-b-2 py-4 px-1 text-sm font-medium"
            }
          >
            Budgets
          </NavLink>
          <NavLink
            to="/assets"
            className={({ isActive }) =>
              isActive
                ? "border-indigo-500 text-gray-900 border-b-2 py-4 px-1 text-sm font-medium"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 border-b-2 py-4 px-1 text-sm font-medium"
            }
          >
            Assets
          </NavLink>
        </div>
      </div>
    </nav>
  )
}