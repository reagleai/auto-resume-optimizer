import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
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
          <span style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {title}
          </span>
          <button
            onClick={onClose}
            aria-label="Close preview"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-muted)',
              transition: 'background var(--transition-interactive)',
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
