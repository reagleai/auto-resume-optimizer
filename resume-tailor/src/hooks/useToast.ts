import { useCallback } from 'react'
import { useAppStore } from '@/store/appStore'
import type { ToastItem } from '@/types'

/**
 * Convenience wrapper for toast notifications
 */
export function useToast() {
  const addToast = useAppStore((s) => s.addToast)

  const toast = useCallback(
    (message: string, type: ToastItem['type'] = 'info', duration?: number) => {
      addToast(message, type, duration)
    },
    [addToast]
  )

  return { toast }
}
