import { CheckCircle } from 'lucide-react'

/**
 * Compact profile-status banner shown on the Generator page.
 * Communicates that the profile is ready — no metadata details.
 * Profile editing is available via the sidebar/nav Profile page.
 */
export function ProfileCard() {
  return (
    <div
      className="profile-status-card"
      role="status"
      style={{
        background: 'var(--color-success-highlight)',
        border: '1px solid var(--color-success)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-3) var(--space-4)',
        marginBottom: 'var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        animation: 'cardIn 280ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Decorative success icon — paired with visible text, so aria-hidden */}
      <CheckCircle
        size={20}
        aria-hidden="true"
        style={{
          color: 'var(--color-success)',
          flexShrink: 0,
        }}
      />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 'var(--text-sm)',
            lineHeight: 1.3,
            color: 'var(--color-text)',
          }}
        >
          Profile setup complete
        </div>
        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            marginTop: '2px',
          }}
        >
          Ready to generate resume
        </div>
      </div>
    </div>
  )
}
