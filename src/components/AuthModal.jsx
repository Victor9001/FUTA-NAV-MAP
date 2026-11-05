import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// The long text loads only when someone opens it, so the app starts as fast as before.
const TermsText = lazy(() => import('./TermsText'))

const inputClass =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white placeholder:text-white/40 outline-none focus:border-futa-400'

export default function AuthModal({ onClose }) {
  const { signUp, signIn } = useAuth()
  const [mode, setMode] = useState('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const firstFieldRef = useRef(null)

  useEffect(() => {
    firstFieldRef.current?.focus()
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (mode === 'signup' && !agreed) {
      setError('Please tick the box to agree to the Terms and Privacy Notice.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'signup') {
        await signUp(name, email, password)
      } else {
        await signIn(email, password)
      }
      onClose()
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''))
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className={
          'w-full rounded-xl border border-white/10 bg-ink p-6 ' +
          (showTerms ? 'max-w-lg' : 'max-w-sm')
        }
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="auth-modal-title" className="text-lg font-medium">
          {showTerms
            ? 'Terms and Privacy Notice'
            : mode === 'signup'
              ? 'Create an account'
              : 'Sign in'}
        </h2>

        {showTerms ? (
          <div className="mt-4">
            <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-4">
              <Suspense fallback={<p className="text-xs text-white/50">Loading...</p>}>
                <TermsText />
              </Suspense>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowTerms(false)}
                className="flex items-center gap-1 text-sm text-white/60 hover:text-white"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setAgreed(true)
                  setShowTerms(false)
                }}
                className="rounded-lg bg-futa-400 px-4 py-2 text-sm font-medium text-ink"
              >
                I agree
              </button>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              {mode === 'signup' && (
                <input
                  type="text"
                  placeholder="Name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={inputClass}
                />
              )}
              <input
                ref={firstFieldRef}
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className={inputClass + ' pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-white/60 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {mode === 'signup' && (
                <label className="flex items-start gap-2 text-xs leading-relaxed text-white/60">
                  <input
                    type="checkbox"
                    required
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-futa-400"
                  />
                  <span>
                    I am 18 or older (or have a parent or guardian's permission) and I agree to the{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        setShowTerms(true)
                      }}
                      className="text-futa-400 underline"
                    >
                      Terms and Privacy Notice
                    </button>
                    .
                  </span>
                </label>
              )}

              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-futa-400 py-2 text-sm font-medium text-ink disabled:opacity-60"
              >
                {busy ? 'Please wait...' : mode === 'signup' ? 'Sign up' : 'Sign in'}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
              className="mt-3 text-xs text-white/50 hover:text-white"
            >
              {mode === 'signup'
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}