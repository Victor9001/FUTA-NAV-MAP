import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
     <BrowserRouter>
      <div className="h-dvh bg-ink text-white">
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </div>
    </BrowserRouter>
  </StrictMode>,
)
requestAnimationFrame(() =>
  requestAnimationFrame(() => document.getElementById('initial-loader')?.remove())
)

