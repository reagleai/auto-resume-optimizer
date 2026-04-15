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
