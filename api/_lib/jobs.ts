// ============================================================================
// Job orchestrator — a resumable pipeline state machine backed by the
// `resumatch_jobs` table. Each stage reads the job's current `stage` + `state`,
// does a small unit of work (1 LLM call, or 4 parallel), and persists the
// result + the next stage. Because progress is checkpointed after every stage,
// a function timeout is survivable: a stalled non-terminal job is simply
// re-driven (see api/jobs/[id].ts).
// ============================================================================

import { getAdminClient, PDF_BUCKET } from './supabaseAdmin.js';
import { extractJd } from './pipeline/extractJd.js';
import { parseResumeHtml } from './pipeline/parseResumeHtml.js';
import { narrativeStrategy } from './pipeline/narrative.js';
import { keywordPlan } from './pipeline/keywords.js';
import { assembleStrategy } from './pipeline/assembleStrategy.js';
import { splitSections } from './pipeline/splitSections.js';
import { refineSections } from './pipeline/refineSection.js';
import { assembleHtml } from './pipeline/assembleHtml.js';
import { preparePdf, buildFilename } from './pipeline/preparePdf.js';
import { renderPdf } from './pdf.js';
import { assertResumeUsesBaseTemplate } from './resumeImport/template.js';
import type { GenerateInput } from './pipeline/types.js';

type StageName = 'extract_jd' | 'narrative' | 'keywords' | 'assemble_strategy' | 'refine' | 'finalize';

const ORDER: StageName[] = ['extract_jd', 'narrative', 'keywords', 'assemble_strategy', 'refine', 'finalize'];

// step maps to the 5-step frontend loader (0 connecting … 4 finalizing)
const STEP: Record<StageName, number> = {
  extract_jd: 1,
  narrative: 2,
  keywords: 2,
  assemble_strategy: 3,
  refine: 3,
  finalize: 4,
};

const TABLE = 'resumatch_jobs';

// ── small helpers ───────────────────────────────────────────────────────────

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v == null ? '' : String(v);
}

export function normalizeInput(raw: Record<string, any>): GenerateInput {
  return {
    firstName: str(raw.firstName),
    lastName: str(raw.lastName),
    baseResumeHtml: str(raw.baseResumeHtml),
    jd: str(raw.jd),
    keywords: str(raw.keywords),
    maxgrowthpct: Number.isFinite(Number(raw.maxgrowthpct)) ? Number(raw.maxgrowthpct) : 8,
    companynamefallback: str(raw.companynamefallback) || 'unknown-company',
    roletitlefallback: str(raw.roletitlefallback) || 'target-role',
  };
}

function sanitizeForPath(...parts: string[]): string {
  return (
    parts
      .map((s) => s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
      .filter(Boolean)
      .join('-') || 'resume'
  );
}

async function patchJob(id: string, fields: Record<string, any>): Promise<void> {
  const supa = getAdminClient();
  const { error } = await supa
    .from(TABLE)
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(`[jobs] update failed: ${error.message}`);
}

interface JobRow {
  id: string;
  status: 'queued' | 'processing' | 'complete' | 'error';
  step: number;
  stage: StageName;
  input: GenerateInput;
  state: Record<string, any>;
  result: any;
  error: string | null;
  updated_at: string;
}

async function getJobRow(id: string): Promise<JobRow | null> {
  const supa = getAdminClient();
  const { data, error } = await supa.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`[jobs] fetch failed: ${error.message}`);
  return (data as JobRow) ?? null;
}

// ── public API ──────────────────────────────────────────────────────────────

export async function createJob(rawInput: Record<string, any>): Promise<string> {
  const input = normalizeInput(rawInput);
  if (!input.jd) throw new Error('Missing required field: jd');
  if (!input.baseResumeHtml) throw new Error('Missing required field: baseResumeHtml');
  assertResumeUsesBaseTemplate(input.baseResumeHtml);

  const supa = getAdminClient();
  const { data, error } = await supa
    .from(TABLE)
    .insert({ status: 'queued', step: 0, stage: 'extract_jd', input, state: {} })
    .select('id')
    .single();
  if (error) throw new Error(`[jobs] create failed: ${error.message}`);
  return data.id as string;
}

export async function getJob(id: string) {
  const job = await getJobRow(id);
  if (!job) return null;
  return {
    id: job.id,
    status: job.status,
    step: job.step,
    stage: job.stage,
    result: job.result,
    error: job.error,
    updatedAt: job.updated_at,
  };
}

// ── stage execution ──────────────────────────────────────────────────────────

async function runStage(
  stage: StageName,
  state: Record<string, any>,
  input: GenerateInput
): Promise<{ patch: Record<string, any>; result?: any }> {
  switch (stage) {
    case 'extract_jd': {
      const jdintelligence = await extractJd(input.jd, input.keywords);
      const parsed = parseResumeHtml(input.baseResumeHtml);
      return { patch: { jdintelligence, resumesections: parsed.resumesections, parsermeta: parsed.parsermeta } };
    }
    case 'narrative': {
      const parsednarrative = await narrativeStrategy({
        maxgrowthpct: input.maxgrowthpct,
        baseResumeHtml: input.baseResumeHtml,
        jdintelligence: state.jdintelligence,
        resumesections: state.resumesections,
        parsermeta: state.parsermeta,
      });
      return { patch: { parsednarrative } };
    }
    case 'keywords': {
      const keyworddecision = await keywordPlan({
        keywordsraw: input.keywords,
        maxgrowthpct: input.maxgrowthpct,
        baseResumeHtml: input.baseResumeHtml,
        jdintelligence: state.jdintelligence,
        resumesections: state.resumesections,
        parsermeta: state.parsermeta,
      });
      return { patch: { keyworddecision } };
    }
    case 'assemble_strategy': {
      const companyname = state.jdintelligence.companyname || input.companynamefallback;
      const roletitle = state.jdintelligence.roletitle || input.roletitlefallback;
      const strategy = assembleStrategy({
        parsednarrative: state.parsednarrative,
        keyworddecision: state.keyworddecision,
        resumesections: state.resumesections,
        parsermeta: state.parsermeta,
        maxgrowthpct: input.maxgrowthpct,
        baseResumeHtml: input.baseResumeHtml,
        firstName: input.firstName,
        lastName: input.lastName,
        companyname,
        roletitle,
      });
      splitSections(strategy); // validate completeness early (throws if incomplete)
      return { patch: { strategy } };
    }
    case 'refine': {
      const items = splitSections(state.strategy);
      const refined = await refineSections(items);
      return { patch: { refined } };
    }
    case 'finalize': {
      const strategy = state.strategy;
      const refined = state.refined;
      const companyname = strategy.companyname || input.companynamefallback;
      const roletitle = strategy.roletitle || input.roletitlefallback;

      const slugName = buildFilename({
        firstName: strategy.firstName,
        lastName: strategy.lastName,
        roletitle,
        companyname,
      });
      const assembled = assembleHtml({
        baseResumeHtml: strategy.baseResumeHtml,
        sections: refined,
        filename: slugName,
        companyname,
        roletitle,
      });
      const prepared = preparePdf(assembled);
      const pdf = await renderPdf(prepared.htmlContent);

      const supa = getAdminClient();
      const filePath = `${Date.now()}-${sanitizeForPath(companyname, roletitle)}.pdf`;
      const { error: upErr } = await supa.storage
        .from(PDF_BUCKET)
        .upload(filePath, pdf, { contentType: 'application/pdf', upsert: false });
      if (upErr) throw new Error(`[finalize] PDF upload failed: ${upErr.message}`);

      const { data: urlData } = supa.storage.from(PDF_BUCKET).getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      const { data: row, error: histErr } = await supa
        .from('resumatch_resume_history')
        .insert({
          company_name: companyname,
          role_title: roletitle,
          filename: prepared.pdfFilename,
          resume_html: assembled.finalResumeHtml,
          format: 'pdf',
          job_description: input.jd,
          keywords: input.keywords,
        })
        .select('id')
        .single();
      if (histErr) throw new Error(`[finalize] history insert failed: ${histErr.message}`);

      await supa.from('resumatch_resume_pdfs').insert({
        resume_history_id: row.id,
        file_name: prepared.pdfFilename,
        file_path: filePath,
        public_url: publicUrl,
        file_size_bytes: pdf.length,
      });

      return {
        patch: {},
        result: {
          filename: prepared.pdfFilename,
          companyname,
          roletitle,
          pdf_url: publicUrl,
          history_id: row.id,
          format: 'pdf',
        },
      };
    }
    default:
      throw new Error(`[jobs] unknown stage: ${stage}`);
  }
}

/** Advance a job by exactly one stage. Returns true when the job is terminal. */
export async function advanceJob(id: string): Promise<boolean> {
  const job = await getJobRow(id);
  if (!job) throw new Error(`[jobs] not found: ${id}`);
  if (job.status === 'complete' || job.status === 'error') return true;
  // Resume-import jobs share this table but are driven by driveImportJob — the
  // generate state machine must never touch them.
  if ((job.input as { kind?: string } | null)?.kind === 'import') return true;

  const stage = job.stage;
  await patchJob(id, { status: 'processing', step: STEP[stage] });

  try {
    const { patch, result } = await runStage(stage, job.state ?? {}, job.input);
    const newState = { ...(job.state ?? {}), ...patch };
    const next = ORDER[ORDER.indexOf(stage) + 1];

    if (!next) {
      await patchJob(id, { state: newState, status: 'complete', step: 4, result });
      return true;
    }
    await patchJob(id, { state: newState, stage: next });
    return false;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await patchJob(id, { status: 'error', error: message.slice(0, 1000) });
    return true;
  }
}

/** Drive a job to completion, one stage at a time. Safe to call repeatedly. */
export async function driveJob(id: string): Promise<void> {
  // ORDER.length is the natural cap; +2 slack for a resumed/claimed stage.
  for (let i = 0; i < ORDER.length + 2; i++) {
    const done = await advanceJob(id);
    if (done) return;
  }
}
