// ============================================================================
// POST /api/waitlist
// Replaces the n8n early-access webhook → Google Sheets. Inserts a signup into
// resumatch_waitlist. Body shape matches the landing form's existing payload.
// ============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminClient } from './_lib/supabaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email is required.' });
    }

    const prefs = body.preferences ?? {};
    const supa = getAdminClient();
    const { error } = await supa.from('resumatch_waitlist').insert({
      email,
      must_have_keywords: prefs.mustHaveKeywords != null ? String(prefs.mustHaveKeywords) : null,
      aggressive_reframing: prefs.aggressiveReframing != null ? String(prefs.aggressiveReframing) : null,
      source: typeof body.source === 'string' ? body.source : 'resumatch-waitlist',
    });
    if (error) throw new Error(error.message);

    return res.status(201).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to join waitlist.';
    return res.status(500).json({ error: message });
  }
}
