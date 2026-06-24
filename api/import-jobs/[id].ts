// ============================================================================
// GET /api/import-jobs/:id
// Returns an import job's current stage + final result for polling. If a job is
// non-terminal but its last update is stale (the background driver hit a
// function timeout / was killed), this re-drives it from the start — the source
// text is stored on the row, so the import can resume on a fresh invocation
// instead of being orphaned at the "extract" stage.
// ============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { waitUntil } from '@vercel/functions';
import { getImportJob, driveImportJob } from '../_lib/resumeImport/jobs.js';

export const config = { maxDuration: 300 };

// A healthy driver patches the row at every stage (seconds apart on a fast
// model), so this only fires when the background task has actually died.
const STALE_MS = 30_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!id) return res.status(400).json({ error: 'Missing job id' });

  try {
    const job = await getImportJob(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const isTerminal = job.status === 'complete' || job.status === 'error';
    const ageMs = Date.now() - new Date(job.updatedAt).getTime();
    if (!isTerminal && ageMs > STALE_MS) {
      // Stalled (or never started) — resume in the background.
      waitUntil(driveImportJob(id));
    }

    return res.status(200).json({
      jobId: job.id,
      status: job.status,
      step: job.step,
      stage: job.stage,
      result: job.result ?? null,
      error: job.error ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to read import job.';
    return res.status(500).json({ error: message });
  }
}
