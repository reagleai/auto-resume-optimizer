// ============================================================================
// Shared types for the resume-tailoring pipeline.
// These mirror the data shapes that flowed between the original n8n nodes,
// linearised. `unknown`-ish bags (LLM plan objects) are kept loose on purpose —
// the prompts define their exact shape and downstream code reads defensively.
// ============================================================================

/** Raw request payload (profile + JD) — what the frontend POSTs to /api/generate. */
export interface GenerateInput {
  firstName: string;
  lastName: string;
  baseResumeHtml: string;
  jd: string;
  keywords: string;
  maxgrowthpct: number;
  companynamefallback: string;
  roletitlefallback: string;
}

/** The 18-field JD intelligence object (LLM-JD Extractor → normalized). */
export interface JdIntelligence {
  companyname: string;
  roletitle: string;
  companycontext: string;
  rolesummary: string;
  recruitersignal: string;
  responsibilities: string[];
  qualifications: string[];
  musthaves: string[];
  nice_to_haves: string[];
  tools_technologies: string[];
  domain: string;
  seniority: string;
  narrativepositioning: string;
  resume_emphasis: string[];
  resume_deemphasis: string[];
  jdkeywords: string[];
  musthavekeywords: string[];
  riskykeywords: string[];
}

// ── Parsed resume structure (Parse Resume HTML node) ─────────────────────────

export interface ResumeHeader {
  name: string;
  contact: string;
}

export interface ExperienceEntry {
  id: string;
  org: string;
  role: string;
  location: string;
  dates: string;
  bullets: string[];
}

export interface ProjectEntry {
  id: string;
  title: string;
  link: string;
  dates: string;
  bullets: string[];
}

export interface EducationEntry {
  id: string;
  text: string;
  dates: string;
}

export interface ResumeSections {
  header: ResumeHeader;
  summary: { text: string };
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: Record<string, string[]>;
  education: EducationEntry[];
}

export interface ParserMeta {
  sectionLengths: {
    summary: number;
    experience: number;
    projects: number;
    skills: number;
  };
}

export interface HtmlParseResult {
  resumesections: ResumeSections;
  parsermeta: ParserMeta;
  missingSections: string[];
  warnings: string[];
}

// ── Loose LLM plan bags ─────────────────────────────────────────────────────

export type NarrativePlan = Record<string, any>;
export type KeywordDecision = Record<string, any>;
export type SharedGuidance = Record<string, any>;

/** One section's edit object produced by splitSections, fed to the refiner. */
export interface SectionEditObject {
  section_id: 'summary' | 'experience' | 'projects' | 'skills';
  sharedguidance: SharedGuidance;
  sectionplan: any;
  keywords: any;
  sourcecontent: any;
  charbudget: {
    section_id: string;
    current: number;
    max: number;
    growthpct: number;
    upstream_measure: number | null;
    instruction: string;
  };
  sectionmeta: any;
}

/** One split item carrying a section edit object + shared context. */
export interface SplitItem {
  baseResumeHtml: string;
  maxgrowthpct: number;
  sectionindex: number;
  totalsections: number;
  firstName: string | null;
  lastName: string | null;
  companyname: string | null;
  roletitle: string | null;
  current_edit_object: SectionEditObject;
}

export interface RefinedSection {
  section_id: 'summary' | 'experience' | 'projects' | 'skills';
  html: string;
}

export interface AssembledResume {
  finalResumeHtml: string;
  filename: string;
  companyname: string;
  roletitle: string;
}

export interface PreparedPdf {
  htmlContent: string;
  pdfFilename: string;
  fitProfile: string;
}
