import { useEffect, useState } from 'react'
import { Compass, Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'

const links = [
  { label: 'Map', to: '/#map' },
  { label: 'Directory', to: '/directory' },
  { label: 'Suggest', to: '/suggest' },
]

export default function Navbar() {
  const { currentUser, loading, logOut } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (loading || currentUser) return
    const alreadyPrompted = localStorage.getItem('futa-nav-auth-prompted')
    if (!alreadyPrompted) {
      setShowAuth(true)
      localStorage.setItem('futa-nav-auth-prompted', 'true')
    }
  }, [loading, currentUser])

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-ink/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-futa-400" />
          <span className="font-medium">FUTA Nav</span>
        </div>

        <ul className="hidden items-center gap-6 text-sm text-white/70 sm:flex">
          {links.map((link) => (
            <li key={link.label}>
              <Link to={link.to} className="transition hover:text-white">
                {link.label}
              </Link>
            </li>
          ))}
          {currentUser ? (
            <li className="flex items-center gap-3">
              <span className="text-futa-400">{currentUser.displayName?.split(' ')[0] || currentUser.email}</span>
              <button type="button" onClick={logOut} className="text-white/50 hover:text-white">Sign out</button>
            </li>
          ) : (
            <li>
              <button
                type="button"
                onClick={() => setShowAuth(true)}
                className="rounded-lg bg-futa-400/20 px-3 py-1.5 text-futa-400"
              >
                Sign in
              </button>
            </li>
          )}
        </ul>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="text-white/70 sm:hidden"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-white/10 px-6 py-4 sm:hidden">
          <ul className="flex flex-col gap-4 text-sm text-white/70">
            {links.map((link) => (
              <li key={link.label}>
                <Link to={link.to} onClick={() => setMenuOpen(false)} className="transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
            {currentUser ? (
              <li className="flex items-center justify-between">
                <span className="text-futa-400">{currentUser.displayName?.split(' ')[0] || currentUser.email}</span>
                <button
                  type="button"
                  onClick={() => { logOut(); setMenuOpen(false) }}
                  className="text-white/50 hover:text-white"
                >
                  Sign out
                </button>
              </li>
            ) : (
              <li>
                <button
                  type="button"
                  onClick={() => { setShowAuth(true); setMenuOpen(false) }}
                  className="rounded-lg bg-futa-400/20 px-3 py-1.5 text-futa-400"
                >
                  Sign in
                </button>
              </li>
            )}
          </ul>
        </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </header>
  )
}