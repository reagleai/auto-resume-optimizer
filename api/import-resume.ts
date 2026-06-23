import type { VercelRequest, VercelResponse } from '@vercel/node';
import { importResumeFromText, RESUME_IMPORT_REVIEW_PASSES } from './_lib/resumeImport/pipeline.js';

export const config = {
  maxDuration: 300,
};

const MAX_TEXT_LENGTH = 50_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, pages } = req.body ?? {};
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Missing required field: text' });
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ error: 'Extracted resume text is too long.' });
    }
    const pageCount = typeof pages === 'number' && Number.isFinite(pages) ? pages : 1;

    const imported = await importResumeFromText(text);
    return res.status(200).json({
      firstName: imported.firstName,
      lastName: imported.lastName,
      baseResumeHtml: imported.baseResumeHtml,
      report: {
        pages: pageCount,
        extractedCharacters: text.length,
        reviewPasses: RESUME_IMPORT_REVIEW_PASSES,
        audits: imported.audits,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Resume import failed.';
    return res.status(400).json({ error: message });
  }
}
