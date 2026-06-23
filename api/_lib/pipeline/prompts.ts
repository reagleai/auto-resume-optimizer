// ============================================================================
// LLM prompt builders. System prompts are imported verbatim from the original
// n8n nodes (prompts.system.ts). User prompts are rebuilt here as parameterised
// functions — with the key audit fix applied: object inputs are injected with
// JSON.stringify (the n8n flow interpolated them raw, yielding "[object Object]"
// in the Narrative Strategist prompt — Corruption Point 4 / F-17).
// ============================================================================

import type { SectionEditObject } from './types.js';

export {
  JD_EXTRACTOR_SYSTEM,
  NARRATIVE_SYSTEM,
  KEYWORD_SYSTEM,
  SECTION_REFINER_SYSTEM,
} from './prompts.system.js';

// ── 1. JD Extractor user prompt ─────────────────────────────────────────────

export function jdExtractorUser(jd: string, keywordsraw: string): string {
  return `You will receive two inputs.

INPUT 1 — JOB DESCRIPTION:
${jd}

INPUT 2 — USER-PROVIDED MANDATORY KEYWORDS:
${keywordsraw}

Extract the role intelligence needed for downstream HTML + JSON resume tailoring and return strict JSON with exactly this shape:

{
  "companyname": "",
  "roletitle": "",
  "companycontext": "",
  "rolesummary": "",
  "recruitersignal": "",
  "responsibilities": [],
  "qualifications": [],
  "musthaves": [],
  "nice_to_haves": [],
  "tools_technologies": [],
  "domain": "",
  "seniority": "",
  "narrativepositioning": "",
  "resume_emphasis": [],
  "resume_deemphasis": [],
  "jdkeywords": [],
  "musthavekeywords": [],
  "riskykeywords": []
}

Field rules:
1. companyname — extract the company name if clearly stated. Otherwise return an empty string.
2. roletitle — use the exact role title or the closest explicit title in the JD.
3. companycontext — include only explicitly stated company/team/product/mission/culture/structure/working-style information. Otherwise return an empty string.
4. rolesummary — write 2 to 3 concise sentences describing what the role actually does day to day.
5. recruitersignal — state what the recruiter is really screening for beyond the title. Focus on the evidence a strong resume should show.
6. responsibilities — list the core responsibilities directly supported by the JD.
7. qualifications — list required qualifications, experience, education, or hard requirements explicitly stated.
8. musthaves — list the non-negotiable capabilities, traits, or experience implied by the JD.
9. nice_to_haves — list any preferred, optional, or bonus requirements explicitly mentioned.
10. tools_technologies — list tools, software, platforms, languages, systems, frameworks, or methods explicitly named in the JD.
11. domain — identify the industry, product area, or problem space clearly indicated by the JD.
12. seniority — infer only from explicit cues such as years of experience, ownership level, scope, team expectations, or manager/executive language. If unclear, return an empty string.
13. narrativepositioning — state the exact resume story this JD rewards. Explain what should be emphasized, how it should be framed, and what proof should be surfaced later in the tailored resume.
14. resume_emphasis — list the parts of a resume that should be made stronger or more visible for this role.
15. resume_deemphasis — list the parts that should be reduced, compressed, or given less weight because they are less relevant to this JD.
16. jdkeywords — extract high-signal keywords sourced only from the JD. Prioritize role-relevant nouns and verbs that help ATS and recruiter scanning.
17. musthavekeywords — include every keyword from INPUT 2, normalized for casing and spacing. Do not drop any.
18. riskykeywords — list terms that would feel too senior, too broad, unsupported, artificial, or misleading if forced into a tailored resume for this JD.

Output constraints:
- Keep all values evidence-based.
- Keep arrays concise and non-redundant.
- Use empty string for missing scalar fields.
- Use empty array for missing list fields.
- Do not add any extra keys.
- Do not wrap the output in explanations.
- Return JSON only.`;
}

// ── 2. Narrative Strategist user prompt (objects → JSON.stringify) ───────────

export interface NarrativeInput {
  maxgrowthpct: number;
  baseResumeHtml: string;
  jdintelligence: Record<string, any>;
  resumesections: Record<string, any>;
  parsermeta: Record<string, any>;
}

export function narrativeUser(input: NarrativeInput): string {
  const jd = input.jdintelligence || {};
  return `You are analyzing a parsed resume and JD-intelligence object inside an automated workflow.

Your task is to produce a narrative alignment plan for the resume.

Important:
- Focus only on narrative, framing, positioning, and emphasis.
- Do NOT perform keyword stuffing.
- Do NOT optimize for ATS matching.
- Do NOT suggest unsupported tools or technologies.
- Do NOT create misleading product, engineering, platform, API, pricing, growth, or AI ownership if the resume does not support it.
- If the target JD contains positioning that is not supported by the resume, recommend dropping or softening it.
- However, do not be unnecessarily strict: for PM and PM-adjacent roles, adjacent framing such as technical, systems-oriented, architecture-aware, cross-functional, workflow-driven, experimentation-led, or AI-fluent is acceptable if reasonably supported by the source resume.

Your job is to inspect the full resume and determine:
1. what narrative the current resume genuinely supports,
2. how that narrative should be repositioned for the target role,
3. where section-level framing should change,
4. what specific sentence-level edits should later be made,
5. which narratives should be avoided because they would overstate the candidate.

Use the following inputs.

NARRATIVE INPUT:
{
  "maxgrowthpct": ${JSON.stringify(input.maxgrowthpct)},
  "baseResumeHtml": ${JSON.stringify(input.baseResumeHtml)},
  "jdintelligence": ${JSON.stringify(input.jdintelligence)},
  "resumesections": ${JSON.stringify(input.resumesections)},
  "parsermeta": ${JSON.stringify(input.parsermeta)}
}

Interpret the fields as follows:
- maxgrowthpct: an optional ceiling for how aggressively framing can expand beyond current wording; use it as a soft caution signal, not a math rule.
- baseResumeHtml: full original resume template/content for extra narrative context.
- jdintelligence.companyname: target company.
- jdintelligence.roletitle: target role.
- jdintelligence.companycontext: business and market context.
- jdintelligence.rolesummary: high-level role scope.
- jdintelligence.recruitersignal: what kind of candidate the recruiter is actually seeking.
- jdintelligence.responsibilities: target job responsibilities.
- jdintelligence.qualifications: target qualifications.
- jdintelligence.musthaves: core traits or capabilities expected.
- jdintelligence.nice_to_haves: optional strengths.
- jdintelligence.seniority: target seniority.
- jdintelligence.narrativepositioning: ideal high-level story the resume should tell.
- jdintelligence.resume_emphasis: what the tailored resume should emphasize.
- jdintelligence.resume_deemphasis: what should be deemphasized.
- resumesections: source-of-truth content that you must stay faithful to.
- parsermeta.sectionLengths: rough section-length constraints; prefer reframing over adding new content.

Evaluation instructions:

A. First, determine the truthful center of gravity of the candidate profile.
B. Then define the narrative bridge: how the candidate can be positioned credibly for this role without lying, and which existing experiences can be reframed.
C. Then inspect each section (summary, experience, projects, skills, education) and recommend framing shifts only.
D. Produce precision edits. Each precision edit must quote an exact original sentence/bullet, explain the narrative issue, recommend a safer framing direction, give a rewrite instruction, explain why the change is truthful, and explain what overstatement risk must be avoided.
E. Apply hard constraints: no fabricated tools, ownership, product strategy authority, API/platform experience, pricing/onboarding/GTM ownership, customer ownership, or seniority inflation. Unsupported narrative elements must be marked for drop/soften/avoid.
F. Output requirements: return valid JSON only, no markdown, no code fences, no extra text, following the exact schema from the system prompt.

Now analyze this specific target:

Target company: ${jd.companyname ?? ''}
Target role: ${jd.roletitle ?? ''}
Target seniority: ${jd.seniority ?? ''}
Recruiter signal: ${jd.recruitersignal ?? ''}
Narrative positioning goal: ${jd.narrativepositioning ?? ''}
Resume emphasis guidance: ${JSON.stringify(jd.resume_emphasis ?? [])}
Resume deemphasis guidance: ${JSON.stringify(jd.resume_deemphasis ?? [])}

Use the actual section ids from resumesections.experience, resumesections.projects, and resumesections.education in your output.`;
}

// ── 3. Keyword Fit Planner user prompt ──────────────────────────────────────

export interface KeywordInput {
  keywordsraw: string[];
  maxgrowthpct: number;
  baseResumeHtml: string;
  jdintelligence: {
    tools_technologies: string[];
    jdkeywords: string[];
    musthavekeywords: string[];
    riskykeywords: string[];
  };
  resumesections: Record<string, any>;
  parsermeta: { sectionLengths: Record<string, any> };
}

export function keywordUser(input: KeywordInput): string {
  const jd = input.jdintelligence;
  return `Analyze the resume and job-keyword inputs below and create a keyword insertion plan according to the system rules.

IMPORTANT:
- Focus only on keywords, tools, technologies, and short keyword phrases.
- Do not rewrite the resume.
- Do not improve narrative.
- Do not produce revised bullets.
- Do not force hard tools or technologies that are not supported.
- Do not include keywords already present in the existing resume.
- Existing-keyword detection must be done only against the resume content.
- Do not use jdkeywords, musthavekeywords, tools_technologies, keywordsraw, or riskykeywords to decide whether a keyword is already present.
- Prioritize musthavekeywords first, then jdkeywords, then tools_technologies, then keywordsraw.
- Prefer the exact JD keyword or exact JD phrase whenever it can be inserted truthfully.
- Use maxgrowthpct as a soft cap for how aggressive the insertion plan should be.
- Output JSON only.

INPUTS

keywordsraw:
${JSON.stringify(input.keywordsraw)}

maxgrowthpct:
${input.maxgrowthpct}

jdintelligence.tools_technologies:
${JSON.stringify(jd.tools_technologies)}

jdintelligence.jdkeywords:
${JSON.stringify(jd.jdkeywords)}

jdintelligence.musthavekeywords:
${JSON.stringify(jd.musthavekeywords)}

jdintelligence.riskykeywords:
${JSON.stringify(jd.riskykeywords)}

resumesections:
${JSON.stringify(input.resumesections)}

parsermeta.sectionLengths:
${JSON.stringify(input.parsermeta.sectionLengths)}

baseResumeHtml:
${input.baseResumeHtml}

TASK
Follow the system rules. Build an internal inventory of keywords already present in the existing resume (using only resumesections and baseResumeHtml), merge the candidate keyword pools, remove already-present candidates, evaluate which exact JD terms can be inserted truthfully, reject misleading/unsupported/forced ones, assign each accepted keyword to the single best section, and explain the fit using only existing resume evidence.

OUTPUT FORMAT
Return JSON with exactly these top-level keys:
- decision_summary
- existing_keywords_filtered_out
- rejected_keywords
- section_insertions
- deferred_keywords`;
}

// ── 4. Section Refiner user prompt ──────────────────────────────────────────

export function sectionRefinerUser(
  item: { baseResumeHtml: string; sectionindex: number; totalsections: number; current_edit_object: SectionEditObject }
): string {
  const eo = item.current_edit_object;
  const cb = eo.charbudget;
  return `Rewrite the resume section identified below. Follow all rules in the system prompt exactly.

━━━ BASE RESUME HTML (read-only — reference for class/tag structure only) ━━━

${item.baseResumeHtml}

━━━ CHARACTER BUDGET — HARD CEILING — DO NOT EXCEED ━━━

${cb.instruction}

  Baseline (current visible chars):  ${cb.current}
  Hard ceiling (max visible chars):   ${cb.max}
  Upstream JSON-inflated measure:     ${cb.upstream_measure}
  ↑ upstream_measure is FOR REFERENCE ONLY. Your limit is the hard ceiling above.

━━━ FULL CURRENT EDIT OBJECT ━━━

${JSON.stringify(eo, null, 2)}

━━━ EXECUTION INSTRUCTIONS ━━━

TARGET SECTION: ${eo.section_id}
SECTION POSITION: ${item.sectionindex + 1} of ${item.totalsections}

Follow the system prompt's six execution steps in order:
  Step 1 — Lock in the character budget. Output MUST NOT exceed ${cb.max} visible characters
           (count only rendered text — no HTML tags, attribute values, class names, or hrefs).
  Step 2 — Absorb current_edit_object.sharedguidance (target story, tone, seniority, risks, allowed/disallowed moves).
  Step 3 — Apply current_edit_object.sectionplan (keep verbatim / shift only if supported / avoid as hard blocks).
  Step 4 — Insert current_edit_object.keywords (skip high risk, already-present, or no natural fit; prefer inline substitution).
  Step 5 — Write against current_edit_object.sourcecontent (factual ground truth; preserve metrics, dates, bullet counts).
  Step 6 — Self-verify visible char count ≤ ${cb.max} and bullet counts match sectionmeta before output.

━━━ OUTPUT ━━━

Return the rewritten HTML fragment for section_id = "${eo.section_id}".

Structural rules per section_id:
  "summary"    → <p class="summary">...</p> (one paragraph, no bullets, no wrappers)
  "experience" → <article class="entry">...</article> blocks; org/role/location/dates verbatim; only <li> text changes; bullet count per entry unchanged
  "projects"   → <article class="entry">...</article> blocks; org div = [title] <span class="pipe">|</span> <a href="[url]">View Prototype</a>; title/url/dates verbatim; only <li> text changes; bullet count per entry unchanged
  "skills"     → <p class="skill-line">...</p> lines (one per category); category labels unchanged; total visible chars ≤ ${cb.max}

Immutable across all sections:
  - All metrics, percentages, counts, and outcomes → verbatim
  - Bullet count per entry → exactly as in sectionmeta.bulletCounts
  - Prototype labels → never upgraded to live/shipped/scaled products

Return HTML fragment only. No markdown. No code fences. No commentary. No section wrappers (<section>, <h2>, etc.).`;
}
