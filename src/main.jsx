import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'

window.addEventListener('vite:preloadError', (event) => {
  let last = 0
  try { last = Number(sessionStorage.getItem('chunk-reload-at') || 0) } catch { /* ignore */ }
  if (Date.now() - last < 10000) return
  event.preventDefault()
  try { sessionStorage.setItem('chunk-reload-at', String(Date.now())) } catch { /* ignore */ }
  window.location.reload()
})

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

