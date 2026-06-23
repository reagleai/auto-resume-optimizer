// ============================================================================
// Stage 6 — Section splitter.
// Port of the n8n "Section Splitter" node. Produces one edit object per section
// with a plain-text char budget and structural metadata. Throws if the
// completeness check failed (matches original guard).
// ============================================================================

import type { StrategyResult } from './assembleStrategy.js';
import type { SplitItem, SectionEditObject } from './types.js';

function pt(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function summaryPlainLen(content: any): number {
  return pt(content?.text).length;
}
function experiencePlainLen(entries: any[]): number {
  if (!Array.isArray(entries)) return 0;
  return entries.reduce((sum, e) => {
    const head = pt(e.org).length + pt(e.role).length + pt(e.location).length + pt(e.dates).length;
    const bullets = Array.isArray(e.bullets) ? e.bullets.reduce((s: number, b: any) => s + pt(b).length, 0) : 0;
    return sum + head + bullets;
  }, 0);
}
function projectsPlainLen(entries: any[]): number {
  if (!Array.isArray(entries)) return 0;
  return entries.reduce((sum, e) => {
    const head = pt(e.title).length + pt(e.dates).length;
    const bullets = Array.isArray(e.bullets) ? e.bullets.reduce((s: number, b: any) => s + pt(b).length, 0) : 0;
    return sum + head + bullets;
  }, 0);
}
function skillsPlainLen(skills: Record<string, any>): number {
  if (!skills || typeof skills !== 'object') return 0;
  return Object.entries(skills).reduce((sum, [cat, items]) => {
    const label = cat.replace(/_/g, ' ');
    const vals = Array.isArray(items) ? items.join(', ') : '';
    return sum + label.length + vals.length;
  }, 0);
}

function makeCharBudget(section_id: string, currentChars: number, pct: number, upstream: number | null) {
  const max = Math.floor(currentChars * (1 + pct / 100));
  return {
    section_id,
    current: currentChars,
    max,
    growthpct: pct,
    upstream_measure: upstream,
    instruction:
      `Your rewritten "${section_id}" section must not exceed ${max} visible characters ` +
      `(baseline: ${currentChars} chars, allowed growth: ${pct}%). ` +
      `Count only rendered text — no HTML tags, no JSON punctuation. ` +
      `If you cannot fit all edits within the budget, prioritise: ` +
      `(1) shift/reframe bullets over adding new ones, ` +
      `(2) keyword insertions inline over appending new sentences, ` +
      `(3) trim the lowest-priority bullets last.`,
  };
}

function experienceMeta(entries: any[]) {
  if (!Array.isArray(entries)) return { type: 'list', entryCount: 0, bulletCounts: {}, perEntry: [] };
  return {
    type: 'list',
    entryCount: entries.length,
    bulletCounts: Object.fromEntries(entries.map((e) => [e.id, Array.isArray(e.bullets) ? e.bullets.length : 0])),
    perEntry: entries.map((e) => ({
      id: e.id,
      org: pt(e.org),
      role: pt(e.role),
      bulletCount: Array.isArray(e.bullets) ? e.bullets.length : 0,
      bulletCharLengths: Array.isArray(e.bullets)
        ? e.bullets.map((b: any, i: number) => ({ bulletIndex: i, chars: pt(b).length }))
        : [],
    })),
  };
}
function projectsMeta(entries: any[]) {
  if (!Array.isArray(entries)) return { type: 'list', entryCount: 0, bulletCounts: {}, perEntry: [] };
  return {
    type: 'list',
    entryCount: entries.length,
    bulletCounts: Object.fromEntries(entries.map((e) => [e.id, Array.isArray(e.bullets) ? e.bullets.length : 0])),
    perEntry: entries.map((e) => ({
      id: e.id,
      title: pt(e.title),
      bulletCount: Array.isArray(e.bullets) ? e.bullets.length : 0,
      bulletCharLengths: Array.isArray(e.bullets)
        ? e.bullets.map((b: any, i: number) => ({ bulletIndex: i, chars: pt(b).length }))
        : [],
    })),
  };
}
function skillsMeta(skills: Record<string, any>) {
  if (!skills || typeof skills !== 'object') return { type: 'object', categoryCount: 0, totalItems: 0, perCategory: {} };
  const perCategory: Record<string, any> = {};
  let totalItems = 0;
  for (const [cat, items] of Object.entries(skills)) {
    const count = Array.isArray(items) ? items.length : 0;
    perCategory[cat] = { itemCount: count, chars: Array.isArray(items) ? items.join(', ').length : 0 };
    totalItems += count;
  }
  return { type: 'object', categoryCount: Object.keys(skills).length, totalItems, perCategory };
}

export function splitSections(strategy: StrategyResult): SplitItem[] {
  if (!strategy.completenesscheck?.allSectionsPresent) {
    const missing = Object.entries(strategy.completenesscheck ?? {})
      .filter(([k, v]) => k !== 'allSectionsPresent' && (v as any)?.present === false)
      .map(([k]) => k);
    throw new Error(`[section-splitter] Completeness check failed. Missing: ${JSON.stringify(missing)}`);
  }

  const { sharedguidance, resumecontent, sectionedits, baseResumeHtml, meta } = strategy;
  const maxgrowthpct = meta?.maxgrowthpct ?? 8;
  const upstreamLengths = meta?.parsermeta?.sectionLengths ?? ({} as Record<string, number>);

  const lens = {
    summary: summaryPlainLen(resumecontent.summary),
    experience: experiencePlainLen(resumecontent.experience),
    projects: projectsPlainLen(resumecontent.projects),
    skills: skillsPlainLen(resumecontent.skills),
  };

  const defs: Array<{ section_id: SectionEditObject['section_id']; sourcecontent: any; sectionmeta: any; len: number }> = [
    { section_id: 'summary', sourcecontent: resumecontent.summary, sectionmeta: { type: 'scalar', chars: lens.summary }, len: lens.summary },
    { section_id: 'experience', sourcecontent: resumecontent.experience, sectionmeta: experienceMeta(resumecontent.experience), len: lens.experience },
    { section_id: 'projects', sourcecontent: resumecontent.projects, sectionmeta: projectsMeta(resumecontent.projects), len: lens.projects },
    { section_id: 'skills', sourcecontent: resumecontent.skills, sectionmeta: skillsMeta(resumecontent.skills), len: lens.skills },
  ];

  return defs.map((def, idx) => ({
    baseResumeHtml,
    maxgrowthpct,
    sectionindex: idx,
    totalsections: defs.length,
    firstName: strategy.firstName,
    lastName: strategy.lastName,
    companyname: strategy.companyname,
    roletitle: strategy.roletitle,
    current_edit_object: {
      section_id: def.section_id,
      sharedguidance,
      sectionplan: (sectionedits as any)[def.section_id].sectionplan,
      keywords: (sectionedits as any)[def.section_id].keywordsectioninsertions,
      sourcecontent: def.sourcecontent,
      charbudget: makeCharBudget(def.section_id, def.len, maxgrowthpct, upstreamLengths[def.section_id] ?? null),
      sectionmeta: def.sectionmeta,
    },
  }));
}
