// ============================================================================
// Resume-import orchestrator (client side).
//
// Owns the full user-visible flow and reports each real stage as it happens:
//   reading (browser pdf.js)  →  extract / audit-1 / audit-2 / render (server)
//
// The server runs the import as a job; we poll its status and map the job's
// current stage to a UI stage id (mirrors how the generate flow polls jobs).
// ============================================================================

import { extractTextFromPDF } from '@/lib/pdfExtractor'
import type { ResumeImportResponse, ResumeImportStageId } from '@/types'

export interface ResumeImportStage {
  id: ResumeImportStageId
  label: string
  /** Hint shown under the active stage. */
  hint: string
}

/** Ordered stages shown in the UI stepper. */
export const RESUME_IMPORT_STAGES: ResumeImportStage[] = [
  { id: 'reading', label: 'Reading your PDF', hint: 'Extracting text in your browser' },
  { id: 'extract', label: 'Extracting details', hint: 'Pulling roles, projects, skills & contact info' },
  { id: 'audit-1', label: 'Accuracy check 1 of 2', hint: 'Comparing against your original resume' },
  { id: 'audit-2', label: 'Accuracy check 2 of 2', hint: 'Fixing any missed or altered facts' },
  { id: 'render', label: 'Formatting into template', hint: 'Placing everything into base_resume.html' },
]

export function stageIndex(id: ResumeImportStageId): number {
  return RESUME_IMPORT_STAGES.findIndex((s) => s.id === id)
}

/** Map a job-row stage string to the UI stage id. */
function stageIdFromJob(stage: string): ResumeImportStageId | null {
  switch (stage) {
    case 'extract': return 'extract'
    case 'audit_1': return 'audit-1'
    case 'audit_2': return 'audit-2'
    case 'render':
    case 'done': return 'render'
    default: return null
  }
}

const POLL_INTERVAL_MS = 1500
const MAX_POLL_MS = 240_000 // 4 minutes
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface ImportJobStatus {
  status: 'queued' | 'processing' | 'complete' | 'error'
  stage: string
  result: ResumeImportResponse | null
  error: string | null
}

/**
 * Run the import for one PDF file, reporting each stage via onStage.
 * Resolves with the final {firstName, lastName, baseResumeHtml, report}.
 */
export async function runResumeImport(
  file: File,
  onStage: (id: ResumeImportStageId) => void,
): Promise<ResumeImportResponse> {
  // ── Stage 1: browser extraction ─────────────────────────────────────────
  onStage('reading')
  const extracted = await extractTextFromPDF(file)

  // ── Kick off the server job ──────────────────────────────────────────────
  const res = await fetch('/api/import-resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: extracted.text, pages: extracted.pages }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error || `Import failed with HTTP ${res.status}`)
  }
  const { jobId } = (await res.json()) as { jobId?: string }
  if (!jobId) throw new Error('No import job id returned by the server.')

  onStage('extract') // the server begins extracting immediately

  // ── Stages 2-5: poll the job until it's terminal ─────────────────────────
  const start = Date.now()
  for (;;) {
    await sleep(POLL_INTERVAL_MS)
    if (Date.now() - start > MAX_POLL_MS) throw new Error('Resume import timed out.')

    const jres = await fetch(`/api/import-jobs/${jobId}`)
    if (!jres.ok) continue // transient — keep polling
    const job = (await jres.json()) as ImportJobStatus

    const stageId = stageIdFromJob(job.stage)
    if (stageId) onStage(stageId)

    if (job.status === 'complete' && job.result) return job.result
    if (job.status === 'error') throw new Error(job.error || 'Resume import failed.')
  }
}
