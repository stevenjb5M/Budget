import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Home } from './pages/Home'
import { Plans } from './pages/Plans'
import { Budgets } from './pages/Budgets'
import { Assets } from './pages/Assets'
import { Auth } from './components/Auth'
import './App.css'

function App() {
  return (
    <Auth>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/assets" element={<Assets />} />
        </Routes>
      </BrowserRouter>
    </Auth>
  )
}

export default App
