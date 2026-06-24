// ============================================================================
// GET /api/import-jobs/:id
// Returns an import job's current stage + final result for polling. Unlike the
// generate poller, this NEVER re-drives the job: resume import is not resumable
// (it runs to completion inside one waitUntil invocation), so re-driving would
// double-run the LLM passes.
// ============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getImportJob } from '../_lib/resumeImport/jobs.js';

export const config = { maxDuration: 60 };

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
