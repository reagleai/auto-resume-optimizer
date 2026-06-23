// ============================================================================
// Stage 5 — Strategic assembly.
// Linearised port of n8n "Parse Strategic Planner Output" + "Resume LLM Content
// Optimizer". Because the data arrives directly (no Append-mode merges), the
// fragile Object.assign key-collision logic (F-03/F-04/F-14) is gone — we read
// each source object explicitly.
//
// Output shape is exactly what splitSections() consumes.
// ============================================================================

import type {
  NarrativePlan,
  KeywordDecision,
  ResumeSections,
  ParserMeta,
  SharedGuidance,
} from './types.js';

function clone<T>(v: T): T {
  return v === undefined ? v : JSON.parse(JSON.stringify(v));
}
function arr<T>(v: T | T[] | null | undefined): T[] {
  return Array.isArray(v) ? v : v == null ? [] : [v];
}

// ── Keyword insertion grouping + slimming (from Content Optimizer) ───────────

interface SlimKeyword {
  keyword: any;
  fit_type: any;
  insertion_hint: any;
  risk_level: any;
}
interface SlimInsertion {
  section_id: any;
  section_label: any;
  insertion_priority: any;
  keywords: SlimKeyword[];
}

function slimEntry(entry: any): SlimInsertion {
  return {
    section_id: entry?.section_id,
    section_label: entry?.section_label,
    insertion_priority: entry?.insertion_priority,
    keywords: (entry?.accepted_keywords ?? []).map((kw: any) => ({
      keyword: kw.keyword,
      fit_type: kw.fit_type,
      insertion_hint: kw.insertion_hint,
      risk_level: kw.risk_level,
    })),
  };
}

export interface StrategyResult {
  sharedguidance: SharedGuidance;
  firstName: string | null;
  lastName: string | null;
  companyname: string | null;
  roletitle: string | null;
  resumecontent: {
    header: ResumeSections['header'];
    summary: ResumeSections['summary'];
    experience: ResumeSections['experience'];
    projects: ResumeSections['projects'];
    skills: ResumeSections['skills'];
    education: ResumeSections['education'];
  };
  sectionedits: {
    summary: { sectionplan: any; keywordsectioninsertions: any };
    experience: { sectionplan: any; keywordsectioninsertions: any };
    projects: { sectionplan: any; keywordsectioninsertions: any };
    skills: { sectionplan: any; keywordsectioninsertions: any };
  };
  baseResumeHtml: string;
  meta: { maxgrowthpct: number; parsermeta: ParserMeta };
  completenesscheck: Record<string, any> & { allSectionsPresent: boolean };
}

export function assembleStrategy(input: {
  parsednarrative: NarrativePlan;
  keyworddecision: KeywordDecision;
  resumesections: ResumeSections;
  parsermeta: ParserMeta;
  maxgrowthpct: number;
  baseResumeHtml: string;
  firstName: string;
  lastName: string;
  companyname: string;
  roletitle: string;
}): StrategyResult {
  const narrative = input.parsednarrative ?? {};
  const keyword = input.keyworddecision ?? {};
  const resumeSections = input.resumesections;

  const narrativeAssessment = narrative.narrative_assessment ?? {};
  const globalGuidance = narrative.global_guidance ?? {};
  const sectionPlans = narrative.section_plans ?? {};
  const finalNarrativeRules = narrative.final_narrative_rules ?? {};

  const sectionInsertions = arr<any>(keyword.section_insertions);

  function groupInsertionsByType(sectionType: string): SlimInsertion[] {
    return sectionInsertions
      .filter((item) => (item?.section_type ?? '').toLowerCase() === sectionType.toLowerCase())
      .map(slimEntry);
  }
  function groupInsertionsById(sectionType: string): Record<string, SlimInsertion[]> {
    const grouped: Record<string, SlimInsertion[]> = {};
    for (const item of sectionInsertions) {
      if ((item?.section_type ?? '').toLowerCase() !== sectionType.toLowerCase()) continue;
      const key = item.section_id || item.section_label || 'unknown';
      (grouped[key] ||= []).push(slimEntry(item));
    }
    return grouped;
  }

  // ── Section-plan normalisers (snake_case from the LLM) ─────────────────────
  function normalizeSummaryPlan(p: any) {
    p = p ?? {};
    return {
      keep: clone(p.keep ?? []),
      shift: clone(p.shift ?? []),
      avoid: clone(p.avoid ?? []),
      edit_intent: p.edit_intent ?? null,
      risk_notes: clone(p.risk_notes ?? []),
    };
  }
  function normalizeListPlans(raw: any) {
    return arr<any>(raw).map((p) => ({
      id: p?.id ?? null,
      current_positioning: p?.current_positioning ?? null,
      target_positioning: p?.target_positioning ?? null,
      keep: clone(p?.keep ?? []),
      shift: clone(p?.shift ?? []),
      avoid: clone(p?.avoid ?? []),
      edit_intent: p?.edit_intent ?? null,
      risk_notes: clone(p?.risk_notes ?? []),
    }));
  }
  function normalizeSkillsPlan(p: any) {
    p = p ?? {};
    return {
      keep: clone(p.keep ?? []),
      soften: clone(p.soften ?? []),
      avoid: clone(p.avoid ?? []),
      edit_intent: p.edit_intent ?? null,
      risk_notes: clone(p.risk_notes ?? []),
    };
  }

  const sharedguidance: SharedGuidance = {
    current_core_story: clone(narrativeAssessment.current_core_story ?? null),
    target_positioning_story: clone(narrativeAssessment.target_positioning_story ?? null),
    top_alignment_thesis: clone(narrativeAssessment.top_alignment_thesis ?? null),
    confidence: clone(narrativeAssessment.confidence ?? null),
    global_guidance: {
      what_to_emphasize: clone(globalGuidance.what_to_emphasize ?? []),
      what_to_soften: clone(globalGuidance.what_to_soften ?? []),
      what_to_avoid: clone(globalGuidance.what_to_avoid ?? []),
    },
    narrative_risks: clone(globalGuidance.narrative_risks ?? []),
    tone_shift: clone(globalGuidance.tone_shift ?? null),
    seniority_calibration: clone(globalGuidance.seniority_calibration ?? null),
    final_narrative_rules: {
      allowed_moves: clone(finalNarrativeRules.allowed_moves ?? []),
      disallowed_moves: clone(finalNarrativeRules.disallowed_moves ?? []),
      adjacent_but_safe_positioning: clone(finalNarrativeRules.adjacent_but_safe_positioning ?? []),
      drop_if_unsupported: clone(finalNarrativeRules.drop_if_unsupported ?? []),
    },
  };

  const sectionedits = {
    summary: {
      sectionplan: normalizeSummaryPlan(sectionPlans.summary),
      keywordsectioninsertions: groupInsertionsByType('summary'),
    },
    experience: {
      sectionplan: normalizeListPlans(sectionPlans.experience ?? []),
      keywordsectioninsertions: groupInsertionsById('experience'),
    },
    projects: {
      sectionplan: normalizeListPlans(sectionPlans.projects ?? []),
      keywordsectioninsertions: groupInsertionsById('projects'),
    },
    skills: {
      sectionplan: normalizeSkillsPlan(sectionPlans.skills),
      keywordsectioninsertions: groupInsertionsByType('skills'),
    },
  };

  const resumecontent = {
    header: resumeSections.header,
    summary: resumeSections.summary,
    experience: resumeSections.experience ?? [],
    projects: resumeSections.projects ?? [],
    skills: resumeSections.skills,
    education: resumeSections.education ?? [],
  };

  const completenesscheck: Record<string, any> = {
    header: { present: !!(resumecontent.header?.name && resumecontent.header?.contact) },
    summary: { present: !!resumecontent.summary?.text },
    experience: { present: resumecontent.experience.length > 0, count: resumecontent.experience.length },
    projects: { present: resumecontent.projects.length > 0, count: resumecontent.projects.length },
    skills: { present: !!resumecontent.skills && Object.keys(resumecontent.skills).length > 0 },
    education: { present: resumecontent.education.length > 0, count: resumecontent.education.length },
    baseHtml: { present: !!input.baseResumeHtml },
  };
  completenesscheck.allSectionsPresent =
    completenesscheck.header.present &&
    completenesscheck.summary.present &&
    (completenesscheck.experience.present || completenesscheck.projects.present) &&
    completenesscheck.skills.present &&
    completenesscheck.baseHtml.present;

  return {
    sharedguidance,
    firstName: input.firstName || null,
    lastName: input.lastName || null,
    companyname: input.companyname || null,
    roletitle: input.roletitle || null,
    resumecontent,
    sectionedits,
    baseResumeHtml: input.baseResumeHtml,
    meta: { maxgrowthpct: input.maxgrowthpct, parsermeta: input.parsermeta },
    completenesscheck: completenesscheck as StrategyResult['completenesscheck'],
  };
}
