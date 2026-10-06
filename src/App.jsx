import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'

const Home = lazy(() => import('./pages/Home'))
const Directory = lazy(() => import('./pages/Directory'))
const Suggest = lazy(() => import('./pages/Suggest'))

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-futa-400" />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <div className="flex h-dvh flex-col bg-ink text-white">
        <Navbar />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/directory" element={<Directory />} />
              <Route path="/suggest" element={<Suggest />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </AuthProvider>
  )
}