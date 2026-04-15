import { useCallback, useRef } from 'react'
import { useAppStore } from '@/store/appStore'
import { useToast } from '@/hooks/useToast'
import { WEBHOOK_TIMEOUT_MS } from '@/lib/constants'
import type { WebhookPayload, WebhookResponse } from '@/types'

/** Minimum time between consecutive webhook calls (ms) */
const COOLDOWN_MS = 5000

/**
 * Validate that a webhook URL is safe to call.
 * Enforces HTTPS and blocks private/internal network addresses.
 */
function validateWebhookUrl(urlStr: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlStr)

    // Enforce HTTPS only
    if (url.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTPS webhook URLs are supported for secure data transmission.' }
    }

    // Block private/internal IPs
    const hostname = url.hostname
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      hostname.startsWith('169.254.') ||
      hostname === 'metadata.google.internal'
    ) {
      return { valid: false, error: 'Private or internal network URLs are not allowed.' }
    }

    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid URL format.' }
  }
}

/**
 * Hook encapsulating the webhook call sequence.
 * Handles both JSON (legacy) and PDF binary responses.
 * Returns { generate, abort } functions.
 */
export function useWebhook() {
  const { toast } = useToast()
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastCallRef = useRef<number>(0)

  const generate = useCallback(async () => {
    const store = useAppStore.getState()
    const { profile, generator } = store

    // Validate profile
    if (!store.isProfileComplete()) {
      toast('Profile incomplete. Please fill your profile before generating.', 'error')
      return
    }

    // Validate JD
    if (!generator.jd.trim()) {
      toast('Please enter a job description.', 'error')
      return
    }

    // Rate limiting / cooldown
    const now = Date.now()
    if (now - lastCallRef.current < COOLDOWN_MS) {
      toast('Please wait a few seconds between generations.', 'info')
      return
    }
    lastCallRef.current = now

    // Validate webhook URL
    const urlCheck = validateWebhookUrl(profile.webhookUrl)
    if (!urlCheck.valid) {
      toast(urlCheck.error || 'Invalid webhook URL.', 'error')
      return
    }

    // Set loading status
    store.setGeneratorStatus('loading')
    store.setLoadingStep(0)

    // Build payload
    const payload: WebhookPayload = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      baseResumeHtml: profile.baseResumeHtml,
      jd: generator.jd,
      keywords: generator.keywords,
      maxgrowthpct: profile.maxgrowthpct,
      companynamefallback: profile.companynamefallback,
      roletitlefallback: profile.roletitlefallback,
      templateVersion: 'v1-html-json',
    }

    // Create AbortController with timeout
    const controller = new AbortController()
    abortControllerRef.current = controller
    const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS)

    try {
      const res = await fetch(profile.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new Error(`Webhook returned HTTP ${res.status}`)
      }

      const timestamp = new Date()

      // ── Read entire response as blob, then detect format ────────
      const blob = await res.blob()
      const headerBytes = await blob.slice(0, 4).text()
      const isPdf = headerBytes.startsWith('%PDF')
      const contentType = (res.headers.get('Content-Type') || '').toLowerCase()
      const isPdfByHeader = contentType.includes('application/pdf')

      // ── Read custom headers from n8n (exposed via Access-Control-Expose-Headers) ──
      const headerFilename = res.headers.get('X-Filename') || ''
      const headerCompany = res.headers.get('X-Company') || ''
      const headerRole = res.headers.get('X-Roletitle') || ''

      // Resolve metadata: prefer n8n headers → then profile fallbacks
      const companyname = headerCompany || profile.companynamefallback || 'Company'
      const roletitle = headerRole || profile.roletitlefallback || 'Role'

      if (isPdf || isPdfByHeader) {
        // ── PDF binary response ──────────────────────────────────
        const pdfBlobUrl = URL.createObjectURL(blob)

        // Filename: prefer n8n header → Content-Disposition → build from profile
        let filename = headerFilename
        if (!filename) {
          const disposition = res.headers.get('Content-Disposition') || ''
          const match = disposition.match(/filename[*]?=["']?(?:UTF-8'')?([^"';\n]+)/i)
          if (match?.[1]) filename = decodeURIComponent(match[1].trim())
        }
        if (!filename) {
          const name = [profile.firstName, profile.lastName].filter(s => s?.trim()).join('_') || 'Resume'
          filename = [name, roletitle, companyname].filter(Boolean).join('_').replace(/[\\/:*?"<>|]+/g, '_') + '.pdf'
        }

        // Set result
        store.setGeneratorResult({
          html: '',
          filename,
          companyname,
          roletitle,
          timestamp,
          format: 'pdf',
          pdfBlobUrl,
        })

        // Add to history
        store.addHistoryEntry({
          timestamp,
          companyname,
          roletitle,
          filename,
          html: '',
          format: 'pdf',
          pdfBlobUrl,
        })

        toast(`Resume PDF generated for ${roletitle} at ${companyname} ✓`, 'success')
      } else {
        // ── JSON response (legacy format) ────────────────────────
        const text = await blob.text()
        let data: WebhookResponse
        try {
          data = JSON.parse(text) as WebhookResponse
        } catch {
          throw new Error('Received a response but couldn\u2019t parse it. The workflow may need a \u201CRespond to Webhook\u201D node configured.')
        }

        // Validate response — accept multiple key names from n8n
        const html = data.htmlContent || data.finalResumeHtml || data.baseResumeHtml
        if (!html) {
          throw new Error('Missing resume HTML in response. Got keys: ' + Object.keys(data).join(', '))
        }

        const fname = data.pdfFilename || data.filename || 'tailored-resume.html'
        const cname = data.companyname || companyname
        const rtitle = data.roletitle || roletitle

        // Set result
        store.setGeneratorResult({
          html,
          filename: fname,
          companyname: cname,
          roletitle: rtitle,
          timestamp,
          format: 'html',
        })

        // Add to history
        store.addHistoryEntry({
          timestamp,
          companyname: cname,
          roletitle: rtitle,
          filename: fname,
          html,
          format: 'html',
        })

        toast(`Resume tailored for ${rtitle} at ${cname} ✓`, 'success')
      }
    } catch (err: unknown) {
      const error = err as Error
      if (error.name === 'AbortError') {
        store.setGeneratorError('The workflow took too long to respond. n8n may be processing. Check your email for the result, or try again.')
        toast('Generation timed out', 'error')
      } else {
        const msg = error.message || 'An unexpected error occurred.'
        store.setGeneratorError(msg)
        toast(`Generation failed: ${msg.substring(0, 80)}`, 'error')
      }
    } finally {
      clearTimeout(timeoutId)
      abortControllerRef.current = null
    }
  }, [toast])

  const abort = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  return { generate, abort }
}
