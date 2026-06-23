// ============================================================================
// Stage 4 — Keyword fit planning.
// Replaces n8n: Keyword Branch Prep + LLM-Keyword Fit Planner + Keyword Parser.
// ============================================================================

import { callLLM } from '../llm.js';
import { parseLlmJson } from '../json.js';
import { KEYWORD_SYSTEM, keywordUser } from './prompts.js';
import type { JdIntelligence, ResumeSections, ParserMeta, KeywordDecision } from './types.js';

function csvToArray(v: string): string[] {
  return [...new Set(v.split(/\r?\n|,/).map((x) => x.trim()).filter(Boolean))];
}

export async function keywordPlan(args: {
  keywordsraw: string;
  maxgrowthpct: number;
  baseResumeHtml: string;
  jdintelligence: JdIntelligence;
  resumesections: ResumeSections;
  parsermeta: ParserMeta;
}): Promise<KeywordDecision> {
  const reply = await callLLM({
    system: KEYWORD_SYSTEM,
    user: keywordUser({
      keywordsraw: csvToArray(args.keywordsraw),
      maxgrowthpct: args.maxgrowthpct,
      baseResumeHtml: args.baseResumeHtml,
      jdintelligence: {
        tools_technologies: args.jdintelligence.tools_technologies,
        jdkeywords: args.jdintelligence.jdkeywords,
        musthavekeywords: args.jdintelligence.musthavekeywords,
        riskykeywords: args.jdintelligence.riskykeywords,
      },
      resumesections: args.resumesections,
      parsermeta: { sectionLengths: args.parsermeta.sectionLengths },
    }),
    json: true,
    temperature: 0.2,
  });

  return parseLlmJson<KeywordDecision>(reply);
}
