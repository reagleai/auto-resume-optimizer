import { useState } from 'react'
import { Eye, FileText } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { RESUME_TEMPLATES } from '@/lib/resumeTemplates'

/**
 * Generator-page gallery of resume templates. Each card has an eye icon that
 * opens a sandboxed preview of the template's structure. The "Classic" (base)
 * template is the one generation uses and shows its per-point one-page limits.
 */
export function TemplateGallery() {
  const [previewId, setPreviewId] = useState<string | null>(null)
  const active = RESUME_TEMPLATES.find((t) => t.id === previewId) ?? null

  return (
    <div className="template-gallery">
      <div className="template-gallery-head">
        <FileText size={14} aria-hidden="true" />
        <span>Resume Templates</span>
      </div>

      <div className="template-grid">
        {RESUME_TEMPLATES.map((t) => (
          <div key={t.id} className={`template-card${t.status === 'active' ? ' is-active' : ''}`}>
            <div className="template-card-top">
              <span className="template-card-name">{t.name}</span>
              <span className={`template-badge ${t.status}`}>
                {t.status === 'active' ? 'In use' : 'Preview'}
              </span>
            </div>
            <p className="template-card-desc">{t.description}</p>

            {t.budgets && (
              <div className="template-card-budgets" title="Maximum characters that keep the resume on one page">
                One-page limits: <strong>{t.budgets.maxBulletChars}</strong> chars/bullet ·
                summary <strong>{t.budgets.summaryChars}</strong> · skills line{' '}
                <strong>{t.budgets.maxSkillLineChars}</strong>
              </div>
            )}

            <button
              type="button"
              className="template-preview-btn"
              onClick={() => setPreviewId(t.id)}
              aria-label={`Preview the ${t.name} template`}
            >
              <Eye size={14} /> Preview
            </button>
          </div>
        ))}
      </div>

      <Modal open={!!active} onClose={() => setPreviewId(null)} title={active ? `${active.name} template` : ''}>
        {active && (
          <iframe
            title={`${active.name} template preview`}
            srcDoc={active.previewHtml}
            sandbox=""
            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
          />
        )}
      </Modal>
    </div>
  )
}
