import { useState, useRef, useEffect } from 'react'
import { KEYBOARD_SHORTCUTS } from '@/lib/constants'

export function ShortcutsPopover() {
  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [open])

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text-faint)',
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          transition: 'background var(--transition-interactive), color var(--transition-interactive)',
        }}
      >
        ⌘?
      </button>

      {open && (
        <div
          ref={popoverRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            width: '300px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 8px 32px oklch(0.2 0.01 80 / 0.15)',
            padding: 'var(--space-4)',
            zIndex: 150,
            animation: 'pageIn 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
            Keyboard Shortcuts
          </h3>
          {KEYBOARD_SHORTCUTS.map(({ keys, label }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-1) 0',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
              }}
            >
              <span>{label}</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {keys.map((key) => (
                  <span
                    key={key}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2px 6px',
                      background: 'var(--color-surface-offset)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      lineHeight: 1.4,
                    }}
                  >
                    {key}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
