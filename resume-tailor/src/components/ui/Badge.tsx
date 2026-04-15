import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type BadgeVariant = 'default' | 'success' | 'error' | 'warning'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantColors: Record<BadgeVariant, { bg: string; color: string }> = {
  default: { bg: 'var(--color-primary-highlight)', color: 'var(--color-primary)' },
  success: { bg: 'var(--color-success-highlight)', color: 'var(--color-success)' },
  error: { bg: 'var(--color-error-highlight)', color: 'var(--color-error)' },
  warning: { bg: 'var(--color-warning-highlight)', color: 'var(--color-warning)' },
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const colors = variantColors[variant]
  return (
    <span
      className={cn('badge', className)}
      style={{
        background: colors.bg,
        color: colors.color,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.813rem',
        fontWeight: 600,
        padding: '6px 12px',
        borderRadius: 'var(--radius-full)',
        border: `1px solid ${colors.bg}`,
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        lineHeight: 1.5,
      }}
    >
      {children}
    </span>
  )
}
