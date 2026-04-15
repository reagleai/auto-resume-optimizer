import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

export function ProfileGuard() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-6)',
        fontSize: 'var(--text-sm)',
        lineHeight: 1.5,
        background: 'color-mix(in oklch, var(--color-warning) 8%, var(--color-surface))',
        borderLeft: '3px solid var(--color-warning)',
        color: 'var(--color-warning)',
      }}
    >
      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
      <span>
        Profile incomplete. Please fill your Profile before generating.{' '}
        <button
          onClick={() => navigate('/profile')}
          style={{
            color: 'var(--color-warning)',
            fontWeight: 600,
            textDecoration: 'underline',
            textUnderlineOffset: '2px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 'inherit',
            padding: 0,
          }}
        >
          Go to Profile →
        </button>
      </span>
    </div>
  )
}
