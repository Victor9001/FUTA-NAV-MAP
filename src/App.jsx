import { lazy, Suspense } from 'react'
import PageSkeleton from './components/PageSkeleton'
import { Routes, Route, useLocation } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'

const Home = lazy(() => import('./pages/Home'))
const Directory = lazy(() => import('./pages/Directory'))
const Suggest = lazy(() => import('./pages/Suggest'))


export default function App() {
  const location = useLocation()
  return (
    <AuthProvider>
      <div className="flex h-dvh flex-col bg-ink text-white  pb-16 sm:pb-0">
        <Navbar />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/directory" element={<Directory />} />
              <Route path="/suggest" element={<Suggest />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </AuthProvider>
  )
}