import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'

export function Modal({ open, onClose, title, children }: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  // Element focused before the dialog opened, so we can restore it on close.
  const previouslyFocused = useRef<HTMLElement | null>(null)

  // Focus management + key handling. Runs only while open.
  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement as HTMLElement | null
    // Move focus into the dialog (the close button is always present).
    closeRef.current?.focus()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      // Trap focus within the dialog panel.
      const panel = panelRef.current
      if (!panel) return
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement)
      if (focusables.length === 0) {
        e.preventDefault()
        closeRef.current?.focus()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      // Restore focus to the trigger when the dialog closes/unmounts.
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        animation: 'fadeIn 200ms ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          width: '100%',
          maxWidth: '800px',
          height: '90vh',
          background: 'var(--color-bg)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 280ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-4) var(--space-6)',
            borderBottom: '1px solid var(--color-divider)',
            flexShrink: 0,
          }}
        >
          <h2
            id={titleId}
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
              lineHeight: 1.4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              flexShrink: 0,
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-muted)',
              transition: 'background var(--transition-interactive), color var(--transition-interactive)',
            }}
          >
            <X size={20} />
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
