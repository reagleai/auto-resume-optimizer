import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { GeneratorPage } from '@/pages/GeneratorPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { HistoryPage } from '@/pages/HistoryPage'
import { useTheme } from '@/hooks/useTheme'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useProfileQuery } from '@/hooks/useProfile'
import { useAppStore } from '@/store/appStore'

function AppContent() {
  useTheme()
  useKeyboardShortcuts()

  // Fetch profile from Supabase on app load and sync to Zustand store
  // so all pages (including Generator) see the profile data immediately.
  const { data: remoteProfile, isFetched } = useProfileQuery()
  const setProfile = useAppStore((s) => s.setProfile)
  const setProfileLoading = useAppStore((s) => s.setProfileLoading)

  useEffect(() => {
    if (isFetched) {
      if (remoteProfile) {
        setProfile(remoteProfile)
      }
      setProfileLoading(false)
    }
  }, [remoteProfile, isFetched, setProfile, setProfileLoading])

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/generator" replace />} />
        <Route path="/generator" element={<GeneratorPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="*" element={<Navigate to="/generator" replace />} />
      </Routes>
      <footer style={{ textAlign: 'center', padding: '2rem', fontSize: '0.875rem', color: 'var(--text-muted, #666)' }}>
        Built by Ajay Sharma · <a href="https://www.linkedin.com/in/workwithajay/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>LinkedIn</a>
      </footer>
    </AppShell>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
