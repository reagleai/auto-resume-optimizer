import { useState, useCallback } from 'react'
import { Eye, EyeOff, Lock, ShieldAlert } from 'lucide-react'

const SESSION_KEY = 'rt_unlocked'
const MAX_ATTEMPTS = 10
let failedAttempts = 0
let lockoutUntil = 0

function getBackoffMs(): number {
  if (failedAttempts <= 1) return 0
  return Math.min(2 ** (failedAttempts - 1) * 1000, 30_000)
}

interface AccessSectionProps {
  onUnlock: () => void
}

export function AccessSection({ onUnlock }: AccessSectionProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [shake, setShake] = useState(false)
  const [isLockedOut, setIsLockedOut] = useState(false)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleUnlock = useCallback(() => {
    if (failedAttempts >= MAX_ATTEMPTS) {
      setIsLockedOut(true)
      setError('Too many failed attempts. Reload the page to try again.')
      return
    }
    const now = Date.now()
    if (now < lockoutUntil) {
      const remaining = Math.ceil((lockoutUntil - now) / 1000)
      setCooldownRemaining(remaining)
      setError(`Too many attempts. Wait ${remaining}s before trying again.`)
      return
    }
    setIsValidating(true)
    setError('')
    setTimeout(() => {
      const correctPassword = import.meta.env.VITE_APP_PASSWORD
      if (password === correctPassword) {
        sessionStorage.setItem(SESSION_KEY, 'true')
        onUnlock()
        failedAttempts = 0
      } else {
        failedAttempts++
        if (failedAttempts >= MAX_ATTEMPTS) {
          setIsLockedOut(true)
          setError('Too many failed attempts. Reload the page to try again.')
        } else {
          const backoffMs = getBackoffMs()
          if (backoffMs > 0) {
            lockoutUntil = Date.now() + backoffMs
            const secs = Math.ceil(backoffMs / 1000)
            setCooldownRemaining(secs)
            setError(`Incorrect password. Wait ${secs}s before trying again.`)
            const interval = setInterval(() => {
              const rem = Math.ceil((lockoutUntil - Date.now()) / 1000)
              if (rem <= 0) { setCooldownRemaining(0); setError(''); clearInterval(interval) }
              else { setCooldownRemaining(rem); setError(`Incorrect password. Wait ${rem}s before trying again.`) }
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
  }, [password, onUnlock])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && password && !isValidating && !isLockedOut && cooldownRemaining <= 0) {
      e.preventDefault()
      handleUnlock()
    }
  }, [password, isValidating, isLockedOut, cooldownRemaining, handleUnlock])

  const isDisabled = !password || isValidating || isLockedOut || cooldownRemaining > 0

  return (
    <section id="access" className="landing-section" style={{ paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-16)' }}>
      <div style={{ maxWidth: '440px', margin: '0 auto', textAlign: 'center' }}>
        {/* Collapsed state: just a subtle prompt */}
        {!isExpanded ? (
          <button
            onClick={() => setIsExpanded(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)',
              padding: 'var(--space-4) var(--space-6)',
              background: 'var(--color-surface)', border: '1px solid var(--color-divider)',
              borderRadius: 'var(--radius-lg)', cursor: 'pointer',
              transition: 'all 0.3s ease', width: '100%', justifyContent: 'center',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-divider)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <Lock size={16} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-muted)' }}>
              Have access? Enter password to use the tool
            </span>
          </button>
        ) : (
          <div style={{ animation: 'cardIn 0.3s ease both' }}>
            {/* Icon */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: 'var(--radius-lg)', background: 'var(--color-primary-highlight)', marginBottom: 'var(--space-3)' }}>
                {isLockedOut ? <ShieldAlert size={24} style={{ color: 'var(--color-error)' }} /> : <Lock size={24} style={{ color: 'var(--color-primary)' }} />}
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 500, color: isLockedOut ? 'var(--color-error)' : 'var(--color-text)', letterSpacing: '0.5px', wordSpacing: '0.1em', marginBottom: 'var(--space-1)' }}>
                {isLockedOut ? 'Access locked' : 'Access the tool'}
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
                {isLockedOut ? 'Reload the page to try again' : 'Enter the password to open Resumatch'}
              </p>
            </div>

            {/* Input */}
            <div style={{ position: 'relative', marginBottom: 'var(--space-3)', animation: shake ? 'authShake 0.4s ease' : undefined }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error && cooldownRemaining <= 0) setError('') }}
                onKeyDown={handleKeyDown}
                placeholder="Enter password"
                autoFocus
                disabled={isValidating || isLockedOut}
                style={{
                  width: '100%', padding: 'var(--space-3) var(--space-4)', paddingRight: '48px',
                  fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)',
                  background: 'var(--color-surface-offset)', border: `1.5px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-lg)', color: 'var(--color-text)', outline: 'none',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease', boxSizing: 'border-box',
                  opacity: isLockedOut ? 0.5 : 1,
                }}
                onFocus={(e) => { if (!error) { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-primary-highlight)' } }}
                onBlur={(e) => { if (!error) { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none' } }}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-error)', marginBottom: 'var(--space-3)', animation: 'pageIn 0.2s ease' }}>
                {error}
              </div>
            )}

            {/* Unlock button */}
            <button
              onClick={handleUnlock}
              disabled={isDisabled}
              style={{
                width: '100%', padding: 'var(--space-3) var(--space-6)',
                fontSize: 'var(--text-sm)', fontWeight: 500, fontFamily: 'var(--font-body)',
                background: isDisabled ? 'var(--color-surface-2)' : 'var(--color-primary)',
                color: isDisabled ? 'var(--color-text-muted)' : '#fff',
                border: 'none', borderRadius: 'var(--radius-lg)',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease', minHeight: '48px',
              }}
              onMouseEnter={(e) => { if (!isDisabled) e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              {isLockedOut ? 'Locked — Reload Page' : cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s…` : isValidating ? 'Verifying…' : 'Unlock'}
            </button>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginTop: 'var(--space-4)' }}>
              Session lasts until you close the tab
            </p>
          </div>
        )}
      </div>

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
    </section>
  )
}
