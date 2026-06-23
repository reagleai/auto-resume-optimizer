import { useState, useMemo, useEffect, useRef, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { CheckCircle, ChevronDown, FileText, Upload } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useToast } from '@/hooks/useToast'
import { useProfileQuery, useProfileMutation } from '@/hooks/useProfile'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { extractTextFromPDF } from '@/lib/pdfExtractor'
import type { ProfileState } from '@/types'
import { DEFAULT_PROFILE } from '@/lib/constants'

const REQUIRED_FIELDS: (keyof ProfileState)[] = ['firstName', 'lastName', 'baseResumeHtml']
const MAX_RESUME_BYTES = 4 * 1024 * 1024

interface ResumeImportResponse {
  firstName: string
  lastName: string
  baseResumeHtml: string
  report: {
    pages: number
    extractedCharacters: number
    reviewPasses: number
  }
}

export function ProfilePage() {
  const setProfile = useAppStore((s) => s.setProfile)
  const { toast } = useToast()
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [importReport, setImportReport] = useState<ResumeImportResponse['report'] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Supabase data fetching via React Query ──────────────────
  const {
    data: remoteProfile,
    isLoading: isFetching,
    isError: isFetchError,
  } = useProfileQuery()

  const profileMutation = useProfileMutation()

  // Determine the initial form values: remote data → defaults
  const initialValues: ProfileState = remoteProfile ?? DEFAULT_PROFILE

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<ProfileState>({
    defaultValues: initialValues,
  })

  // When remote data arrives, reset the form with fetched values
  // and sync to the Zustand store so the generator page sees them
  useEffect(() => {
    if (remoteProfile) {
      reset(remoteProfile)
      setProfile(remoteProfile)
    }
  }, [remoteProfile, reset, setProfile])

  const watchedValues = watch()

  // Completeness calculation
  const completeness = useMemo(() => {
    let filled = 0
    REQUIRED_FIELDS.forEach((key) => {
      const val = watchedValues[key]
      if (typeof val === 'string' && val.trim()) filled++
    })
    return Math.round((filled / REQUIRED_FIELDS.length) * 100)
  }, [watchedValues])

  const onSubmit = (data: ProfileState) => {
    const normalized: ProfileState = {
      ...data,
      maxgrowthpct: Number(data.maxgrowthpct) || 8,
      companynamefallback: data.companynamefallback || 'unknown-company',
      roletitlefallback: data.roletitlefallback || 'target-role',
    }

    // Save to Zustand (for immediate in-app use)
    setProfile(normalized)

    // Save to Supabase via React Query mutation
    profileMutation.mutate(normalized, {
      onSuccess: () => {
        toast('Profile saved! Ready to generate resumes.', 'success')
        setSaved(true)
        setTimeout(() => setSaved(false), 1500)
      },
      onError: (err) => {
        if (import.meta.env.DEV) console.error('[ProfilePage] Save error:', err)
        toast('Save failed. Please check your connection and try again.', 'error')
      },
    })
  }

  const resumeLength = watchedValues.baseResumeHtml?.length || 0
  const isSaving = profileMutation.isPending
  const hasResume = resumeLength > 0

  const importResume = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setImportError('Please choose a PDF resume.')
      return
    }
    if (file.size > MAX_RESUME_BYTES) {
      setImportError('Resume PDF is too large. Maximum size is 4 MB.')
      return
    }

    setIsImporting(true)
    setImportError('')
    setImportReport(null)
    try {
      // Step 1: Extract text from PDF in the browser (no server round-trip for parsing)
      const extracted = await extractTextFromPDF(file)

      // Step 2: Send extracted text to server for LLM template mapping + audit
      const response = await fetch('/api/import-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extracted.text, pages: extracted.pages }),
      })
      const body = await response.json().catch(() => ({})) as Partial<ResumeImportResponse> & { error?: string }
      if (!response.ok || !body.baseResumeHtml) {
        throw new Error(body.error || `Import failed with HTTP ${response.status}`)
      }

      setValue('firstName', body.firstName || '', { shouldDirty: true, shouldValidate: true })
      setValue('lastName', body.lastName || '', { shouldDirty: true, shouldValidate: true })
      setValue('baseResumeHtml', body.baseResumeHtml, { shouldDirty: true, shouldValidate: true })
      clearErrors(['firstName', 'lastName', 'baseResumeHtml'])
      setImportReport(body.report ?? null)
      toast('Resume imported and verified twice. Save your profile to continue.', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Resume import failed.'
      setImportError(message)
      toast(`Resume import failed: ${message.substring(0, 90)}`, 'error')
    } finally {
      setIsImporting(false)
    }
  }

  // ── Loading skeleton ─────────────────────────────────────────
  if (isFetching) {
    return (
      <div style={{
        maxWidth: 'var(--content-narrow)',
        margin: '0 auto',
        padding: 'var(--space-6)',
        animation: 'pageIn 0.6s ease',
      }}>
        <Skeleton variant="heading" />
        <div style={{ marginTop: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
          <Skeleton variant="text" width="60%" />
        </div>
        <Skeleton variant="text" height="4px" width="100%" />
        <div style={{ marginTop: 'var(--space-8)' }}>
          <Skeleton variant="text" width="30%" height="12px" />
          <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
            <Skeleton variant="custom" height="44px" width="50%" />
            <Skeleton variant="custom" height="44px" width="50%" />
          </div>
        </div>
        <div style={{ marginTop: 'var(--space-8)' }}>
          <Skeleton variant="text" width="30%" height="12px" />
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Skeleton variant="custom" height="200px" />
          </div>
        </div>
        <div style={{ marginTop: 'var(--space-8)' }}>
          <Skeleton variant="text" width="30%" height="12px" />
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Skeleton variant="custom" height="44px" />
          </div>
        </div>
      </div>
    )
  }


  // Error banner markup (rendered inline, not as early return)
  const fetchErrorBanner = isFetchError ? (
    <div style={{
      padding: 'var(--space-4)',
      background: 'var(--color-error-highlight)',
      borderLeft: '3px solid var(--color-error)',
      borderRadius: 'var(--radius-md)',
      fontSize: 'var(--text-sm)',
      color: 'var(--color-error)',
      marginBottom: 'var(--space-4)',
    }}>
      Could not load saved profile. You can still fill in the form below - data will be saved when you click Save.
    </div>
  ) : null


  return (
    <div style={{
      maxWidth: 'var(--content-narrow)',
      margin: '0 auto',
      padding: 'var(--space-6)',
      animation: 'pageIn 0.6s ease',
    }}>
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 500, lineHeight: 1.15, marginBottom: 'var(--space-1)' }}>
          Your Profile
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          Set once. Used on every resume generation run.
        </p>

        {fetchErrorBanner}

        {/* Completeness progress */}
        <div style={{ marginTop: 'var(--space-4)' }}>
          <div style={{
            width: '100%',
            height: '4px',
            background: 'var(--color-divider)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${completeness}%`,
              background: completeness === 100 ? 'var(--color-success)' : 'var(--color-primary)',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }} />
          </div>
          <span style={{
            fontSize: 'var(--text-xs)',
            color: completeness === 100 ? 'var(--color-success)' : 'var(--color-text-muted)',
            marginTop: 'var(--space-1)',
            display: 'block',
          }}>
            {completeness === 100 ? 'Profile complete ✓' : `Profile ${completeness}% complete`}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate autoComplete="off">
        {/* Section A: Identity */}
        <div style={{
          padding: 'var(--space-6) 0',
          borderBottom: '1px solid var(--color-divider)',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.813rem',
            fontWeight: 500,
            color: 'var(--color-primary)',
            marginBottom: 'var(--space-4)',
            textTransform: 'uppercase' as const,
            letterSpacing: '3px',
          }}>
            Identity
          </div>
          <div className="profile-field-row">
            <Input
              id="input-firstName"
              label="First Name"
              required
              placeholder="e.g. Ajay"
              error={errors.firstName?.message}
              {...register('firstName', { required: 'This field is required', maxLength: { value: 100, message: 'Max 100 characters' } })}
            />
            <Input
              id="input-lastName"
              label="Last Name"
              required
              placeholder="e.g. Sharma"
              error={errors.lastName?.message}
              {...register('lastName', { required: 'This field is required', maxLength: { value: 100, message: 'Max 100 characters' } })}
            />
          </div>
        </div>

        {/* Section B: Base Resume */}
        <div style={{
          padding: 'var(--space-6) 0',
          borderBottom: '1px solid var(--color-divider)',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.813rem',
            fontWeight: 500,
            color: 'var(--color-primary)',
            marginBottom: 'var(--space-4)',
            textTransform: 'uppercase' as const,
            letterSpacing: '3px',
          }}>
            Base Resume
          </div>
          <input
            type="hidden"
            {...register('baseResumeHtml', {
              required: 'Upload your current resume PDF',
              maxLength: { value: 500_000, message: 'Resume HTML is too large (max 500KB)' },
            })}
          />
          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            accept="application/pdf,.pdf"
            onChange={importResume}
            aria-label="Upload current resume PDF"
          />

          <div className={`resume-upload-card${hasResume ? ' has-resume' : ''}`}>
            <div className="resume-upload-icon" aria-hidden="true">
              {hasResume ? <FileText size={24} /> : <Upload size={24} />}
            </div>
            <div className="resume-upload-copy">
              <div className="resume-upload-title">
                {hasResume ? 'Current resume is ready' : 'Upload your current resume'}
              </div>
              <div className="resume-upload-description">
                PDF only, up to 4 MB. Text is extracted in your browser, then placed into the locked
                base template and checked in two LLM review passes.
              </div>
              {hasResume && (
                <div className="resume-template-status">
                  <CheckCircle size={14} aria-hidden="true" />
                  <span>base_resume.html · {resumeLength.toLocaleString()} characters</span>
                </div>
              )}
            </div>
            <Button
              type="button"
              variant={hasResume ? 'secondary' : 'primary'}
              loading={isImporting}
              disabled={isImporting}
              leftIcon={!isImporting ? <Upload size={16} /> : undefined}
              onClick={() => fileInputRef.current?.click()}
            >
              {isImporting ? 'Importing and checking…' : hasResume ? 'Replace PDF' : 'Choose PDF'}
            </Button>
          </div>

          {errors.baseResumeHtml?.message && (
            <span className="field-error-msg">{errors.baseResumeHtml.message}</span>
          )}
          {importError && (
            <div className="resume-import-message error" role="alert">{importError}</div>
          )}
          {importReport && (
            <div className="resume-import-message success" role="status">
              Imported {importReport.pages} page{importReport.pages === 1 ? '' : 's'} and completed{' '}
              {importReport.reviewPasses} accuracy checks.
            </div>
          )}
        </div>

        {/* Section C: Advanced */}
        <div style={{ padding: 'var(--space-6) 0' }}>
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              color: 'var(--color-text-muted)',
              padding: 'var(--space-2) 0',
              minHeight: '44px',
              transition: 'color var(--transition-interactive)',
              cursor: 'pointer',
            }}
          >
            <span>Advanced Settings</span>
            <ChevronDown
              size={16}
              style={{
                transition: 'transform 0.3s ease',
                transform: advancedOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>

          <div style={{
            maxHeight: advancedOpen ? '400px' : '0',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease',
          }}>
            <div style={{ paddingTop: 'var(--space-4)' }}>
              <div className="profile-field-row">
                <Input
                  id="input-maxgrowthpct"
                  label="Max Growth %"
                  type="number"
                  helperText="How aggressively the AI can expand resume content."
                  {...register('maxgrowthpct', { min: { value: 1, message: 'Minimum is 1%' }, max: { value: 100, message: 'Maximum is 100%' } })}
                  error={errors.maxgrowthpct?.message}
                />
                <Input
                  id="input-companynamefallback"
                  label="Company Name Fallback"
                  helperText="Used if JD doesn't mention company name."
                  {...register('companynamefallback', { maxLength: { value: 200, message: 'Max 200 characters' } })}
                />
              </div>
              <Input
                id="input-roletitlefallback"
                label="Role Title Fallback"
                helperText="Used if JD doesn't mention role title."
                {...register('roletitlefallback', { maxLength: { value: 200, message: 'Max 200 characters' } })}
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="profile-actions-wrapper">
          <Button
            type="submit"
            variant="primary"
            loading={isSaving}
            disabled={isSaving || isImporting}
            style={saved ? { background: 'var(--color-success)', pointerEvents: 'none' } : undefined}
          >
            {saved ? 'Saved ✓' : isSaving ? 'Saving…' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </div>
  )
}
