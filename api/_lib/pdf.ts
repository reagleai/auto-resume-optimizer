// ============================================================================
// PDF provider abstraction (replaces the n8n pdflayer node).
//
// The pipeline depends only on `PdfProvider`, so the rendering service can
// change without touching pipeline code. Today: PDFShift (https://pdfshift.io),
// an easily-available HTML→PDF REST API. Swap by adding a class + env switch.
// ============================================================================

export interface PdfProvider {
  readonly name: string;
  /** Render a full HTML document to a PDF buffer (A4, zero margins). */
  render(html: string): Promise<Buffer>;
}

// ── PDFShift implementation ─────────────────────────────────────────────────

class PdfShiftProvider implements PdfProvider {
  readonly name = 'pdfshift';
  private readonly apiKey: string;
  private readonly endpoint = 'https://api.pdfshift.io/v3/convert/pdf';

  constructor() {
    const apiKey = process.env.PDFSHIFT_API_KEY;
    if (!apiKey) throw new Error('PDFSHIFT_API_KEY is not set.');
    this.apiKey = apiKey;
  }

  async render(html: string): Promise<Buffer> {
    // PDFShift uses HTTP Basic auth: username "api", password = API key.
    const auth = Buffer.from(`api:${this.apiKey}`).toString('base64');

    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: html,
        format: 'A4',
        margin: '0',
        landscape: false,
        // Honour the print stylesheet we inject in preparePdf.
        use_print: true,
        sandbox: process.env.PDFSHIFT_SANDBOX === 'true',
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`PDFShift ${res.status}: ${text.slice(0, 500)}`);
    }

    const buf = Buffer.from(await res.arrayBuffer());

    // Validate it's actually a PDF (magic bytes) — guards against an error
    // body being treated as a document (audit F-09).
    if (buf.subarray(0, 5).toString('latin1') !== '%PDF-') {
      throw new Error('PDF provider did not return a valid PDF (missing %PDF header).');
    }
    return buf;
  }
}

// ── Provider selection ──────────────────────────────────────────────────────

let cached: PdfProvider | null = null;

export function getPdf(): PdfProvider {
  if (cached) return cached;
  const provider = (process.env.PDF_PROVIDER || 'pdfshift').toLowerCase();
  switch (provider) {
    case 'pdfshift':
    default:
      cached = new PdfShiftProvider();
      return cached;
  }
}

export async function renderPdf(html: string): Promise<Buffer> {
  return getPdf().render(html);
}
