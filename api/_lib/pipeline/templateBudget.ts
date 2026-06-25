// ============================================================================
// Per-point character budgets for the base template.
//
// base_resume.html is hand-calibrated to fill exactly one A4 page. We measure
// the longest bullet / line it contains per section and treat that as the hard
// ceiling for a single "point" — so when generation rewrites a section it can
// grow the section total (see makeCharBudget) but can never let one bullet
// balloon past what the one-pager can physically hold.
//
// Measured once from the live base_resume.html (via the existing parser) and
// cached, so it stays in sync if the template is tweaked.
// ============================================================================

import { loadBaseResumeTemplate } from '../resumeImport/template.js';
import { parseResumeHtml } from './parseResumeHtml.js';

export interface TemplateBulletBudget {
  /** Max visible chars for the summary paragraph (its single "point"). */
  summaryMaxChars: number;
  /** Max visible chars for any one experience bullet. */
  experienceMaxCharsPerBullet: number;
  /** Max visible chars for any one project bullet. */
  projectsMaxCharsPerBullet: number;
  /** Max visible chars for one skills line (category + its items). */
  skillsMaxCharsPerLine: number;
}

// Conservative fallbacks if the template can't be parsed for any reason. These
// mirror the calibrated lengths in the shipped base_resume.html.
const FALLBACK: TemplateBulletBudget = {
  summaryMaxChars: 400,
  experienceMaxCharsPerBullet: 230,
  projectsMaxCharsPerBullet: 230,
  skillsMaxCharsPerLine: 150,
};

let cached: TemplateBulletBudget | null = null;

function maxBulletLen(entries: Array<{ bullets?: string[] }>): number {
  let max = 0;
  for (const e of entries ?? []) {
    for (const b of e.bullets ?? []) {
      const len = String(b ?? '').trim().length;
      if (len > max) max = len;
    }
  }
  return max;
}

export function getBaseTemplateBudget(): TemplateBulletBudget {
  if (cached) return cached;
  try {
    const parsed = parseResumeHtml(loadBaseResumeTemplate());
    const s = parsed.resumesections;

    const skillsMax = Object.entries(s.skills ?? {}).reduce((max, [cat, items]) => {
      const line = `${cat.replace(/_/g, ' ')}: ${Array.isArray(items) ? items.join(', ') : ''}`;
      return Math.max(max, line.length);
    }, 0);

    cached = {
      summaryMaxChars: s.summary?.text?.length || FALLBACK.summaryMaxChars,
      experienceMaxCharsPerBullet: maxBulletLen(s.experience) || FALLBACK.experienceMaxCharsPerBullet,
      projectsMaxCharsPerBullet: maxBulletLen(s.projects) || FALLBACK.projectsMaxCharsPerBullet,
      skillsMaxCharsPerLine: skillsMax || FALLBACK.skillsMaxCharsPerLine,
    };
  } catch {
    cached = { ...FALLBACK };
  }
  return cached;
}

/** The per-point ceiling for a given section id (undefined = no per-point cap). */
export function perPointCapFor(sectionId: 'summary' | 'experience' | 'projects' | 'skills'): number {
  const b = getBaseTemplateBudget();
  switch (sectionId) {
    case 'summary': return b.summaryMaxChars;
    case 'experience': return b.experienceMaxCharsPerBullet;
    case 'projects': return b.projectsMaxCharsPerBullet;
    case 'skills': return b.skillsMaxCharsPerLine;
  }
}
