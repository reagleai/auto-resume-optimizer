import type {
  ImportedContactItem,
  ImportedEducation,
  ImportedExperience,
  ImportedProject,
  ImportedResumeData,
  ImportedSkillGroup,
  ResumeImportAudit,
} from './types.js';

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function strings(value: unknown): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of array(value)) {
    const clean = text(item);
    const key = clean.toLowerCase();
    if (!clean || seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
  }
  return result;
}

function contacts(value: unknown): ImportedContactItem[] {
  return array(value).map((item) => {
    if (typeof item === 'string') return { text: text(item), href: '' };
    const row = object(item);
    return {
      text: text(row.text ?? row.label ?? row.value),
      href: text(row.href ?? row.url),
    };
  }).filter((item) => item.text);
}

function experiences(value: unknown): ImportedExperience[] {
  return array(value).map((item) => {
    const row = object(item);
    return {
      organization: text(row.organization ?? row.org ?? row.company),
      role: text(row.role ?? row.title),
      location: text(row.location),
      dates: text(row.dates ?? row.date),
      bullets: strings(row.bullets ?? row.highlights),
    };
  }).filter((item) => item.organization || item.role || item.bullets.length);
}

function projects(value: unknown): ImportedProject[] {
  return array(value).map((item) => {
    const row = object(item);
    return {
      title: text(row.title ?? row.name),
      link: text(row.link ?? row.url),
      linkLabel: text(row.linkLabel ?? row.link_label) || 'View Project',
      dates: text(row.dates ?? row.date),
      bullets: strings(row.bullets ?? row.highlights),
    };
  }).filter((item) => item.title || item.bullets.length);
}

function skills(value: unknown): ImportedSkillGroup[] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>)
      .map(([category, items]) => ({ category: text(category), items: strings(items) }))
      .filter((group) => group.category && group.items.length);
  }

  return array(value).map((item) => {
    const row = object(item);
    return {
      category: text(row.category ?? row.label),
      items: strings(row.items ?? row.skills),
    };
  }).filter((group) => group.category && group.items.length);
}

function education(value: unknown): ImportedEducation[] {
  return array(value).map((item) => {
    const row = object(item);
    return {
      institution: text(row.institution ?? row.school ?? row.organization),
      detail: text(row.detail ?? row.degree ?? row.program),
      dates: text(row.dates ?? row.date),
    };
  }).filter((item) => item.institution || item.detail);
}

export function normalizeImportedResume(value: unknown): ImportedResumeData {
  const outer = object(value);
  const row = object(outer.resume ?? outer.data ?? outer);
  return {
    name: text(row.name ?? row.fullName ?? row.full_name),
    contact: contacts(row.contact ?? row.contacts),
    summary: text(row.summary ?? row.profile),
    experience: experiences(row.experience ?? row.workExperience ?? row.work_experience),
    projects: projects(row.projects),
    skills: skills(row.skills),
    education: education(row.education),
  };
}

export function validateImportedResume(data: ImportedResumeData): string[] {
  const errors: string[] = [];
  if (!data.name) errors.push('name');
  if (!data.contact.length) errors.push('contact');
  if (!data.summary) errors.push('summary');
  if (!data.experience.length && !data.projects.length) errors.push('experience_or_projects');
  if (!data.skills.length) errors.push('skills');
  return errors;
}

export function normalizeAudit(value: unknown, pass: number): ResumeImportAudit {
  const row = object(value);
  const rawConfidence = Number(row.confidence);
  return {
    pass,
    missingFacts: strings(row.missingFacts ?? row.missing_facts),
    unsupportedFacts: strings(row.unsupportedFacts ?? row.unsupported_facts),
    correctionsMade: strings(row.correctionsMade ?? row.corrections_made),
    confidence: Number.isFinite(rawConfidence)
      ? Math.max(0, Math.min(1, rawConfidence))
      : 0,
  };
}

export function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] ?? '', lastName: '' };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}
