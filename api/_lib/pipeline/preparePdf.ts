// ============================================================================
// Stage 9 — PDF request preparation.
// Port of the n8n "Prepare PDF Request" node. Strips height/overflow caps from
// the .page rule, picks a content-fit profile from text length + bullet count,
// and injects an A4 print stylesheet so the resume fills exactly one page.
// ============================================================================

import type { AssembledResume, PreparedPdf } from './types.js';

function toPdfFilename(inputName: string | undefined): string {
  const fallback = 'resume.pdf';
  if (!inputName || typeof inputName !== 'string') return fallback;
  let name = inputName.trim();
  name = name.replace(/\.html?$/i, '.pdf');
  if (!/\.pdf$/i.test(name)) name = `${name}.pdf`;
  name = name.replace(/[\\/:*?"<>|]+/g, '_');
  name = name.replace(/\s+_\s+/g, ' _ ');
  name = name.replace(/_{2,}/g, '_').trim();
  return name || fallback;
}

export function preparePdf(assembled: AssembledResume): PreparedPdf {
  const pdfFilename = toPdfFilename(assembled.filename);
  let html = assembled.finalResumeHtml || '';

  // 1. Strip max-height / min-height / overflow from .page
  html = html.replace(/\.page\s*\{([^}]*)\}/, (_match, inner: string) => {
    inner = inner.replace(/max-height\s*:\s*[^;]+;?\s*/gi, '');
    inner = inner.replace(/min-height\s*:\s*[^;]+;?\s*/gi, '');
    inner = inner.replace(/overflow\s*:\s*[^;]+;?\s*/gi, '');
    return `.page {${inner}}`;
  });

  // 2. Strip same props from @media print .page block
  html = html.replace(/@media print\s*\{([^}]*\.page\s*\{[^}]*\}[^}]*)\}/gi, (match: string) =>
    match
      .replace(/max-height\s*:\s*[^;]+;?\s*/gi, '')
      .replace(/min-height\s*:\s*[^;]+;?\s*/gi, '')
      .replace(/overflow\s*:\s*[^;]+;?\s*/gi, '')
  );

  // 3. Content heuristics → fit profile
  const textOnly = html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const textLength = textOnly.length;
  const bulletCount = (html.match(/<li\b/gi) || []).length;

  let fitProfile = 'balanced';
  if (textLength <= 2600 || bulletCount <= 12) fitProfile = 'very-short';
  else if (textLength <= 3400 || bulletCount <= 17) fitProfile = 'short';
  else if (textLength >= 5200 || bulletCount >= 28) fitProfile = 'very-long';
  else if (textLength >= 4300 || bulletCount >= 23) fitProfile = 'long';

  // 4. Add profile class to <body>
  if (/<body\b[^>]*class=/i.test(html)) {
    html = html.replace(
      /<body([^>]*?)class=(["'])(.*?)\2([^>]*)>/i,
      (_m, pre, q, cls, post) => `<body${pre}class=${q}${cls} resume-fit-${fitProfile}${q}${post}>`
    );
  } else {
    html = html.replace(/<body([^>]*)>/i, `<body$1 class="resume-fit-${fitProfile}">`);
  }

  // 5. Inject A4 reset + flex auto-balancing CSS
  const spaceRecoveryStyle = `
<style id="resume-fit-style">
  @page { size: A4; margin: 0; }
  html, body { margin: 0; padding: 0; }

  .page {
    --page-pad-top: 12px;
    --page-pad-bottom: 10px;
    --page-pad-x: 20px;

    --h1-size: 34px;
    --contact-size: 14px;
    --h2-size: 18px;

    --summary-size: 13.5px;
    --summary-lh: 1.28;

    --li-size: 13.5px;
    --li-lh: 1.22;
    --li-mb: 1px;

    --section-mt: 7px;
    --entry-mb: 5px;
    --h2-mb: 3px;
    --edu-mb: 3px;

    padding: var(--page-pad-top) var(--page-pad-x) var(--page-pad-bottom) !important;
    margin: 0 auto !important;
    width: 210mm !important;
    height: 297mm !important;
    box-sizing: border-box !important;

    display: flex !important;
    flex-direction: column !important;
    justify-content: flex-start !important;
    overflow: hidden !important;
  }

  .page::before,
  .page::after {
    content: "" !important;
    flex: 1 1 0 !important;
    min-height: 0 !important;
  }

  .page > * {
    flex-shrink: 0 !important;
  }

  h1 {
    font-size: var(--h1-size) !important;
    line-height: 1 !important;
  }

  .contact {
    font-size: var(--contact-size) !important;
  }

  h2 {
    font-size: var(--h2-size) !important;
    margin: 0 0 var(--h2-mb) !important;
  }

  .section     { margin-top: var(--section-mt) !important; }
  .entry       { margin-bottom: var(--entry-mb) !important; }
  li           { font-size: var(--li-size) !important; line-height: var(--li-lh) !important; margin-bottom: var(--li-mb) !important; }
  .summary,
  .skill-line  { font-size: var(--summary-size) !important; line-height: var(--summary-lh) !important; }
  .edu-row     { margin-bottom: var(--edu-mb) !important; }

  body.resume-fit-very-short .page {
    --page-pad-top: 8px;
    --page-pad-bottom: 8px;
    --h1-size: 37px;
    --contact-size: 14.8px;
    --h2-size: 19px;
    --summary-size: 14.4px;
    --summary-lh: 1.36;
    --li-size: 14.1px;
    --li-lh: 1.31;
    --li-mb: 2px;
    --section-mt: 10px;
    --entry-mb: 7px;
    --h2-mb: 4px;
    --edu-mb: 4px;
  }

  body.resume-fit-short .page {
    --page-pad-top: 10px;
    --page-pad-bottom: 9px;
    --h1-size: 35.5px;
    --contact-size: 14.4px;
    --h2-size: 18.5px;
    --summary-size: 14px;
    --summary-lh: 1.33;
    --li-size: 13.9px;
    --li-lh: 1.27;
    --li-mb: 1.5px;
    --section-mt: 8.5px;
    --entry-mb: 6px;
    --h2-mb: 3.5px;
    --edu-mb: 3.5px;
  }

  body.resume-fit-long .page {
    --page-pad-top: 10px;
    --page-pad-bottom: 8px;
    --page-pad-x: 19px;
    --h1-size: 33px;
    --contact-size: 13.6px;
    --h2-size: 17.4px;
    --summary-size: 13.1px;
    --summary-lh: 1.24;
    --li-size: 13.1px;
    --li-lh: 1.18;
    --li-mb: 0.5px;
    --section-mt: 6px;
    --entry-mb: 4px;
    --h2-mb: 2.5px;
    --edu-mb: 2px;
  }

  body.resume-fit-very-long .page {
    --page-pad-top: 8px;
    --page-pad-bottom: 7px;
    --page-pad-x: 18px;
    --h1-size: 31.5px;
    --contact-size: 13.1px;
    --h2-size: 16.8px;
    --summary-size: 12.7px;
    --summary-lh: 1.18;
    --li-size: 12.7px;
    --li-lh: 1.14;
    --li-mb: 0px;
    --section-mt: 5px;
    --entry-mb: 3px;
    --h2-mb: 2px;
    --edu-mb: 1px;
  }
</style>`;

  html = html.replace('</head>', spaceRecoveryStyle + '</head>');

  return { htmlContent: html, pdfFilename, fitProfile };
}

/** Build the resume filename (slug) the way the n8n pipeline did. */
export function buildFilename(parts: { firstName?: string; lastName?: string; roletitle?: string; companyname?: string }): string {
  const slug = [parts.firstName, parts.lastName, parts.roletitle, parts.companyname].filter(Boolean).join('_');
  return `${slug || 'resume'}.html`;
}
