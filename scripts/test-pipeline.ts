// ============================================================================
// Manual end-to-end pipeline check (no HTTP, no DB).
//
// Run:
//   npx tsx --env-file=.env.local scripts/test-pipeline.ts
//
// Always runs the pure HTML parse + assembly stages. Runs the LLM stages only
// if OPENROUTER_API_KEY is set, and the PDF stage only if PDFSHIFT_API_KEY is
// set — so you can validate each layer independently.
// ============================================================================

import { parseResumeHtml } from '../api/_lib/pipeline/parseResumeHtml.js';
import { extractJd } from '../api/_lib/pipeline/extractJd.js';
import { narrativeStrategy } from '../api/_lib/pipeline/narrative.js';
import { keywordPlan } from '../api/_lib/pipeline/keywords.js';
import { assembleStrategy } from '../api/_lib/pipeline/assembleStrategy.js';
import { splitSections } from '../api/_lib/pipeline/splitSections.js';
import { refineSections } from '../api/_lib/pipeline/refineSection.js';
import { assembleHtml } from '../api/_lib/pipeline/assembleHtml.js';
import { preparePdf, buildFilename } from '../api/_lib/pipeline/preparePdf.js';
import { renderPdf } from '../api/_lib/pdf.js';

const SAMPLE_HTML = `<!doctype html><html><head><style>.page{max-height:297mm;overflow:hidden}</style></head>
<body><div class="page">
  <header><h1>Ajay Sharma</h1><div class="contact"><span>ajay@example.com</span><span>+91 99999 99999</span></div></header>
  <section class="section"><h2>SUMMARY</h2><p class="summary">Product manager with 4 years building AI-driven tools and data products.</p></section>
  <section class="section"><h2>EXPERIENCE</h2>
    <article class="entry"><div class="entry-head"><div><div class="org">Acme Corp</div><div class="role">Product Manager</div></div><div class="meta"><div>Bengaluru</div><div>2022–Present</div></div></div>
      <ul><li>Led a team of 5 to ship an analytics dashboard used by 10,000 users.</li><li>Drove 21% uplift in activation via onboarding experiments.</li></ul></article>
  </section>
  <section class="section"><h2>PROJECTS</h2>
    <article class="entry"><div class="org">Resume AI <span class="pipe">|</span> <a href="https://example.com">View Prototype</a></div><div class="meta">2024</div>
      <ul><li>Built an LLM pipeline that tailors resumes to job descriptions.</li></ul></article>
  </section>
  <section class="section"><h2>SKILLS</h2><p class="skill-line"><strong>Product Skills:</strong> Roadmapping, Discovery, Experimentation</p><p class="skill-line"><strong>Tools &amp; Platforms:</strong> SQL, Mixpanel, Figma</p></section>
  <section class="section"><h2>EDUCATION</h2><article class="edu-row"><div>B.Tech, Computer Science</div><div>2018</div></article></section>
</div></body></html>`;

const SAMPLE_JD =
  'We are hiring a Senior Product Manager to own our AI analytics platform. You will run experiments, partner cross-functionally, and drive product adoption and time-to-value. Tools: SQL, Mixpanel, experimentation platforms.';

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`);
  console.log(`  ✓ ${msg}`);
}

async function main() {
  console.log('\n[1] parseResumeHtml');
  const parsed = parseResumeHtml(SAMPLE_HTML);
  assert(parsed.resumesections.header.name === 'Ajay Sharma', 'header name parsed');
  assert(parsed.resumesections.experience.length === 1, 'experience parsed');
  assert(parsed.resumesections.projects.length === 1, 'projects parsed');
  assert(Object.keys(parsed.resumesections.skills).length === 2, 'skills parsed');
  assert(parsed.missingSections.length === 0, 'no missing sections');

  if (!process.env.OPENROUTER_API_KEY) {
    console.log('\n[skip] OPENROUTER_API_KEY not set — skipping LLM stages.');
    console.log('\nDone (pure stages OK).');
    return;
  }

  console.log('\n[2] extractJd (LLM)');
  const jdi = await extractJd(SAMPLE_JD, 'product adoption, experimentation');
  assert(jdi.roletitle || jdi.responsibilities.length, 'jd intelligence extracted');

  console.log('\n[3] narrativeStrategy (LLM)');
  const parsednarrative = await narrativeStrategy({
    maxgrowthpct: 8,
    baseResumeHtml: SAMPLE_HTML,
    jdintelligence: jdi,
    resumesections: parsed.resumesections,
    parsermeta: parsed.parsermeta,
  });
  assert(parsednarrative && typeof parsednarrative === 'object', 'narrative plan returned');

  console.log('\n[4] keywordPlan (LLM)');
  const keyworddecision = await keywordPlan({
    keywordsraw: 'product adoption, experimentation',
    maxgrowthpct: 8,
    baseResumeHtml: SAMPLE_HTML,
    jdintelligence: jdi,
    resumesections: parsed.resumesections,
    parsermeta: parsed.parsermeta,
  });
  assert(keyworddecision && typeof keyworddecision === 'object', 'keyword decision returned');

  console.log('\n[5] assembleStrategy + splitSections');
  const strategy = assembleStrategy({
    parsednarrative,
    keyworddecision,
    resumesections: parsed.resumesections,
    parsermeta: parsed.parsermeta,
    maxgrowthpct: 8,
    baseResumeHtml: SAMPLE_HTML,
    firstName: 'Ajay',
    lastName: 'Sharma',
    companyname: jdi.companyname || 'unknown-company',
    roletitle: jdi.roletitle || 'target-role',
  });
  const items = splitSections(strategy);
  assert(items.length === 4, 'split into 4 section items');

  console.log('\n[6] refineSections (LLM ×4 parallel)');
  const refined = await refineSections(items);
  assert(refined.length === 4, '4 refined fragments returned');

  console.log('\n[7] assembleHtml + preparePdf');
  const assembled = assembleHtml({
    baseResumeHtml: strategy.baseResumeHtml,
    sections: refined,
    filename: buildFilename({ firstName: 'Ajay', lastName: 'Sharma', roletitle: strategy.roletitle!, companyname: strategy.companyname! }),
    companyname: strategy.companyname!,
    roletitle: strategy.roletitle!,
  });
  assert(assembled.finalResumeHtml !== SAMPLE_HTML, 'final HTML differs from base');
  const prepared = preparePdf(assembled);
  assert(prepared.htmlContent.includes('resume-fit-'), 'fit profile injected');

  if (!process.env.PDFSHIFT_API_KEY) {
    console.log('\n[skip] PDFSHIFT_API_KEY not set — skipping PDF render.');
    console.log('\nDone (LLM stages OK).');
    return;
  }

  console.log('\n[8] renderPdf (PDFShift)');
  const pdf = await renderPdf(prepared.htmlContent);
  assert(pdf.subarray(0, 5).toString('latin1') === '%PDF-', 'PDF bytes returned');
  console.log(`  → ${pdf.length} bytes`);

  console.log('\nDone (full pipeline OK).');
}

main().catch((err) => {
  console.error('\nFAILED:', err);
  process.exit(1);
});
