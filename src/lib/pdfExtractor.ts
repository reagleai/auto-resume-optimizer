/**
 * Client-side PDF text extraction using pdf.js.
 * Runs entirely in the browser where DOMMatrix, canvas, etc. are natively available.
 * The worker file is served from /pdf.worker.min.mjs (copied from pdfjs-dist).
 */
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const MAX_PDF_PAGES = 10;
const MIN_TEXT_LENGTH = 80;
const MAX_TEXT_LENGTH = 50_000;

interface PositionedText {
  text: string;
  x: number;
  y: number;
}

function pageText(items: Array<Record<string, unknown>>): string {
  const positioned: PositionedText[] = [];
  for (const item of items) {
    if (typeof item.str !== 'string' || !item.str.trim()) continue;
    const transform = Array.isArray(item.transform) ? item.transform : [];
    positioned.push({
      text: item.str.trim(),
      x: Number(transform[4]) || 0,
      y: Number(transform[5]) || 0,
    });
  }

  positioned.sort((a, b) => {
    if (Math.abs(a.y - b.y) > 3) return b.y - a.y;
    return a.x - b.x;
  });

  const lines: PositionedText[][] = [];
  for (const item of positioned) {
    const line = lines.find((candidate) => Math.abs(candidate[0].y - item.y) <= 3);
    if (line) line.push(item);
    else lines.push([item]);
  }

  return lines
    .map((line) => line.sort((a, b) => a.x - b.x).map((item) => item.text).join(' '))
    .join('\n');
}

export async function extractTextFromPDF(file: File): Promise<{ text: string; pages: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  try {
    if (pdf.numPages > MAX_PDF_PAGES) {
      throw new Error(`Resume PDFs are limited to ${MAX_PDF_PAGES} pages.`);
    }

    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(pageText(content.items as Array<Record<string, unknown>>));
    }

    const text = pages.join('\n\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    if (text.length < MIN_TEXT_LENGTH) {
      throw new Error('No readable text was found. Please upload a text-based PDF rather than a scanned image.');
    }
    if (text.length > MAX_TEXT_LENGTH) {
      throw new Error('The extracted resume is too long to process safely.');
    }
    return { text, pages: pdf.numPages };
  } finally {
    await pdf.destroy();
  }
}
