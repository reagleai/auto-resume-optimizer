// ============================================================================
// Stage 7 — Section refinement.
// Replaces n8n: LLM-Section Refiner (×4) + Tag & Aggregate Sections.
// Each section is refined by its own LLM call; the four run in parallel.
//
// Audit fix F-06: the original detected section_id by sniffing CSS classes in
// the LLM output (fragile). Here the section_id is KNOWN per call, so we attach
// it directly — no detection, no misclassification. The HTML is fence-stripped.
// ============================================================================

import { callLLM } from '../llm.js';
import { stripMarkdownFences } from '../json.js';
import { SECTION_REFINER_SYSTEM, sectionRefinerUser } from './prompts.js';
import type { SplitItem, RefinedSection } from './types.js';

async function refineOne(item: SplitItem): Promise<RefinedSection> {
  const reply = await callLLM(
    {
      system: SECTION_REFINER_SYSTEM,
      user: sectionRefinerUser(item),
      json: false, // expects an HTML fragment, not JSON
      temperature: 0.3,
    },
    3 // a single section failing shouldn't be fatal on the first hiccup (F-05)
  );

  const html = stripMarkdownFences(reply);
  if (!html) {
    throw new Error(`[refine] Empty output for section "${item.current_edit_object.section_id}".`);
  }
  return { section_id: item.current_edit_object.section_id, html };
}

export async function refineSections(items: SplitItem[]): Promise<RefinedSection[]> {
  const results = await Promise.all(items.map(refineOne));

  const expected = ['summary', 'experience', 'projects', 'skills'];
  const found = results.map((r) => r.section_id);
  const missing = expected.filter((id) => !found.includes(id as any));
  if (missing.length) {
    throw new Error(`[refine] Missing refined sections: ${missing.join(', ')}.`);
  }
  return results;
}
