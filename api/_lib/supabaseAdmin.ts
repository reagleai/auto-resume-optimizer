// ============================================================================
// Server-side Supabase client (service role).
//
// Used only inside Vercel functions. The service-role key bypasses RLS and
// must NEVER be exposed to the browser — it is read from a non-VITE env var.
// ============================================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error('SUPABASE_URL is not set.');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.');

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export const PDF_BUCKET = 'resumatch-pdfs';
