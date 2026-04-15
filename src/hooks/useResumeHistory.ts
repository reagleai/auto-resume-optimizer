import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { SavedResumeWithPdf, SaveResumePayload } from '@/types'

// ── Query Keys ───────────────────────────────────────────────────
export const HISTORY_QUERY_KEY = ['resume-history'] as const

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Sanitize strings for use in a storage file path.
 * Lowercase, spaces → dashes, strip special chars.
 */
function sanitizeForPath(...parts: string[]): string {
  return (
    parts
      .map((s) =>
        s
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
      )
      .filter(Boolean)
      .join('-') || 'resume'
  )
}

// ── Fetch all resumes (with joined PDF info) ─────────────────────

async function fetchResumeHistory(): Promise<SavedResumeWithPdf[]> {
  const { data, error } = await supabase
    .from('resume_history')
    .select(
      `
      id,
      created_at,
      company_name,
      role_title,
      filename,
      resume_html,
      format,
      job_description,
      keywords,
      resume_pdfs ( id, file_name, file_path, public_url, file_size_bytes )
    `
    )
    .order('created_at', { ascending: false })

  if (error) {
    if (import.meta.env.DEV) console.error('[useResumeHistory] Fetch error:', error)
    throw new Error('Failed to load resume history.')
  }

  return (data ?? []) as SavedResumeWithPdf[]
}

/**
 * Hook: fetch all saved resumes for the history page.
 */
export function useResumeHistoryQuery() {
  return useQuery({
    queryKey: HISTORY_QUERY_KEY,
    queryFn: fetchResumeHistory,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  })
}

// ── Save a generated resume ──────────────────────────────────────

async function saveResume(payload: SaveResumePayload): Promise<{ id: string }> {
  // Step 1: Insert row into resume_history
  const { data: row, error } = await supabase
    .from('resume_history')
    .insert({
      company_name: payload.companyName,
      role_title: payload.roleTitle,
      filename: payload.filename,
      resume_html: payload.resumeHtml,
      format: payload.format,
      job_description: payload.jobDescription,
      keywords: payload.keywords,
    })
    .select('id')
    .single()

  if (error) {
    if (import.meta.env.DEV) console.error('[saveResume] Insert error:', error)
    throw new Error('Failed to save resume to history.')
  }

  // Step 2: If PDF, upload blob to Storage → create resume_pdfs row
  if (payload.format === 'pdf' && payload.pdfBlob) {
    try {
      const filePath = `${Date.now()}-${sanitizeForPath(payload.companyName, payload.roleTitle)}.pdf`

      const { error: uploadError } = await supabase.storage
        .from('resume-pdfs')
        .upload(filePath, payload.pdfBlob, {
          contentType: 'application/pdf',
          upsert: false,
        })

      if (uploadError) {
        if (import.meta.env.DEV) console.error('[saveResume] Storage upload error:', uploadError)
        // Resume history row is saved — PDF upload is best-effort
        return row
      }

      const { data: urlData } = supabase.storage
        .from('resume-pdfs')
        .getPublicUrl(filePath)

      const { error: pdfRowError } = await supabase.from('resume_pdfs').insert({
        resume_history_id: row.id,
        file_name: payload.filename,
        file_path: filePath,
        public_url: urlData.publicUrl,
        file_size_bytes: payload.pdfBlob.size,
      })

      if (pdfRowError && import.meta.env.DEV) {
        console.error('[saveResume] PDF row insert error:', pdfRowError)
      }
    } catch (pdfErr) {
      // Non-fatal — resume_history row is already saved
      if (import.meta.env.DEV) console.error('[saveResume] PDF save error:', pdfErr)
    }
  }

  return row
}

/**
 * Hook: mutation to save a resume after generation.
 * Invalidates history cache on success.
 */
export function useSaveResumeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY })
    },
  })
}

// ── Delete a resume ──────────────────────────────────────────────

interface DeletePayload {
  id: string
  pdfFilePath?: string
}

async function deleteResume(payload: DeletePayload): Promise<void> {
  // Step 1: If a PDF file exists, delete from Storage FIRST
  if (payload.pdfFilePath) {
    const { error: storageError } = await supabase.storage
      .from('resume-pdfs')
      .remove([payload.pdfFilePath])

    if (storageError) {
      if (import.meta.env.DEV) console.error('[deleteResume] Storage delete error:', storageError)
      throw new Error('Failed to delete PDF file. Resume was not deleted.')
    }
  }

  // Step 2: Delete resume_history row (CASCADE auto-deletes resume_pdfs row)
  const { error } = await supabase.from('resume_history').delete().eq('id', payload.id)

  if (error) {
    if (import.meta.env.DEV) console.error('[deleteResume] DB delete error:', error)
    throw new Error('Failed to delete resume from history.')
  }
}

/**
 * Hook: mutation to delete a resume with optimistic cache removal.
 * Storage file is deleted BEFORE the database row.
 * On failure, the optimistic removal is rolled back.
 */
export function useDeleteResumeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteResume,

    onMutate: async (payload) => {
      // Cancel in-flight fetches
      await queryClient.cancelQueries({ queryKey: HISTORY_QUERY_KEY })

      // Snapshot current cache for rollback
      const previous = queryClient.getQueryData<SavedResumeWithPdf[]>(HISTORY_QUERY_KEY)

      // Optimistically remove the item
      queryClient.setQueryData<SavedResumeWithPdf[]>(HISTORY_QUERY_KEY, (old) =>
        old?.filter((item) => item.id !== payload.id) ?? []
      )

      return { previous }
    },

    onError: (_err, _payload, context) => {
      // Rollback on failure
      if (context?.previous) {
        queryClient.setQueryData(HISTORY_QUERY_KEY, context.previous)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY })
    },
  })
}
