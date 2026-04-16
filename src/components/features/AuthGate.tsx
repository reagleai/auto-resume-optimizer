import { useState, useCallback, createContext, useContext, type ReactNode } from 'react'
import { Eye, EyeOff, Lock, ShieldAlert } from 'lucide-react'

/**
 * ══════════════════════════════════════════════════════════════════
 * AuthGate — Client-side password lock for the application
 * ══════════════════════════════════════════════════════════════════
 *
 * SECURITY MODEL & KNOWN LIMITATIONS:
 *
 * 1. BUNDLE EXPOSURE (CRITICAL — accepted risk):
 *    VITE_APP_PASSWORD is compiled into the client JS bundle at build time.
 *    Anyone can extract it from DevTools → Sources or by running:
 *      strings index.[hash].js | grep -i password
 *    This gate is a deterrent, NOT a security boundary. It blocks casual
 *    access but does NOT protect against a motivated attacker.
 *
 *    RECOMMENDED FUTURE FIX: Move password validation to a Vercel Edge
 *    Function or Supabase Edge Function that returns a signed JWT.
 *    The frontend should never see the password — only a token.
 *
 * 2. DEVTOOLS BYPASS (inherent limitation):
 *    Since auth state lives in React state + sessionStorage, a user with
 *    DevTools access could set sessionStorage.setItem('rt_unlocked', 'true')
 *    and reload the page to bypass the gate. This is inherent to all
 *    client-side-only auth. No code fix exists — only server-side auth
 *    would solve this.
 *
 * 3. SESSION PERSISTENCE:
 *    sessionStorage is used intentionally here. It persists across reloads
 *    within the same tab but clears on tab/browser close. This is the
 *    correct behaviour for this use case:
 *    - Page reload (F5) → stays unlocked ✓
 *    - Navigate within app → stays unlocked ✓
 *    - Close tab → must re-enter password ✓
 *    - New tab → must re-enter password ✓
 *    - Close browser → must re-enter password ✓
 *
 * 4. BRUTE FORCE PROTECTION:
 *    Exponential backoff (2^n seconds) + hard lockout after 10 attempts.
 *    Attempt count is stored in a module-level variable (survives re-renders
 *    but resets on page reload — intentional).
 * ══════════════════════════════════════════════════════════════════
 */

// ── Module-level brute force tracking (survives re-renders, resets on reload) ──
const SESSION_KEY = 'rt_unlocked'
const MAX_ATTEMPTS = 10
let failedAttempts = 0
let lockoutUntil = 0

/** Calculate backoff delay: 0, 2s, 4s, 8s, 16s… */
function getBackoffMs(): number {
  if (failedAttempts <= 1) return 0
  return Math.min(2 ** (failedAttempts - 1) * 1000, 30_000) // Cap at 30s
}

// ── Dev-mode console warning about bundle exposure ──
if (import.meta.env.DEV) {
  console.warn(
    '[AuthGate] ⚠️ SECURITY WARNING: VITE_APP_PASSWORD is compiled into the client ' +
    'bundle and can be extracted by anyone with DevTools access. This password gate ' +
    'is a deterrent only. For real security, move validation to a server-side edge ' +
    'function. See comments in AuthGate.tsx for the full threat model.'
  )
}

interface AuthContextValue {
  isUnlocked: boolean
}

const AuthContext = createContext<AuthContextValue>({ isUnlocked: false })

export function useAuth() {
  return useContext(AuthContext)
}

interface AuthGateProps {
  children: ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  // Check sessionStorage on initial render — no flash of password screen
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem(SESSION_KEY) === 'true'
  })

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [shake, setShake] = useState(false)
  const [isLockedOut, setIsLockedOut] = useState(false)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  const handleUnlock = useCallback(() => {
    // Check hard lockout
    if (failedAttempts >= MAX_ATTEMPTS) {
      setIsLockedOut(true)
      setError(`Too many failed attempts. Reload the page to try again.`)
      return
    }

    // Check backoff cooldown
    const now = Date.now()
    if (now < lockoutUntil) {
      const remaining = Math.ceil((lockoutUntil - now) / 1000)
      setCooldownRemaining(remaining)
      setError(`Too many attempts. Wait ${remaining}s before trying again.`)
      return
    }

    setIsValidating(true)
    setError('')

    // Small delay to feel intentional
    setTimeout(() => {
      const correctPassword = import.meta.env.VITE_APP_PASSWORD
      if (password === correctPassword) {
        // Success — persist to sessionStorage
        sessionStorage.setItem(SESSION_KEY, 'true')
        setIsUnlocked(true)
        failedAttempts = 0 // Reset on success
      } else {
        failedAttempts++

        if (failedAttempts >= MAX_ATTEMPTS) {
          setIsLockedOut(true)
          setError('Too many failed attempts. Reload the page to try again.')
        } else {
          // Apply exponential backoff
          const backoffMs = getBackoffMs()
          if (backoffMs > 0) {
            lockoutUntil = Date.now() + backoffMs
            const secs = Math.ceil(backoffMs / 1000)
            setCooldownRemaining(secs)
            setError(`Incorrect password. Wait ${secs}s before trying again.`)

            // Countdown timer
            const interval = setInterval(() => {
              const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000)
              if (remaining <= 0) {
                setCooldownRemaining(0)
                setError('')
                clearInterval(interval)
              } else {
                setCooldownRemaining(remaining)
                setError(`Incorrect password. Wait ${remaining}s before trying again.`)
              }
            }, 1000)
          } else {
            setError('Incorrect password')
          }

          setShake(true)
          setTimeout(() => setShake(false), 500)
        }
      }
      setIsValidating(false)
    }, 300)
  }, [password])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && password && !isValidating && !isLockedOut && cooldownRemaining <= 0) {
        e.preventDefault()
        handleUnlock()
      }
    },
    [password, isValidating, isLockedOut, cooldownRemaining, handleUnlock]
  )

  if (isUnlocked) {
    return (
      <AuthContext.Provider value={{ isUnlocked: true }}>
        {children}
      </AuthContext.Provider>
    )
  }

  const isDisabled = !password || isValidating || isLockedOut || cooldownRemaining > 0

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-body)',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: 'var(--space-8)',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-primary-highlight)',
              marginBottom: 'var(--space-4)',
            }}
          >
            {isLockedOut ? (
              <ShieldAlert size={28} style={{ color: 'var(--color-error)' }} />
            ) : (
              <Lock size={28} style={{ color: 'var(--color-primary)' }} />
            )}
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: 700,
              color: isLockedOut ? 'var(--color-error)' : 'var(--color-primary)',
              letterSpacing: '-1px',
              marginBottom: 'var(--space-1)',
            }}
          >
            Resumatch
          </h1>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-muted)',
            }}
          >
            {isLockedOut ? 'Access locked' : 'Enter the password to access the tool'}
          </p>
        </div>

        {/* Password input */}
        <div
          style={{
            position: 'relative',
            marginBottom: 'var(--space-3)',
            animation: shake ? 'authShake 0.4s ease' : undefined,
          }}
        >
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error && cooldownRemaining <= 0) setError('')
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter password"
            autoFocus
            disabled={isValidating || isLockedOut}
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-4)',
              paddingRight: '48px',
              fontSize: 'var(--text-base)',
              fontFamily: 'var(--font-body)',
              background: 'var(--color-surface)',
              border: `1.5px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-lg)',
              color: 'var(--color-text)',
              outline: 'none',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              boxSizing: 'border-box',
              opacity: isLockedOut ? 0.5 : 1,
            }}
            onFocus={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = 'var(--color-primary)'
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-primary-highlight)'
              }
            }}
            onBlur={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = 'var(--color-border)'
                e.currentTarget.style.boxShadow = 'none'
              }
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
            }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-error)',
              marginBottom: 'var(--space-3)',
              animation: 'pageIn 0.2s ease',
            }}
          >
            {error}
          </div>
        )}

        {/* Unlock button */}
        <button
          onClick={handleUnlock}
          disabled={isDisabled}
          style={{
            width: '100%',
            padding: 'var(--space-3) var(--space-6)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
            background: isDisabled ? 'var(--color-surface-2)' : 'var(--color-primary)',
            color: isDisabled ? 'var(--color-text-muted)' : '#fff',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            minHeight: '48px',
          }}
          onMouseEnter={(e) => {
            if (!isDisabled) {
              e.currentTarget.style.opacity = '0.9'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          {isLockedOut
            ? 'Locked — Reload Page'
            : cooldownRemaining > 0
              ? `Wait ${cooldownRemaining}s…`
              : isValidating
                ? 'Verifying…'
                : 'Unlock'}
        </button>

        {/* Footer hint */}
        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-faint)',
            marginTop: 'var(--space-6)',
          }}
        >
          Session lasts until you close the tab
        </p>
      </div>

      {/* Shake animation */}
      <style>{`
        @keyframes authShake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(6px); }
          45% { transform: translateX(-4px); }
          60% { transform: translateX(2px); }
          75% { transform: translateX(-1px); }
        }
      `}</style>
    </div>
  )
}
