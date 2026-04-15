import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Global keyboard shortcuts for navigation.
 * Cmd/Ctrl+G → Generator, Cmd/Ctrl+P → Profile, Cmd/Ctrl+H → History
 * Escape → close any open modal/popover
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey

      if (e.key === 'Escape') {
        // Close any confirm dialogs (handled by components individually)
        return
      }

      if (!mod) return

      const key = e.key.toLowerCase()
      if (key === 'g') {
        e.preventDefault()
        navigate('/generator')
      } else if (key === 'p') {
        e.preventDefault()
        navigate('/profile')
      } else if (key === 'h') {
        e.preventDefault()
        navigate('/history')
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [navigate])
}
