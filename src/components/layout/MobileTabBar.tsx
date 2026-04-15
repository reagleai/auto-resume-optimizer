import { useLocation, useNavigate } from 'react-router-dom'
import { Wand2, User, Clock } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

const tabs = [
  { path: '/generator', label: 'Generator', Icon: Wand2 },
  { path: '/profile',   label: 'Profile',   Icon: User },
  { path: '/history',   label: 'History',   Icon: Clock, showBadge: true },
]

export function MobileTabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const historyCount = useAppStore((s) => s.history.length)

  return (
    <nav
      className="mobile-tabbar"
      aria-label="Mobile navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        height: 'var(--mobile-tabbar-height)',
        display: 'none',
        alignItems: 'stretch',
        justifyContent: 'space-around',
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-divider)',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}
    >
      {tabs.map(({ path, label, Icon, showBadge }) => {
        const isActive = location.pathname === path
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            aria-label={label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-1)',
              flex: 1,
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontSize: '10px',
              fontWeight: isActive ? 600 : 500,
              minHeight: '44px',
              minWidth: '44px',
              transition: 'color var(--transition-interactive)',
              position: 'relative',
            }}
          >
            <Icon size={22} />
            <span>{label}</span>
            {showBadge && historyCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: 'calc(50% - 20px)',
                  background: 'var(--color-primary-highlight)',
                  color: 'var(--color-primary)',
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '0 5px',
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
  )
}
