import { lazy, Suspense } from 'react'
import PageSkeleton from './components/PageSkeleton'
import { Routes, Route, useLocation } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

const Home = lazy(() => import('./pages/Home'))
const Directory = lazy(() => import('./pages/Directory'))
const Suggest = lazy(() => import('./pages/Suggest'))
const Admin = lazy(() => import('./pages/Admin'))


export default function App() {
  const location = useLocation()
  const showFooter = location.pathname === '/directory' || location.pathname === '/suggest'
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
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
              {showFooter && <Footer />}
        </div>
      </div>
    </AuthProvider>
  )
}


