import { Sun, Moon } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { ShortcutsPopover } from '@/components/features/ShortcutsPopover'

export function TopBar() {
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)

  return (
    <header
      role="banner"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 'var(--topbar-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-6)',
        background: 'var(--nav-scrolled-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-divider)',
        flexShrink: 0,
      }}
    >
      {/* Logo — Portfolio's nav-logo pattern: bordered box with initials */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            border: '2px solid var(--color-primary)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-heading)',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
            letterSpacing: '-1px',
          }}
        >
          RM
        </span>
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '1.5rem',
            color: 'var(--color-primary)',
            letterSpacing: '-1px',
            lineHeight: 1,
          }}
        >
          Resumatch
        </span>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <ShortcutsPopover />

        {/* Theme toggle — Portfolio circular button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle light/dark mode"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--color-primary-highlight)',
            border: '1px solid var(--color-divider)',
            color: 'var(--color-primary)',
            transition: 'all 0.3s ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-primary)'
            e.currentTarget.style.color = 'var(--color-bg)'
            e.currentTarget.style.borderColor = 'var(--color-primary)'
            e.currentTarget.style.transform = 'rotate(30deg)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-primary-highlight)'
            e.currentTarget.style.color = 'var(--color-primary)'
            e.currentTarget.style.borderColor = 'var(--color-divider)'
            e.currentTarget.style.transform = 'rotate(0deg)'
          }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
}
