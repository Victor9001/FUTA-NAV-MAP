import { useEffect, useState } from 'react'
import { Compass } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'

const links = [
  { label: 'Home', href: '#home' },
  { label: 'Map', href: '#map' },
  { label: 'About', href: '#about' },
]

export default function Navbar() {
  const { currentUser, loading, logOut } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

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
        <ul className="flex items-center gap-6 text-sm text-white/70">
          {links.map((link) => (
            <li key={link.label}>
              <a href={link.href} className="transition hover:text-white">
                {link.label}
              </a>
            </li>
          ))}
          {currentUser ? (
            <li className="flex items-center gap-3">
              <span className="text-futa-400">{currentUser.displayName || currentUser.email}</span>
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
      </nav>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </header>
  )
}