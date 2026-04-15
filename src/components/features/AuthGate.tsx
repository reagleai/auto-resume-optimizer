import { useState, useCallback, createContext, useContext, type ReactNode } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'

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
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [shake, setShake] = useState(false)

  const handleUnlock = useCallback(() => {
    setIsValidating(true)
    setError('')

    // Small delay to feel intentional (like a real auth check)
    setTimeout(() => {
      const correctPassword = import.meta.env.VITE_APP_PASSWORD
      if (password === correctPassword) {
        setIsUnlocked(true)
      } else {
        setError('Incorrect password')
        setShake(true)
        setTimeout(() => setShake(false), 500)
      }
      setIsValidating(false)
    }, 300)
  }, [password])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && password && !isValidating) {
        e.preventDefault()
        handleUnlock()
      }
    },
    [password, isValidating, handleUnlock]
  )

  if (isUnlocked) {
    return (
      <AuthContext.Provider value={{ isUnlocked: true }}>
        {children}
      </AuthContext.Provider>
    )
  }

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
            <Lock size={28} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: 700,
              color: 'var(--color-primary)',
              letterSpacing: '-1px',
              marginBottom: 'var(--space-1)',
            }}
          >
            Resume Tailor
          </h1>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-muted)',
            }}
          >
            Enter the password to access the tool
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
              if (error) setError('')
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter password"
            autoFocus
            disabled={isValidating}
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
          disabled={!password || isValidating}
          style={{
            width: '100%',
            padding: 'var(--space-3) var(--space-6)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
            background: !password || isValidating ? 'var(--color-surface-2)' : 'var(--color-primary)',
            color: !password || isValidating ? 'var(--color-text-muted)' : '#fff',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: !password || isValidating ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            minHeight: '48px',
          }}
          onMouseEnter={(e) => {
            if (password && !isValidating) {
              e.currentTarget.style.opacity = '0.9'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          {isValidating ? 'Verifying…' : 'Unlock'}
        </button>

        {/* Footer hint */}
        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-faint)',
            marginTop: 'var(--space-6)',
          }}
        >
          Session lasts until you close or refresh the tab
        </p>
      </div>

      {/* Shake animation (injected inline so no additional CSS file needed) */}
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
