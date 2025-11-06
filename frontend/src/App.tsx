import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assetsAPI } from './api/client'
import { useState } from 'react'
import './App.css'

interface Asset {
  id: string
  userId: string
  name: string
  currentValue: number
  annualAPY: number
  createdAt: string
  updatedAt: string
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/assets" element={<Assets />} />
      </Routes>
    </BrowserRouter>
  )
}

function Nav() {
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

function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">Budget Planner</h1>
        </div>
      </header>
      <Nav />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <p>Welcome to Budget Planner</p>
      </main>
    </div>
  )
}

function Plans() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">Budget Planner</h1>
        </div>
      </header>
      <Nav />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div>Plans Page</div>
      </main>
    </div>
  )
}

function Budgets() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">Budget Planner</h1>
        </div>
      </header>
      <Nav />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div>Budgets Page</div>
      </main>
    </div>
  )
}

function Assets() {
  const queryClient = useQueryClient()
  const [newAsset, setNewAsset] = useState({ name: '', currentValue: 0, annualAPY: 0 })

  const { data: assets, isLoading, error } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const response = await assetsAPI.getAssets()
      return response.data as Asset[]
    }
  })

  const createMutation = useMutation({
    mutationFn: assetsAPI.createAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      setNewAsset({ name: '', currentValue: 0, annualAPY: 0 })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: assetsAPI.deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    }
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(newAsset)
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
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
          <h2 className="text-2xl font-bold text-gray-900">Assets</h2>
          <div className="mt-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  id="name"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="currentValue" className="block text-sm font-medium text-gray-700">Current Value</label>
                <input
                  type="number"
                  id="currentValue"
                  value={newAsset.currentValue}
                  onChange={(e) => setNewAsset({ ...newAsset, currentValue: parseFloat(e.target.value) })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="annualAPY" className="block text-sm font-medium text-gray-700">Annual APY (%)</label>
                <input
                  type="number"
                  step="0.01"
                  id="annualAPY"
                  value={newAsset.annualAPY}
                  onChange={(e) => setNewAsset({ ...newAsset, annualAPY: parseFloat(e.target.value) })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  required
                />
              </div>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Asset'}
              </button>
            </form>
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900">Your Assets</h3>
            {isLoading && <p>Loading...</p>}
            {error && <p>Error loading assets</p>}
            {assets && (
              <ul className="mt-4 space-y-2">
                {assets.map((asset) => (
                  <li key={asset.id} className="flex justify-between items-center p-4 bg-white shadow rounded-lg">
                    <div>
                      <h4 className="text-lg font-medium">{asset.name}</h4>
                      <p className="text-gray-600">Value: ${asset.currentValue.toFixed(2)}</p>
                      <p className="text-gray-600">APY: {asset.annualAPY}%</p>
                    </div>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                      disabled={deleteMutation.isPending}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
