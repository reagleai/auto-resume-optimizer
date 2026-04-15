import type { ReactNode } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileTabBar } from '@/components/layout/MobileTabBar'
import { ToastContainer } from '@/components/ui/Toast'
import { useAppStore } from '@/store/appStore'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const theme = useAppStore((s) => s.theme)

  return (
    <div
      data-theme={theme}
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
      }}
    >
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only"
        style={{ position: 'absolute', zIndex: 9999 }}
        onFocus={(e) => { e.currentTarget.style.position = 'static' }}
        onBlur={(e) => { e.currentTarget.style.position = 'absolute' }}
      >
        Skip to content
      </a>

      <TopBar />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar />
        <main
          id="main-content"
          style={{
            flex: 1,
            overflowY: 'auto',
            background: 'var(--color-bg)',
          }}
        >
          {children}
        </main>
      </div>

      <MobileTabBar />
      <ToastContainer />
    </div>
  )
}
