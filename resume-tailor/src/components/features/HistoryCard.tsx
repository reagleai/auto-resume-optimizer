import { Download, Eye } from 'lucide-react'
import type { HistoryEntry } from '@/types'
import { timeAgo, downloadHtml } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

interface HistoryCardProps {
  entry: HistoryEntry
  index: number
  totalCount: number
  onPreview: (entry: HistoryEntry) => void
}

export function HistoryCard({ entry, index, totalCount, onPreview }: HistoryCardProps) {
  const { toast } = useToast()
  const isPdf = entry.format === 'pdf'

  const handleDownload = () => {
    if (isPdf && entry.pdfBlobUrl) {
      const a = document.createElement('a')
      a.href = entry.pdfBlobUrl
      a.download = entry.filename || 'tailored-resume.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast('Resume PDF downloaded ✓', 'success')
    } else {
      downloadHtml(entry.html, entry.filename)
      toast('Resume downloaded ✓', 'success')
    }
  }

  return (
    <div
      className="history-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-divider)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        boxShadow: 'var(--shadow-sm)',
        animation: `cardIn 280ms cubic-bezier(0.16, 1, 0.3, 1) both`,
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Run number */}
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-primary-highlight)',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--text-xs)',
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        #{totalCount - index}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            whiteSpace: 'nowrap' as const,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {entry.roletitle} · {entry.companyname}
        </div>
        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-faint)',
            marginTop: '2px',
            whiteSpace: 'nowrap' as const,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {timeAgo(entry.timestamp)} · {entry.filename}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', flexShrink: 0 }}>
        <button
          onClick={handleDownload}
          aria-label="Download resume"
          title="Download HTML"
          className="history-action-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-muted)',
            transition: 'background var(--transition-interactive), color var(--transition-interactive)',
          }}
        >
          <Download size={18} />
        </button>
        <button
          onClick={() => onPreview(entry)}
          aria-label="Preview resume"
          title="Preview"
          className="history-action-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-muted)',
            transition: 'background var(--transition-interactive), color var(--transition-interactive)',
          }}
        >
          <Eye size={18} />
        </button>
      </div>
    </div>
  )
}
