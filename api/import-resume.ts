import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractPdfText } from './_lib/resumeImport/extractPdfText.js';
import { importResumeFromText, RESUME_IMPORT_REVIEW_PASSES } from './_lib/resumeImport/pipeline.js';

export const config = {
  api: { bodyParser: false },
  maxDuration: 300,
};

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

async function readBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > MAX_UPLOAD_BYTES) {
      throw new Error('Resume PDF is too large. Maximum size is 4 MB.');
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!String(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/pdf')) {
    return res.status(415).json({ error: 'Please upload a PDF file.' });
  }

  try {
    const pdf = await readBody(req);
    const extracted = await extractPdfText(pdf);
    const imported = await importResumeFromText(extracted.text);
    return res.status(200).json({
      firstName: imported.firstName,
      lastName: imported.lastName,
      baseResumeHtml: imported.baseResumeHtml,
      report: {
        pages: extracted.pages,
        extractedCharacters: extracted.text.length,
        reviewPasses: RESUME_IMPORT_REVIEW_PASSES,
        audits: imported.audits,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Resume import failed.';
    return res.status(400).json({ error: message });
  }
}
