import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/appStore'

const STORAGE_KEY = 'rt-theme'

/**
 * Initialize theme — Portfolio pattern:
 * 1. Check localStorage for saved preference
 * 2. Fall back to system preference
 * 3. Default to dark (Portfolio default)
 * 4. Listen for system changes if no saved preference
 */
export function useTheme() {
  const setTheme = useAppStore((s) => s.setTheme)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Check for saved preference (Portfolio pattern: persist in localStorage)
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved)
    } else {
      // Respect system preference, default dark
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }

    // Listen for system changes only if no saved preference
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [setTheme])
}
