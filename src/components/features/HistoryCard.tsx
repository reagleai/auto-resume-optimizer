import { useState } from 'react'
import { Eye, Trash2, Download, Loader2 } from 'lucide-react'
import type { SavedResumeWithPdf } from '@/types'
import { timeAgo } from '@/lib/utils'

interface HistoryCardProps {
  resume: SavedResumeWithPdf
  index: number
  isDeleting: boolean
  onView: () => void
  onDelete: () => void
}

export function HistoryCard({ resume, index, isDeleting, onView, onDelete }: HistoryCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const pdf = resume.resume_pdfs?.[0] ?? null
  const isPdf = resume.format === 'pdf'
  const createdAt = new Date(resume.created_at)

  // Truncate JD for preview
  const jdSnippet = resume.job_description
    ? resume.job_description.substring(0, 80) + (resume.job_description.length > 80 ? '…' : '')
    : null

  const handleDeleteClick = () => {
    if (confirmDelete || isDeleting) return
    setConfirmDelete(true)
  }

  const handleConfirm = () => {
    setConfirmDelete(false)
    onDelete()
  }

  const handleCancel = () => {
    setConfirmDelete(false)
  }

  return (
    <div
      className="history-card"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-4)',
        background: isDeleting ? 'var(--color-surface-2)' : 'var(--color-surface)',
        border: '1px solid var(--color-divider)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        boxShadow: 'var(--shadow-sm)',
        animation: `cardIn 280ms cubic-bezier(0.16, 1, 0.3, 1) both`,
        animationDelay: `${index * 60}ms`,
        opacity: isDeleting ? 0.5 : 1,
        transition: 'opacity 0.2s ease, background 0.2s ease',
        position: 'relative' as const,
      }}
    >
      {/* Format badge */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-full)',
          background: isPdf ? 'var(--color-error-highlight)' : 'var(--color-primary-highlight)',
          color: isPdf ? 'var(--color-error)' : 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.6rem',
          fontWeight: 800,
          fontFamily: 'var(--font-mono)',
          flexShrink: 0,
          letterSpacing: '-0.5px',
          marginTop: '2px',
        }}
      >
        {isPdf ? 'PDF' : 'HTML'}
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
          {resume.role_title} · {resume.company_name}
        </div>
        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-faint)',
            marginTop: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            flexWrap: 'wrap' as const,
          }}
        >
          <span>{timeAgo(createdAt)}</span>
          {pdf && (
            <span
              style={{
                background: 'var(--color-success-highlight)',
                color: 'var(--color-success)',
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.6rem',
                fontWeight: 600,
              }}
            >
              PDF saved
            </span>
          )}
        </div>
        {jdSnippet && (
          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              marginTop: '4px',
              whiteSpace: 'nowrap' as const,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {jdSnippet}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', flexShrink: 0, alignItems: 'center' }}>
        {confirmDelete ? (
          /* ── Inline delete confirmation ─────────────────── */
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              animation: 'pageIn 0.2s ease',
            }}
          >
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
                whiteSpace: 'nowrap' as const,
              }}
            >
              Delete?
            </span>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-error)',
                color: '#fff',
                border: 'none',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                minHeight: '28px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'opacity 0.2s',
              }}
            >
              {isDeleting ? (
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                'Yes'
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isDeleting}
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'transparent',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
                minHeight: '28px',
              }}
            >
              No
            </button>
          </div>
        ) : (
          /* ── Action buttons ─────────────────────────────── */
          <>
            <button
              onClick={onView}
              aria-label="View resume"
              title="View"
              className="history-action-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-muted)',
                transition:
                  'background var(--transition-interactive), color var(--transition-interactive)',
              }}
            >
              <Eye size={16} />
            </button>

            {pdf && (
              <button
                onClick={async () => {
                  if (isDownloading) return
                  setIsDownloading(true)
                  try {
                    const res = await fetch(pdf.public_url)
                    const blob = await res.blob()
                    const blobUrl = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = blobUrl
                    a.download = resume.filename || 'tailored-resume.pdf'
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(blobUrl)
                  } catch {
                    // Fallback: open in new tab if fetch fails
                    window.open(pdf.public_url, '_blank')
                  } finally {
                    setIsDownloading(false)
                  }
                }}
                disabled={isDownloading}
                aria-label="Download PDF"
                title="Download PDF"
                className="history-action-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-muted)',
                  transition:
                    'background var(--transition-interactive), color var(--transition-interactive)',
                  cursor: isDownloading ? 'wait' : 'pointer',
                  opacity: isDownloading ? 0.5 : 1,
                }}
              >
                {isDownloading ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Download size={16} />
                )}
              </button>
            )}

            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              aria-label="Delete resume"
              title="Delete"
              className="history-action-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                color: isDeleting ? 'var(--color-text-faint)' : 'var(--color-error)',
                transition:
                  'background var(--transition-interactive), color var(--transition-interactive)',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
              }}
            >
              {isDeleting ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
