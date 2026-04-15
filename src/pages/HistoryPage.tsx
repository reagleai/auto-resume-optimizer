import { useState } from 'react'
import DOMPurify from 'dompurify'
import { useNavigate } from 'react-router-dom'
import { Download } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useResumeHistoryQuery, useDeleteResumeMutation } from '@/hooks/useResumeHistory'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { HistoryCard } from '@/components/features/HistoryCard'
import type { SavedResumeWithPdf } from '@/types'

export function HistoryPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: resumes, isLoading, isError, refetch } = useResumeHistoryQuery()
  const deleteMutation = useDeleteResumeMutation()

  const [viewingResume, setViewingResume] = useState<SavedResumeWithPdf | null>(null)

  // ── Delete handler ──────────────────────────────────────────────
  const handleDelete = (resume: SavedResumeWithPdf) => {
    const pdf = resume.resume_pdfs?.[0] ?? null
    deleteMutation.mutate(
      { id: resume.id, pdfFilePath: pdf?.file_path },
      {
        onSuccess: () => {
          toast('Resume deleted.', 'info')
        },
        onError: (err) => {
          toast(err instanceof Error ? err.message : 'Failed to delete resume.', 'error')
        },
      }
    )
  }

  const count = resumes?.length ?? 0

  return (
    <div
      style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: 'var(--space-8) var(--space-8)',
        animation: 'pageIn 0.6s ease',
      }}
    >
      {/* ── Header ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-6)',
          gap: 'var(--space-4)',
          flexWrap: 'wrap' as const,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-xl)',
              fontWeight: 600,
              lineHeight: 1.15,
              marginBottom: 'var(--space-1)',
            }}
          >
            Resume History
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            Previously generated resumes, persisted across sessions.
          </p>
        </div>
        {!isLoading && !isError && count > 0 && (
          <Badge>
            {count} {count === 1 ? 'resume' : 'resumes'}
          </Badge>
        )}
      </div>

      {/* ── Loading skeletons ─────────────────────────────────── */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-divider)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                animation: `cardIn 280ms cubic-bezier(0.16, 1, 0.3, 1) both`,
                animationDelay: `${i * 80}ms`,
              }}
            >
              <Skeleton variant="avatar" width="36px" height="36px" />
              <div style={{ flex: 1 }}>
                <Skeleton variant="heading" width="60%" />
                <div style={{ height: '6px' }} />
                <Skeleton variant="text" width="40%" />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                <Skeleton variant="custom" width="36px" height="36px" />
                <Skeleton variant="custom" width="36px" height="36px" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Error state ───────────────────────────────────────── */}
      {isError && (
        <EmptyState
          icon="alert-triangle"
          heading="Couldn't load history"
          body="Something went wrong fetching your resume history. Please try again."
          action={{
            label: 'Retry',
            onClick: () => {
              refetch()
            },
          }}
        />
      )}

      {/* ── Empty state ───────────────────────────────────────── */}
      {!isLoading && !isError && count === 0 && (
        <EmptyState
          icon="clock"
          heading="No resumes yet"
          body="Generated resumes will be automatically saved here. Head to the Generator to create your first tailored resume."
          action={{
            label: 'Go to Generator →',
            onClick: () => navigate('/generator'),
          }}
        />
      )}

      {/* ── Resume list ───────────────────────────────────────── */}
      {!isLoading && !isError && resumes && resumes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {resumes.map((resume, idx) => (
            <HistoryCard
              key={resume.id}
              resume={resume}
              index={idx}
              isDeleting={
                deleteMutation.isPending &&
                deleteMutation.variables?.id === resume.id
              }
              onView={() => setViewingResume(resume)}
              onDelete={() => handleDelete(resume)}
            />
          ))}
        </div>
      )}

      {/* ── View Resume Modal ─────────────────────────────────── */}
      <Modal
        open={!!viewingResume}
        onClose={() => setViewingResume(null)}
        title={
          viewingResume
            ? `${viewingResume.role_title} · ${viewingResume.company_name}`
            : 'Resume'
        }
      >
        {viewingResume && (
          viewingResume.resume_html ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Download bar — only when a PDF is available */}
              {viewingResume.resume_pdfs?.[0] && (
                <div
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    borderBottom: '1px solid var(--color-divider)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <a
                    href={viewingResume.resume_pdfs[0].public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      color: 'var(--color-primary)',
                      textDecoration: 'none',
                      padding: 'var(--space-1) var(--space-3)',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--color-primary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'background 0.2s',
                    }}
                  >
                    <Download size={12} />
                    Download PDF
                  </a>
                </div>
              )}

              {/* Resume HTML preview */}
              <iframe
                srcDoc={DOMPurify.sanitize(viewingResume.resume_html, { WHOLE_DOCUMENT: true })}
                title="Resume preview"
                sandbox=""
                style={{
                  flex: 1,
                  width: '100%',
                  border: 'none',
                  background: '#fff',
                }}
              />
            </div>
          ) : (
            /* ── No HTML available (PDF-only edge case) ─────── */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                padding: 'var(--space-8)',
                textAlign: 'center' as const,
                gap: 'var(--space-4)',
              }}
            >
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                HTML preview is unavailable for this resume.
              </p>
              {viewingResume.resume_pdfs?.[0] ? (
                <a
                  href={viewingResume.resume_pdfs[0].public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    color: '#fff',
                    background: 'var(--color-primary)',
                    textDecoration: 'none',
                    padding: 'var(--space-2) var(--space-5)',
                    borderRadius: 'var(--radius-full)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'opacity 0.2s',
                  }}
                >
                  <Download size={14} />
                  Download PDF Instead
                </a>
              ) : (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
                  No downloadable file available for this resume.
                </p>
              )}
            </div>
          )
        )}
      </Modal>
    </div>
  )
}
