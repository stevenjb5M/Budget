import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { Plans } from './pages/Plans'
import { Budgets } from './pages/Budgets'
import { Assets } from './pages/Assets'
import './App.css'

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

export default App
