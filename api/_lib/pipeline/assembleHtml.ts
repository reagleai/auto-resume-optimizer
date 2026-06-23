// ============================================================================
// Stage 8 — Section assembly.
// Port of the n8n "Section Assembler" node. Injects each refined HTML fragment
// into its <section class="section"> block (matched by <h2> heading). The
// header and education sections pass through untouched.
// ============================================================================

import type { RefinedSection, AssembledResume } from './types.js';

const SECTION_HEADING: Record<string, string> = {
  summary: 'SUMMARY',
  experience: 'EXPERIENCE',
  projects: 'PROJECTS',
  skills: 'SKILLS',
};

function replaceSectionInner(html: string, headingText: string, newInner: string): string {
  const sectionRx = /<section\b[^>]*class="section"[^>]*>([\s\S]*?)<\/section>/gi;
  return html.replace(sectionRx, (fullMatch) => {
    const h2Match = fullMatch.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    if (!h2Match) return fullMatch;
    const heading = h2Match[1].replace(/<[^>]*>/g, '').trim().toUpperCase();
    if (heading !== headingText.toUpperCase()) return fullMatch;
    return fullMatch.replace(
      /(<h2[^>]*>[\s\S]*?<\/h2>)([\s\S]*)(<\/section>)/i,
      (_m, h2Block, _inner, closing) => `${h2Block}\n      ${newInner}\n    ${closing}`
    );
  });
}

export function assembleHtml(args: {
  baseResumeHtml: string;
  sections: RefinedSection[];
  filename: string;
  companyname: string;
  roletitle: string;
}): AssembledResume {
  const { baseResumeHtml, sections } = args;

  const sectionMap: Record<string, string> = {};
  for (const s of sections) sectionMap[s.section_id] = s.html;

  const expected = ['summary', 'experience', 'projects', 'skills'];
  const missing = expected.filter((id) => !(id in sectionMap));
  if (missing.length) {
    throw new Error(`[assembler] Missing sections: ${missing.join(', ')}.`);
  }

  let finalHtml = baseResumeHtml;
  const warnings: string[] = [];
  for (const [sectionId, heading] of Object.entries(SECTION_HEADING)) {
    if (!sectionMap[sectionId]) continue;
    const before = finalHtml;
    finalHtml = replaceSectionInner(finalHtml, heading, sectionMap[sectionId]);
    if (finalHtml === before) warnings.push(`${sectionId}_no_change_check_h2_heading`);
  }
  if (finalHtml === baseResumeHtml) warnings.push('final_html_identical_to_base');

  if (warnings.length && process.env.NODE_ENV !== 'production') {
    console.warn('[assembler] warnings:', warnings.join(', '));
  }

  return {
    finalResumeHtml: finalHtml,
    filename: args.filename,
    companyname: args.companyname,
    roletitle: args.roletitle,
  };
}
