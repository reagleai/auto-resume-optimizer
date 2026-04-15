import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { extractDomain } from '@/lib/utils'

export function ProfileCard() {
  const profile = useAppStore((s) => s.profile)
  const navigate = useNavigate()

  if (!profile.firstName) return null

  const initials = (profile.firstName[0] || '') + (profile.lastName[0] || '')
  const resumeLen = profile.baseResumeHtml.length

  return (
    <div
      style={{
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-3) var(--space-4)',
        marginBottom: 'var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        animation: 'pageIn 280ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-primary-highlight)',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '10px',
          flexShrink: 0,
          textTransform: 'uppercase' as const,
        }}
      >
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', lineHeight: 1.2 }}>
          {profile.firstName} {profile.lastName}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', marginTop: '2px' }}>
          ✓ Profile ready
        </div>
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', textAlign: 'right' as const }}>
        <div>{profile.webhookUrl ? extractDomain(profile.webhookUrl) : 'No webhook'}</div>
        {resumeLen > 0 && <div>{resumeLen.toLocaleString()} chars</div>}
      </div>
      <button
        onClick={() => navigate('/profile')}
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-primary)',
          fontWeight: 500,
          padding: 'var(--space-2) var(--space-3)',
          borderRadius: 'var(--radius-md)',
          minHeight: '36px',
          transition: 'background var(--transition-interactive)',
        }}
      >
        Edit
      </button>
    </div>
  )
}
