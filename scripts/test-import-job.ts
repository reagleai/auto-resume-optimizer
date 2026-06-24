// ============================================================================
// Integration check for the async resume-import JOB flow (the polling path).
//
// Complements scripts/test-resume-import.ts (which unit-tests the pipeline with
// a mocked LLM). This one exercises the real job lifecycle:
//   createImportJob → driveImportJob (real LLM) → getImportJob → cleanup.
//
// Run:
//   npx tsx --env-file=.env.local scripts/test-import-job.ts
//
// [1] Pure render sanity — always runs (no network).
// [2] Job lifecycle — runs only if OPENROUTER_API_KEY + Supabase env are set;
//     it writes one row to resumatch_jobs and deletes it afterwards.
// ============================================================================

import { renderResumeTemplate } from '../api/_lib/resumeImport/template.js';
import {
  createImportJob,
  driveImportJob,
  getImportJob,
} from '../api/_lib/resumeImport/jobs.js';
import { getAdminClient } from '../api/_lib/supabaseAdmin.js';
import type { ImportedResumeData } from '../api/_lib/resumeImport/types.js';

const SAMPLE_RESUME = `JORDAN MERCER
Senior Product Manager  |  jordan.mercer@example.com  |  +1 415 555 0142  |  linkedin.com/in/jordanmercer  |  San Francisco, CA

SUMMARY
Senior product manager with 7 years building B2B SaaS analytics products. Led 0-to-1 launches across data tooling, owning discovery, experimentation, and cross-functional delivery.

EXPERIENCE
Acme Analytics — Senior Product Manager
San Francisco, CA | Mar 2021 – Present
- Owned the self-serve analytics suite used by 12,000 monthly active teams, growing activation 34% via onboarding redesign.
- Ran a 6-person squad shipping usage-based billing that lifted net revenue retention from 104% to 119%.

DataPipe Inc — Product Manager
Remote | Jun 2018 – Feb 2021
- Launched a managed ETL connector marketplace from scratch, reaching 80+ connectors and $3.2M ARR in 18 months.

PROJECTS
OpenMetrics Dashboard | github.com/jmercer/openmetrics
2022
- Built an open-source dashboard for product metrics with 1.4k GitHub stars.

SKILLS
Product: Discovery, Roadmapping, A/B Testing, PRDs, GTM
Analytics: SQL, Amplitude, Looker

EDUCATION
University of Washington | B.S. Computer Science | 2014 – 2018`;

const FIXED_DATA: ImportedResumeData = {
  name: 'Jordan Mercer',
  contact: [{ text: 'jordan.mercer@example.com', href: 'mailto:jordan.mercer@example.com' }],
  summary: 'Senior product manager with 7 years building B2B SaaS analytics products.',
  experience: [{ organization: 'Acme Analytics', role: 'Senior Product Manager', location: 'San Francisco, CA', dates: 'Mar 2021 – Present', bullets: ['Owned the self-serve analytics suite.'] }],
  projects: [],
  skills: [{ category: 'Product', items: ['Discovery', 'Roadmapping'] }],
  education: [{ institution: 'University of Washington', detail: 'B.S. Computer Science', dates: '2014 – 2018' }],
};

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`);
  console.log(`  ✓ ${msg}`);
}

async function main() {
  console.log('\n[1] renderResumeTemplate (pure, no network)');
  const rendered = renderResumeTemplate(FIXED_DATA);
  assert(rendered.includes('<!DOCTYPE html>'), 'output is a full HTML document');
  assert(rendered.includes('JORDAN MERCER'), 'candidate name rendered');
  assert(!rendered.includes('AJAY SHARMA'), 'template example content fully replaced');

  if (!process.env.OPENROUTER_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('\n[skip] OPENROUTER_API_KEY + Supabase env required — skipping job lifecycle.');
    console.log('\nDone (pure render OK).');
    return;
  }

  console.log('\n[2] Job lifecycle (create → drive → poll → cleanup)');
  const jobId = await createImportJob(1);
  assert(!!jobId, `import job created (id ${jobId})`);

  const queued = await getImportJob(jobId);
  assert(queued?.status === 'queued' && queued.stage === 'extract', 'job starts queued at stage "extract"');

  const t0 = Date.now();
  await driveImportJob(jobId, SAMPLE_RESUME, 1);
  console.log(`     (drive took ${((Date.now() - t0) / 1000).toFixed(1)}s)`);

  const done = await getImportJob(jobId);
  assert(done?.status === 'complete', `job reached "complete" (got "${done?.status}", error: ${done?.error ?? 'none'})`);
  const result = done?.result as { firstName?: string; baseResumeHtml?: string; report?: { audits?: unknown[] } } | null;
  assert(result?.firstName?.toLowerCase() === 'jordan', `result firstName parsed (got "${result?.firstName}")`);
  assert(!!result?.baseResumeHtml?.includes('<!DOCTYPE html>'), 'result carries a valid HTML document');
  assert((result?.report?.audits?.length ?? 0) === 2, 'result report has 2 audit passes');
  for (const fact of ['Acme Analytics', 'DataPipe', 'OpenMetrics']) {
    assert(result?.baseResumeHtml?.includes(fact), `source fact preserved: "${fact}"`);
  }

  await getAdminClient().from('resumatch_jobs').delete().eq('id', jobId);
  assert((await getImportJob(jobId)) === null, 'test job row cleaned up');

  console.log('\nDone (full import job flow OK).');
}

main().catch((err) => {
  console.error('\nFAILED:', err);
  process.exit(1);
});
