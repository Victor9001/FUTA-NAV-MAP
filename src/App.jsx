import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Directory from './pages/Directory'

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-ink text-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/directory" element={<Directory />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}