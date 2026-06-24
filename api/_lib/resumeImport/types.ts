export interface ImportedContactItem {
  text: string;
  href: string;
}

export interface ImportedExperience {
  organization: string;
  role: string;
  location: string;
  dates: string;
  bullets: string[];
}

export interface ImportedProject {
  title: string;
  link: string;
  linkLabel: string;
  dates: string;
  bullets: string[];
}

export interface ImportedSkillGroup {
  category: string;
  items: string[];
}

export interface ImportedEducation {
  institution: string;
  detail: string;
  dates: string;
}

export interface ImportedResumeData {
  name: string;
  contact: ImportedContactItem[];
  summary: string;
  experience: ImportedExperience[];
  projects: ImportedProject[];
  skills: ImportedSkillGroup[];
  education: ImportedEducation[];
}

export interface ResumeImportAudit {
  pass: number;
  missingFacts: string[];
  unsupportedFacts: string[];
  correctionsMade: string[];
  confidence: number;
}

export interface ResumeImportResult {
  firstName: string;
  lastName: string;
  baseResumeHtml: string;
  data: ImportedResumeData;
  audits: ResumeImportAudit[];
}

/** A stage the import pipeline is entering, reported via onProgress. */
export type ResumeImportStage = 'extract' | 'audit' | 'render';

export interface ResumeImportProgress {
  stage: ResumeImportStage;
  /** Present for the 'audit' stage: which review pass is starting (1-based). */
  pass?: number;
  totalPasses: number;
}
