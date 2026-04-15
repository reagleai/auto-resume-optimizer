export interface ProfileState {
  firstName: string;
  lastName: string;
  baseResumeHtml: string;
  webhookUrl: string;
  maxgrowthpct: number;
  companynamefallback: string;
  roletitlefallback: string;
}

export type GeneratorStatus = 'idle' | 'loading' | 'success' | 'error';

export interface GeneratorState {
  jd: string;
  keywords: string;
  status: GeneratorStatus;
  loadingStep: number;
  result: GeneratorResult | null;
  error: string | null;
}

export interface GeneratorResult {
  html: string;
  filename: string;
  companyname: string;
  roletitle: string;
  timestamp: Date;
  format: 'html' | 'pdf';
  pdfBlobUrl?: string;
}

export interface HistoryEntry {
  id: string;
  runNumber: number;
  timestamp: Date;
  companyname: string;
  roletitle: string;
  filename: string;
  html: string;
  format: 'html' | 'pdf';
  pdfBlobUrl?: string;
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export interface LoadingStep {
  icon: string;
  label: string;
  duration: number;
}

export type Theme = 'light' | 'dark';

export interface WebhookPayload {
  firstName: string;
  lastName: string;
  baseResumeHtml: string;
  jd: string;
  keywords: string;
  maxgrowthpct: number;
  companynamefallback: string;
  roletitlefallback: string;
  templateVersion: 'v1-html-json';
}

export interface WebhookResponse {
  baseResumeHtml?: string;
  htmlContent?: string;
  finalResumeHtml?: string;
  filename?: string;
  pdfFilename?: string;
  companyname?: string;
  roletitle?: string;
}

// ── Supabase: resume_history + resume_pdfs ─────────────────────

/** Row shape from the resume_pdfs table */
export interface SavedResumePdf {
  id: string;
  file_name: string;
  file_path: string;
  public_url: string;
  file_size_bytes: number;
}

/** Row shape from the resume_history table (with joined PDF data) */
export interface SavedResumeWithPdf {
  id: string;
  created_at: string;
  company_name: string;
  role_title: string;
  filename: string;
  resume_html: string;
  format: 'html' | 'pdf';
  job_description: string;
  keywords: string;
  resume_pdfs: SavedResumePdf[];
}

/** Payload for saving a generated resume to Supabase */
export interface SaveResumePayload {
  companyName: string;
  roleTitle: string;
  filename: string;
  resumeHtml: string;
  format: 'html' | 'pdf';
  jobDescription: string;
  keywords: string;
  pdfBlob?: Blob;
}
