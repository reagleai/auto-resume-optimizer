import { readFileSync } from 'node:fs';
import {
  importResumeFromText,
  RESUME_IMPORT_REVIEW_PASSES,
} from '../api/_lib/resumeImport/pipeline.js';
import {
  assertResumeUsesBaseTemplate,
  renderResumeTemplate,
} from '../api/_lib/resumeImport/template.js';
import type { LLMCallOptions } from '../api/_lib/llm.js';
import type { ImportedResumeData } from '../api/_lib/resumeImport/types.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
  console.log(`  ✓ ${message}`);
}

const resume: ImportedResumeData = {
  name: 'Riya Mehta',
  contact: [
    { text: 'riya@example.com', href: 'mailto:riya@example.com' },
    { text: '+91 99999 11111', href: 'tel:+919999911111' },
  ],
  summary: 'Product analyst with three years of experience in experimentation and analytics.',
  experience: [{
    organization: 'Example Labs',
    role: 'Product Analyst',
    location: 'Remote',
    dates: '2023 – Present',
    bullets: ['Improved activation by 18% through onboarding experiments.'],
  }],
  projects: [],
  skills: [{ category: 'Analytics', items: ['SQL', 'Mixpanel'] }],
  education: [{
    institution: 'Example University',
    detail: 'B.Tech in Computer Science',
    dates: '2019 – 2023',
  }],
};

async function main() {
  const template = readFileSync('base_resume.html', 'utf8');

  console.log('\n[1] Template rendering');
  const html = renderResumeTemplate(resume, template);
  assertResumeUsesBaseTemplate(html, template);
  assert(html.includes('RIYA MEHTA'), 'candidate content is inserted');
  assert(!html.includes('AJAY SHARMA'), 'baseline candidate content is removed');
  assert(
    html.match(/<style>[\s\S]*?<\/style>/)?.[0] === template.match(/<style>[\s\S]*?<\/style>/)?.[0],
    'base template CSS remains byte-for-byte unchanged',
  );

  console.log('\n[2] Two-pass import verification');
  const sourceLine =
    'Riya Mehta product analyst riya@example.com Example Labs Product Analyst 2023 Present SQL Mixpanel activation improved by 18 percent.';
  const replies = [
    JSON.stringify(resume),
    JSON.stringify({
      resume,
      audit: {
        missingFacts: [],
        unsupportedFacts: [],
        correctionsMade: ['Confirmed the exact 18% metric.'],
        confidence: 0.96,
      },
    }),
    JSON.stringify({
      resume,
      audit: {
        missingFacts: [],
        unsupportedFacts: [],
        correctionsMade: [],
        confidence: 0.99,
      },
    }),
  ];
  const calls: LLMCallOptions[] = [];
  const complete = async (options: LLMCallOptions) => {
    calls.push(options);
    const reply = replies.shift();
    if (!reply) throw new Error('Unexpected extra LLM call.');
    return reply;
  };

  const imported = await importResumeFromText(sourceLine, { complete, templateHtml: template });
  assert(RESUME_IMPORT_REVIEW_PASSES === 2, 'review pass count is fixed at two');
  assert(calls.length === 3, 'one extraction call plus two review calls are made');
  assert(imported.audits.length === 2, 'both review audits are retained');
  assert(imported.firstName === 'Riya' && imported.lastName === 'Mehta', 'profile name fields are derived');
  assertResumeUsesBaseTemplate(imported.baseResumeHtml, template);

  if (process.env.RUN_LIVE_RESUME_IMPORT === '1') {
    console.log('\n[3] Live LLM accuracy check');
    const liveSource = `Riya Mehta
Email: riya@example.com
Phone: +91 99999 11111

SUMMARY
Product analyst with 3 years of experience in experimentation and analytics.

EXPERIENCE
Example Labs — Product Analyst — Remote — 2023 to Present
- Improved activation by exactly 18% through onboarding experiments.
- Built weekly Mixpanel reports for product and growth teams.

SKILLS
Analytics: SQL, Mixpanel

EDUCATION
Example University — B.Tech in Computer Science — 2019 to 2023`;
    const live = await importResumeFromText(liveSource, { templateHtml: template });
    assert(live.baseResumeHtml.includes('Example Labs'), 'live import preserves organization');
    assert(live.baseResumeHtml.includes('18%'), 'live import preserves exact metric');
    assert(live.baseResumeHtml.includes('2023 to Present'), 'live import preserves dates');
    assert(live.audits.length === 2, 'live import completes both review loops');
  }

  console.log('\nResume import tests passed.');
}

main().catch((error) => {
  console.error('\nFAILED:', error);
  process.exit(1);
});
