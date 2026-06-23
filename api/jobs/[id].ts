// ============================================================================
// GET /api/jobs/:id
// Returns the job's status/step/result for polling. If the job is non-terminal
// but its last update is stale (the background driver likely hit a function
// timeout), this re-kicks driveJob() so progress resumes from the last
// checkpoint — making the pipeline timeout-resilient on any Vercel plan.
// ============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { waitUntil } from '@vercel/functions';
import { getJob, driveJob } from '../_lib/jobs.js';

export const config = { maxDuration: 300 };

const STALE_MS = 20_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!id) return res.status(400).json({ error: 'Missing job id' });

  try {
    const job = await getJob(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const isTerminal = job.status === 'complete' || job.status === 'error';
    const ageMs = Date.now() - new Date(job.updatedAt).getTime();
    if (!isTerminal && (job.status === 'queued' || ageMs > STALE_MS)) {
      // Resume a stalled/never-started job in the background.
      waitUntil(driveJob(id));
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
    const message = err instanceof Error ? err.message : 'Failed to read job.';
    return res.status(500).json({ error: message });
  }
}
