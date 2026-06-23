// ============================================================================
// POST /api/generate
// Validates the payload, creates a job, kicks off background processing via
// waitUntil(), and returns the job id immediately. The frontend polls
// GET /api/jobs/:id for progress + the final PDF.
// ============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { waitUntil } from '@vercel/functions';
import { createJob, driveJob } from './_lib/jobs.js';

export const config = { maxDuration: 300 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};
    const jobId = await createJob(body);

    // Process in the background; the response returns right away.
    waitUntil(driveJob(jobId));

    return res.status(202).json({ jobId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to start generation.';
    return res.status(400).json({ error: message });
  }
}
