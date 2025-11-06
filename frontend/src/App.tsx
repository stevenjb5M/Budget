import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useState } from 'react'
import dummyAssets from './data/assets.json'
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
  const [assets, setAssets] = useState<Asset[]>(dummyAssets)
  const [showModal, setShowModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null)
  const [newAsset, setNewAsset] = useState({ name: '', currentValue: 0, annualAPY: 0 })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const asset: Asset = {
      id: Date.now().toString(),
      userId: 'user1',
      name: newAsset.name,
      currentValue: newAsset.currentValue,
      annualAPY: newAsset.annualAPY,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setAssets([...assets, asset])
    setNewAsset({ name: '', currentValue: 0, annualAPY: 0 })
    setShowModal(false)
  }

  const handleDelete = (id: string) => {
    const asset = assets.find(a => a.id === id)
    if (asset) {
      setAssetToDelete(asset)
      setShowConfirmModal(true)
    }
  }

  const confirmDelete = () => {
    if (assetToDelete) {
      setAssets(assets.filter(asset => asset.id !== assetToDelete.id))
      setShowConfirmModal(false)
      setAssetToDelete(null)
    }
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
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Assets</h2>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              New Asset
            </button>
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900">Your Assets</h3>
            <ul className="mt-4 space-y-2">
              {assets.map((asset) => (
                <li key={asset.id} className="flex justify-between items-center p-4 bg-white shadow rounded-lg">
                  <div className="flex space-x-6">
                    <span className="font-medium text-black">{asset.name}</span>
                    <span className="text-gray-600">Value: ${asset.currentValue.toFixed(2)}</span>
                    <span className="text-gray-600">APY: {asset.annualAPY}%</span>
                  </div>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    className="text-red-600 hover:text-red-800 p-2"
                    title="Delete asset"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" onClick={() => setShowModal(false)}>
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900">Create New Asset</h3>
              <form onSubmit={handleCreate} className="mt-4 space-y-4 px-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    id="name"
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                    className="mt-1 mb-2 block w-80 border-gray-300 rounded-md shadow-sm text-black"
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
                    className="mt-1 mb-2 block w-80 border-gray-300 rounded-md shadow-sm text-black"
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
                    className="mt-1 mb-2 block w-80 border-gray-300 rounded-md shadow-sm text-black"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Create Asset
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && assetToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" onClick={() => setShowConfirmModal(false)}>
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900">Confirm Deletion</h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete the asset "{assetToDelete.name}"? This action cannot be undone.
              </p>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
