// ============================================================================
// POST /api/import-resume
// Validates the extracted resume text, creates an import job, kicks off the
// background driver via waitUntil(), and returns the job id immediately. The
// frontend polls GET /api/import-jobs/:id for the current stage + final result.
// ============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { waitUntil } from '@vercel/functions';
import { createImportJob, driveImportJob } from './_lib/resumeImport/jobs.js';

export const config = { maxDuration: 300 };

const MAX_TEXT_LENGTH = 50_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};
    const text = typeof body.text === 'string' ? body.text : '';
    if (!text.trim()) {
      return res.status(400).json({ error: 'Missing required field: text' });
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ error: 'Extracted resume text is too long.' });
    }
    const pages = typeof body.pages === 'number' && Number.isFinite(body.pages) ? body.pages : 1;

    const jobId = await createImportJob(text, pages);

    // Drive it in the background; a stalled job is re-driven by the poller.
    waitUntil(driveImportJob(jobId));

    return res.status(202).json({ jobId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to start resume import.';
    return res.status(400).json({ error: message });
  }
}
