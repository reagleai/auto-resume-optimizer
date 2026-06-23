export interface ProfileState {
  firstName: string;
  lastName: string;
  baseResumeHtml: string;
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

/** Payload POSTed to the backend /api/generate endpoint. */
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

export type JobStatus = 'queued' | 'processing' | 'complete' | 'error';

/** Final pipeline output stored on a completed job. */
export interface JobResult {
  filename: string;
  companyname: string;
  roletitle: string;
  pdf_url: string;
  history_id: string;
  format: 'pdf';
}

/** Shape returned by GET /api/jobs/:id. */
export interface Job {
  jobId: string;
  status: JobStatus;
  step: number;
  stage: string;
  result: JobResult | null;
  error: string | null;
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
