// ============================================================================
// Stage 3 — Narrative strategy.
// Replaces n8n: Narrative Branch Prep + LLM-Narrative Strategist + Narrative
// Parser. The audit's #1 bug (raw object interpolation → "[object Object]") is
// fixed here because narrativeUser() injects all objects via JSON.stringify.
// ============================================================================

import { callLLM } from '../llm.js';
import { parseLlmJson } from '../json.js';
import { NARRATIVE_SYSTEM, narrativeUser } from './prompts.js';
import type { JdIntelligence, ResumeSections, ParserMeta, NarrativePlan } from './types.js';

export async function narrativeStrategy(args: {
  maxgrowthpct: number;
  baseResumeHtml: string;
  jdintelligence: JdIntelligence;
  resumesections: ResumeSections;
  parsermeta: ParserMeta;
}): Promise<NarrativePlan> {
  const reply = await callLLM({
    system: NARRATIVE_SYSTEM,
    user: narrativeUser({
      maxgrowthpct: args.maxgrowthpct,
      baseResumeHtml: args.baseResumeHtml,
      jdintelligence: args.jdintelligence,
      resumesections: args.resumesections,
      parsermeta: args.parsermeta,
    }),
    json: true,
    temperature: 0.3,
  });

  return parseLlmJson<NarrativePlan>(reply);
}
