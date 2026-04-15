import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { GeneratorPage } from '@/pages/GeneratorPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { HistoryPage } from '@/pages/HistoryPage'
import { useTheme } from '@/hooks/useTheme'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

function AppContent() {
  useTheme()
  useKeyboardShortcuts()

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/generator" replace />} />
        <Route path="/generator" element={<GeneratorPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="*" element={<Navigate to="/generator" replace />} />
      </Routes>
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
