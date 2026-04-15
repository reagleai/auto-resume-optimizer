import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Info } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import type { ToastItem } from '@/types'

function ToastItemComponent({ item }: { item: ToastItem }) {
  const removeToast = useAppStore((s) => s.removeToast)
  const [dismissing, setDismissing] = useState(false)

  useEffect(() => {
    const duration = item.duration ?? 4000
    const timer = setTimeout(() => {
      setDismissing(true)
      setTimeout(() => removeToast(item.id), 220)
    }, duration)
    return () => clearTimeout(timer)
  }, [item.id, item.duration, removeToast])

  const iconMap = {
    success: <CheckCircle size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />,
    error: <XCircle size={18} style={{ color: 'var(--color-error)', flexShrink: 0 }} />,
    info: <Info size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />,
  }

  const accentColorMap = {
    success: 'var(--color-success)',
    error: 'var(--color-error)',
    info: 'var(--color-primary)',
  }

  return (
    <div
      className={`toast-item ${dismissing ? 'toast-dismissing' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-full)',
        boxShadow: 'var(--shadow-md)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text)',
        pointerEvents: 'auto',
        animation: dismissing ? 'toast-out 220ms ease-in forwards' : 'toast-in 280ms cubic-bezier(0.16, 1, 0.3, 1)',
        maxWidth: '380px',
      }}
    >
      <div style={{
        width: '4px',
        height: '24px',
        borderRadius: 'var(--radius-full)',
        flexShrink: 0,
        background: accentColorMap[item.type],
      }} />
      {iconMap[item.type]}
      <span style={{ flex: 1, lineHeight: 1.4 }}>{item.message}</span>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts)

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 'var(--space-6)',
        right: 'var(--space-6)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: 'var(--space-2)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <ToastItemComponent key={t.id} item={t} />
      ))}
    </div>
  )
}
