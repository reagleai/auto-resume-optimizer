import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import {
  FileText, Clock, AlertTriangle, Search, Wand2,
  Brain, PenLine, CheckCircle, Zap, type LucideIcon
} from 'lucide-react'

interface EmptyStateProps {
  icon: string
  heading: string
  body: string
  action?: { label: string; onClick: () => void }
  bordered?: boolean
}

const iconMap: Record<string, LucideIcon> = {
  'file-text': FileText,
  'clock': Clock,
  'alert-triangle': AlertTriangle,
  'search': Search,
  'wand-2': Wand2,
  'brain': Brain,
  'pen-line': PenLine,
  'check-circle': CheckCircle,
  'zap': Zap,
}

export function EmptyState({ icon, heading, body, action, bordered }: EmptyStateProps): ReactNode {
  const IconComponent = iconMap[icon] || FileText

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--space-16) var(--space-8)',
        border: bordered ? '1.5px dashed var(--color-border)' : 'none',
        borderRadius: bordered ? 'var(--radius-xl)' : undefined,
        maxWidth: '400px',
        margin: '0 auto',
      }}
    >
      <IconComponent size={48} style={{ color: 'var(--color-primary)', opacity: 0.4, marginBottom: 'var(--space-4)' }} />
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
        {heading}
      </h3>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: action ? 'var(--space-4)' : undefined }}>
        {body}
      </p>
      {action && (
        <Button variant="secondary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
