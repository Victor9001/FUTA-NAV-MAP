import { useEffect, useState } from 'react'
import {
  Compass,
  Map as MapIcon,
  List,
  PlusCircle,
  LogIn,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'

const links = [
  { label: 'Map', to: '/#map', icon: MapIcon, isActive: (p) => p === '/' },
  { label: 'Directory', to: '/directory', icon: List, isActive: (p) => p.startsWith('/directory') },
  { label: 'Suggest', to: '/suggest', icon: PlusCircle, isActive: (p) => p.startsWith('/suggest') },
]

const ADMIN_UID = import.meta.env.VITE_ADMIN_UID
const adminLink = {
  label: 'Admin',
  to: '/admin',
  icon: ShieldCheck,
  isActive: (p) => p.startsWith('/admin'),
}
export default function Navbar() {
  const { currentUser, loading, logOut } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const { pathname } = useLocation()
  const isAdmin = Boolean(ADMIN_UID) && currentUser?.uid === ADMIN_UID
  const navLinks = isAdmin ? [...links, adminLink] : links

  const firstName =
    currentUser?.displayName?.split(' ')[0] || currentUser?.email

  useEffect(() => {
    if (loading || currentUser) return
    const alreadyPrompted = localStorage.getItem('futa-nav-auth-prompted')
    if (!alreadyPrompted) {
      setShowAuth(true)
      localStorage.setItem('futa-nav-auth-prompted', 'true')
    }
  }, [loading, currentUser])

  return (
    <>
      {/* Top bar: logo on every screen, full links on larger screens */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-ink/90 backdrop-blur">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-futa-400" />
            <span className="font-medium">FUTA Nav</span>
          </div>

          {/* Phones: just show who is signed in. Navigation is at the bottom. */}
          {currentUser && (
            <span className="max-w-[10rem] truncate text-xs text-futa-400 sm:hidden">
              {firstName}
            </span>
          )}

          {/* Larger screens: the same links as before */}
          <ul className="hidden items-center gap-6 text-sm text-white/70 sm:flex">
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
            {currentUser ? (
              <li className="flex items-center gap-3">
                <span className="text-futa-400">{firstName}</span>
                <button type="button" onClick={logOut} className="text-white/50 hover:text-white">
                  Sign out
                </button>
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
      </header>

      {/* Phones only: bottom icon navigation.
          It sits OUTSIDE the header on purpose. The header uses backdrop-blur,
          which would stop a fixed element inside it from sticking to the bottom. */}
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-ink/95 backdrop-blur sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="mx-auto grid max-w-md" style={{ gridTemplateColumns: 'repeat(' + (navLinks.length + 1) + ', minmax(0, 1fr))' }}>
          {navLinks.map(({ label, to, icon: Icon, isActive }) => {
            const active = isActive(pathname)

            return (
              <li key={label}>
                <Link
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] transition ${
                    active ? 'text-futa-400' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              </li>
            )
          })}

          <li>
            {currentUser ? (
              <button
                type="button"
                onClick={logOut}
                className="flex w-full flex-col items-center gap-1 py-2.5 text-[11px] text-white/60 transition hover:text-white"
              >
                <LogOut className="h-5 w-5" />
                Sign out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuth(true)}
                className="flex w-full flex-col items-center gap-1 py-2.5 text-[11px] text-futa-400 transition"
              >
                <LogIn className="h-5 w-5" />
                Sign in
              </button>
            )}
          </li>
        </ul>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
