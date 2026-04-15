import { Download, Printer, RotateCcw, FileText } from 'lucide-react'
import type { GeneratorResult, GeneratorStatus } from '@/types'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingView } from '@/components/features/LoadingView'
import { downloadHtml, formatTimestamp } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

interface ResumePreviewProps {
  result: GeneratorResult | null
  status: GeneratorStatus
  loadingStep: number
  error: string | null
  onRetry: () => void
  onClear: () => void
}

export function ResumePreview({ result, status, loadingStep, error, onRetry, onClear }: ResumePreviewProps) {
  const { toast } = useToast()

  if (status === 'loading') {
    return <LoadingView currentStep={loadingStep} />
  }

  if (status === 'error') {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState
          icon="alert-triangle"
          heading="Generation failed"
          body={error || 'An unexpected error occurred.'}
          action={{ label: 'Try Again', onClick: onRetry }}
        />
      </div>
    )
  }

  if (status === 'success' && result) {
    const isPdf = result.format === 'pdf'

    const handleDownload = () => {
      if (isPdf && result.pdfBlobUrl) {
        // Download PDF via blob URL
        const a = document.createElement('a')
        a.href = result.pdfBlobUrl
        a.download = result.filename || 'tailored-resume.pdf'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        toast('Resume PDF downloaded ✓', 'success')
      } else {
        downloadHtml(result.html, result.filename)
        toast('Resume downloaded ✓', 'success')
      }
    }

    const handlePrint = () => {
      if (isPdf) {
        // For PDF, open in new tab for printing
        if (result.pdfBlobUrl) {
          window.open(result.pdfBlobUrl, '_blank')
        }
        toast('PDF opened in new tab. Use Ctrl+P to print.', 'info')
      } else {
        const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement | null
        if (iframe?.contentWindow) {
          iframe.contentWindow.focus()
          iframe.contentWindow.print()
        }
        toast('Use your browser\u2019s Save as PDF option.', 'info')
      }
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-4)',
            flexWrap: 'wrap' as const,
          }}
        >
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {isPdf && <FileText size={14} style={{ color: 'var(--color-primary)' }} />}
            Tailored for {result.roletitle} at {result.companyname}
            {isPdf && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', background: 'var(--color-primary-highlight)', padding: '1px 8px', borderRadius: 'var(--radius-full)', fontWeight: 500 }}>PDF</span>}
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button onClick={handleDownload} className="preview-action-btn">
              <Download size={14} /> Download {isPdf ? 'PDF' : 'HTML'}
            </button>
            <button onClick={handlePrint} className="preview-action-btn">
              <Printer size={14} /> {isPdf ? 'Open in Tab' : 'Print PDF'}
            </button>
            <button onClick={onClear} className="preview-action-btn">
              <RotateCcw size={14} /> Clear
            </button>
          </div>
        </div>

        {/* Preview area */}
        {isPdf && result.pdfBlobUrl ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 220px)',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-divider)',
            boxShadow: 'var(--shadow-md)',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-5)',
              padding: 'var(--space-10)',
              textAlign: 'center' as const,
              maxWidth: '360px',
            }}>
              {/* PDF icon */}
              <div style={{
                width: '72px', height: '72px',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--color-primary-highlight)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileText size={36} style={{ color: 'var(--color-primary)' }} />
              </div>

              <div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
                  Your resume is ready
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  {result.filename}
                </div>
              </div>

              {/* Primary download button */}
              <a
                href={result.pdfBlobUrl}
                download={result.filename || 'tailored-resume.pdf'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-3) var(--space-7)',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: 600,
                  fontSize: 'var(--text-sm)',
                  textDecoration: 'none',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <Download size={16} />
                Download PDF
              </a>

              {/* Secondary: open in tab */}
              <a
                href={result.pdfBlobUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                }}
              >
                Open in browser tab
              </a>
            </div>
          </div>
        ) : (
          <iframe
            id="preview-iframe"
            srcDoc={result.html}
            title="Tailored Resume Preview"
            sandbox="allow-same-origin"
            style={{
              flex: 1,
              width: '100%',
              minHeight: 'calc(100vh - 220px)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: '#fff',
              boxShadow: 'var(--shadow-md)',
            }}
          />
        )}

        <div style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-faint)',
          marginTop: 'var(--space-3)',
          textAlign: 'center' as const,
        }}>
          Generated {formatTimestamp(result.timestamp)} · {result.companyname} · {result.roletitle}
        </div>
      </div>
    )
  }

  // Idle
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <EmptyState
        icon="file-text"
        heading="Your tailored resume will appear here"
        body="Fill in the job description and click Generate to begin."
        bordered
      />
    </div>
  )
}

