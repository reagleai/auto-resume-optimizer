import { useState, useCallback } from 'react'
import DOMPurify from 'dompurify'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { useToast } from '@/hooks/useToast'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { HistoryCard } from '@/components/features/HistoryCard'
import type { HistoryEntry } from '@/types'

export function HistoryPage() {
  const history = useAppStore((s) => s.history)
  const clearHistory = useAppStore((s) => s.clearHistory)
  const setPreviewHtml = useAppStore((s) => s.setPreviewHtml)
  const setGeneratorResult = useAppStore((s) => s.setGeneratorResult)
  const navigate = useNavigate()
  const { toast } = useToast()

  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalEntry, setModalEntry] = useState<HistoryEntry | null>(null)

  const handleClear = useCallback(() => {
    clearHistory()
    setShowClearConfirm(false)
    toast('History cleared.', 'info')
  }, [clearHistory, toast])

  const handlePreview = useCallback((entry: HistoryEntry) => {
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      setModalEntry(entry)
      setModalOpen(true)
    } else {
      // Load into generator preview and navigate
      setGeneratorResult({
        html: entry.html,
        filename: entry.filename,
        companyname: entry.companyname,
        roletitle: entry.roletitle,
        timestamp: entry.timestamp,
        format: entry.format || 'html',
        pdfBlobUrl: entry.pdfBlobUrl,
      })
      setPreviewHtml(null) // Use generator result directly
      navigate('/generator')
    }
  }, [setGeneratorResult, setPreviewHtml, navigate])

  return (
    <div style={{
      maxWidth: '720px',
      margin: '0 auto',
      padding: 'var(--space-8) var(--space-8)',
      animation: 'pageIn 0.6s ease',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-6)',
        gap: 'var(--space-4)',
        flexWrap: 'wrap' as const,
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-xl)',
            fontWeight: 600,
            lineHeight: 1.15,
            marginBottom: 'var(--space-1)',
          }}>
            Run History
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            Past generation runs this session. Clears on page refresh.
          </p>
        </div>
        <Badge>{history.length} {history.length === 1 ? 'run' : 'runs'}</Badge>
      </div>

      {history.length === 0 ? (
        <EmptyState
          icon="clock"
          heading="No runs yet"
          body="Your generation history will appear here after your first run."
          action={{ label: 'Go to Generator →', onClick: () => navigate('/generator') }}
        />
      ) : (
        <>
          {/* Toolbar */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: 'var(--space-4)',
            position: 'relative' as const,
          }}>
            <button
              onClick={() => setShowClearConfirm(true)}
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: 'var(--color-error)',
                padding: 'var(--space-2) var(--space-3)',
                minHeight: '44px',
                borderRadius: 'var(--radius-full)',
                transition: 'all 0.3s ease',
              }}
            >
              Clear History
            </button>

            {/* Inline confirm */}
            {showClearConfirm && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)',
                padding: 'var(--space-4)',
                minWidth: '260px',
                zIndex: 50,
                animation: 'pageIn 0.3s ease',
              }}>
                <p style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
                  Clear all {history.length} run{history.length !== 1 ? 's' : ''}? This cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    style={{
                      padding: 'var(--space-2) var(--space-4)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-full)',
                      background: 'transparent',
                      color: 'var(--color-text-muted)',
                      minHeight: '36px',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClear}
                    style={{
                      padding: 'var(--space-2) var(--space-4)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      border: '1px solid var(--color-error)',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-error)',
                      color: '#fff',
                      minHeight: '36px',
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* History list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {history.map((entry, idx) => (
              <HistoryCard
                key={entry.id}
                entry={entry}
                index={idx}
                totalCount={history.length}
                onPreview={handlePreview}
              />
            ))}
          </div>
        </>
      )}

      {/* Mobile preview modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setModalEntry(null) }}
        title={modalEntry?.filename || 'Preview'}
      >
        {modalEntry && (
          modalEntry.format === 'pdf' && modalEntry.pdfBlobUrl ? (
            <object
              data={modalEntry.pdfBlobUrl}
              type="application/pdf"
              style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
            >
              <p style={{ padding: '2rem', textAlign: 'center' as const }}>PDF preview not supported in this view. Close and download instead.</p>
            </object>
          ) : (
            <iframe
              srcDoc={DOMPurify.sanitize(modalEntry.html, { WHOLE_DOCUMENT: true })}
              title="Resume preview"
              sandbox=""
              style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
            />
          )
        )}
      </Modal>
    </div>
  )
}
