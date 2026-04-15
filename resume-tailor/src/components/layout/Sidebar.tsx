import { useLocation, useNavigate } from 'react-router-dom'
import { Wand2, User, Clock } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

const navItems = [
  { path: '/generator', label: 'Generator', Icon: Wand2 },
  { path: '/profile',   label: 'Profile',   Icon: User },
  { path: '/history',   label: 'History',   Icon: Clock, showBadge: true },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const historyCount = useAppStore((s) => s.history.length)

  return (
    <aside
      role="complementary"
      className="sidebar-desktop"
      style={{
        width: 'var(--sidebar-width)',
        minWidth: 'var(--sidebar-width)',
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-divider)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        flexShrink: 0,
      }}
    >
      <nav aria-label="Main navigation" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 'var(--space-3) 0' }}>
        {navItems.map(({ path, label, Icon, showBadge }) => {
          const isActive = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              aria-label={label}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                margin: 'var(--space-1) var(--space-2)',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.938rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                background: isActive ? 'var(--color-primary-highlight)' : 'transparent',
                width: 'calc(100% - var(--space-4))',
                textAlign: 'left' as const,
                minHeight: '44px',
                transition: 'all 0.2s ease',
                position: 'relative' as const,
                borderLeft: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {showBadge && historyCount > 0 && (
                <span
                  style={{
                    marginLeft: 'auto',
                    background: 'var(--color-primary-highlight)',
                    color: 'var(--color-primary)',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 7px',
                    borderRadius: 'var(--radius-full)',
                    lineHeight: 1.5,
                  }}
                >
                  {historyCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div style={{
        padding: 'var(--space-4)',
        borderTop: '1px solid var(--color-divider)',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'var(--color-text-muted)',
          fontWeight: 400,
          letterSpacing: '1.5px',
          textTransform: 'uppercase' as const,
        }}>
          v1.0
        </span>
      </div>
    </aside>
  )
}
