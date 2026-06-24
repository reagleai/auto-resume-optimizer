// ============================================================================
// Import-job driver.
//
// Resume import runs as an async job so the UI can poll for the current stage
// (extract → audit 1 → audit 2 → render) and show smooth progress without
// relying on a streamed response.
//
// It shares the existing `resumatch_jobs` table (no schema change): import jobs
// are tagged input.kind === 'import' so the generate state machine ignores them
// (see advanceJob in ../jobs.ts), and they are polled via /api/import-jobs/:id
// rather than the generate poller. Unlike generation, import is NOT resumable —
// it runs to completion inside a single waitUntil() invocation, so the poller
// never re-drives it.
// ============================================================================

import { getAdminClient } from '../supabaseAdmin.js';
import { importResumeFromText, RESUME_IMPORT_REVIEW_PASSES } from './pipeline.js';
import type { ResumeImportProgress } from './types.js';

const TABLE = 'resumatch_jobs';

export type ImportJobStage = 'extract' | 'audit_1' | 'audit_2' | 'render' | 'done';

const STEP: Record<ImportJobStage, number> = {
  extract: 1,
  audit_1: 2,
  audit_2: 3,
  render: 4,
  done: 4,
};

function stageFromProgress(p: ResumeImportProgress): ImportJobStage {
  if (p.stage === 'extract') return 'extract';
  if (p.stage === 'render') return 'render';
  return p.pass === 2 ? 'audit_2' : 'audit_1';
}

async function patch(id: string, fields: Record<string, unknown>): Promise<void> {
  const supa = getAdminClient();
  await supa.from(TABLE).update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id);
}

export async function createImportJob(text: string, pages: number): Promise<string> {
  const supa = getAdminClient();
  // The source text lives on the row so a stalled job can be re-driven by the
  // poller without the original request's in-memory state.
  const { data, error } = await supa
    .from(TABLE)
    .insert({
      status: 'queued',
      step: 1,
      stage: 'extract',
      input: { kind: 'import', pages, text },
    })
    .select('id')
    .single();
  if (error) throw new Error(`[import-jobs] create failed: ${error.message}`);
  return data.id as string;
}

/**
 * Run the import to completion, checkpointing the current stage on the job row
 * after each stage so pollers see live progress. Reads its source text from the
 * row, so it is safe to (re-)invoke from either the create endpoint or the
 * poller. Always terminal on return. A re-drive restarts the import from the
 * beginning (import has no mid-call checkpoint), which is fine on a fast model.
 */
export async function driveImportJob(id: string): Promise<void> {
  const job = await getImportJob(id);
  if (!job) return;
  if (job.status === 'complete' || job.status === 'error') return;

  const input = (job.input ?? {}) as { pages?: number; text?: string };
  const text = typeof input.text === 'string' ? input.text : '';
  const pages = typeof input.pages === 'number' ? input.pages : 1;
  if (!text.trim()) {
    await patch(id, { status: 'error', error: 'Import job is missing its source text.' });
    return;
  }

  try {
    await patch(id, { status: 'processing', step: 1, stage: 'extract' });

    const imported = await importResumeFromText(text, {
      onProgress: async (p) => {
        const stage = stageFromProgress(p);
        await patch(id, { status: 'processing', step: STEP[stage], stage });
      },
    });

    await patch(id, {
      status: 'complete',
      step: 4,
      stage: 'done',
      result: {
        firstName: imported.firstName,
        lastName: imported.lastName,
        baseResumeHtml: imported.baseResumeHtml,
        report: {
          pages,
          extractedCharacters: text.length,
          reviewPasses: RESUME_IMPORT_REVIEW_PASSES,
          audits: imported.audits,
        },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await patch(id, { status: 'error', error: message.slice(0, 1000) });
  }
}

export interface ImportJobView {
  id: string;
  status: 'queued' | 'processing' | 'complete' | 'error';
  step: number;
  stage: string;
  input: unknown;
  result: unknown;
  error: string | null;
  updatedAt: string;
}

export async function getImportJob(id: string): Promise<ImportJobView | null> {
  const supa = getAdminClient();
  const { data, error } = await supa.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`[import-jobs] fetch failed: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id,
    status: data.status,
    step: data.step,
    stage: data.stage,
    input: data.input,
    result: data.result,
    error: data.error,
    updatedAt: data.updated_at,
  };
}
