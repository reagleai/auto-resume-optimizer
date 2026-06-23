// ============================================================================
// Stage 1 — JD intelligence extraction.
// Replaces n8n: LLM-JD Extractor + Formatter + Normalize Merge Payload.
// Calls the LLM, parses JSON, normalizes to the 18-field JdIntelligence shape,
// and throws if the extraction produced nothing usable (audit F-15).
// ============================================================================

import { callLLM } from '../llm.js';
import { parseLlmJson } from '../json.js';
import { JD_EXTRACTOR_SYSTEM, jdExtractorUser } from './prompts.js';
import type { JdIntelligence } from './types.js';

function s(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function cleanArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of v) {
    const value = String(item ?? '').trim();
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

export function normalizeJdIntelligence(raw: Record<string, any>): JdIntelligence {
  return {
    companyname: s(raw.companyname),
    roletitle: s(raw.roletitle),
    companycontext: s(raw.companycontext),
    rolesummary: s(raw.rolesummary),
    recruitersignal: s(raw.recruitersignal),
    responsibilities: cleanArray(raw.responsibilities),
    qualifications: cleanArray(raw.qualifications),
    musthaves: cleanArray(raw.musthaves),
    nice_to_haves: cleanArray(raw.nice_to_haves ?? raw.nicetohaves),
    tools_technologies: cleanArray(raw.tools_technologies ?? raw.toolstechnologies),
    domain: s(raw.domain),
    seniority: s(raw.seniority),
    narrativepositioning: s(raw.narrativepositioning),
    resume_emphasis: cleanArray(raw.resume_emphasis ?? raw.resumeemphasis),
    resume_deemphasis: cleanArray(raw.resume_deemphasis ?? raw.resumedeemphasis),
    jdkeywords: cleanArray(raw.jdkeywords),
    musthavekeywords: cleanArray(raw.musthavekeywords),
    riskykeywords: cleanArray(raw.riskykeywords),
  };
}

export async function extractJd(jd: string, keywordsraw: string): Promise<JdIntelligence> {
  const reply = await callLLM({
    system: JD_EXTRACTOR_SYSTEM,
    user: jdExtractorUser(jd, keywordsraw),
    json: true,
    temperature: 0.1,
  });

  const parsed = parseLlmJson<Record<string, any>>(reply);
  const intelligence = normalizeJdIntelligence(parsed);

  // Hard guard: if the model returned nothing identifying the role, fail loudly
  // instead of silently producing an untailored resume (F-15).
  if (!intelligence.companyname && !intelligence.roletitle && !intelligence.responsibilities.length) {
    throw new Error('JD intelligence extraction returned no usable fields.');
  }

  return intelligence;
}
