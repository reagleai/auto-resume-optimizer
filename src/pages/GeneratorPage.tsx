import { useEffect, useCallback, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWebhook } from '@/hooks/useWebhook'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { ProfileCard } from '@/components/features/ProfileCard'
import { ProfileGuard } from '@/components/features/ProfileGuard'
import { ResumePreview } from '@/components/features/ResumePreview'
import { LOADING_STEPS } from '@/lib/constants'

/**
 * Unique run counter — incremented each time a generation is started.
 * Used to prevent stale timers/responses from an older run from
 * overwriting the state of a newer run.
 */
let globalRunId = 0

export function GeneratorPage() {
  const isProfileComplete = useAppStore((s) => s.isProfileComplete)
  const generator = useAppStore((s) => s.generator)
  const setGeneratorField = useAppStore((s) => s.setGeneratorField)
  const setLoadingStep = useAppStore((s) => s.setLoadingStep)
  const resetGenerator = useAppStore((s) => s.resetGenerator)
  const previewHtml = useAppStore((s) => s.previewHtml)
  const setPreviewHtml = useAppStore((s) => s.setPreviewHtml)

  const { generate } = useWebhook()

  /** Stores timeout IDs for the current step-progression sequence */
  const stepTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  /** The run ID that the current set of timers belongs to */
  const activeRunIdRef = useRef<number>(0)

  const profileComplete = isProfileComplete()

  /**
   * Clear all pending step-progression timers.
   * Called on unmount, when generation completes/errors, or
   * when a new generation starts (to avoid timer bleed).
   */
  const clearStepTimers = useCallback(() => {
    stepTimersRef.current.forEach(clearTimeout)
    stepTimersRef.current = []
  }, [])

  /**
   * Start the deterministic step-progression timer sequence.
   * Steps 1–4 advance on fixed intervals. Step 5 persists
   * indefinitely until the real backend response arrives.
   *
   * Each timer checks the active runId before setting state
   * to prevent stale updates from a previous generation run.
   */
  const startStepProgression = useCallback((runId: number) => {
    // Always begin at step 0
    setLoadingStep(0)

    let elapsed = 0
    const timers: ReturnType<typeof setTimeout>[] = []

    for (let i = 1; i < LOADING_STEPS.length; i++) {
      const prevDuration = LOADING_STEPS[i - 1].duration
      // Step 5 (index 4) has duration 0 = persist forever; no timer needed
      if (prevDuration <= 0) break
      elapsed += prevDuration
      const stepIdx = i
      timers.push(
        setTimeout(() => {
          // Guard: only update if this run is still the active one
          if (activeRunIdRef.current === runId) {
            setLoadingStep(stepIdx)
          }
        }, elapsed)
      )
    }

    stepTimersRef.current = timers
  }, [setLoadingStep])

  // Drive step progression when loading starts; clean up when status changes
  useEffect(() => {
    if (generator.status === 'loading') {
      // Bump run ID, clear any prior timers, start fresh sequence
      const runId = ++globalRunId
      activeRunIdRef.current = runId
      clearStepTimers()
      startStepProgression(runId)

      return () => {
        clearStepTimers()
      }
    }

    // When status is no longer 'loading', ensure timers are cleaned up
    clearStepTimers()
  }, [generator.status, clearStepTimers, startStepProgression])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearStepTimers()
    }
  }, [clearStepTimers])

  // If there's a preview from history, show it
  const effectiveResult = previewHtml
    ? {
        html: previewHtml,
        filename: 'preview.html',
        companyname: 'Preview',
        roletitle: 'History',
        timestamp: new Date(),
        format: 'html' as const,
      }
    : generator.result

  const effectiveStatus = previewHtml ? 'success' as const : generator.status

  const handleGenerate = useCallback(async () => {
    setPreviewHtml(null)
    await generate()
  }, [generate, setPreviewHtml])

  const handleClear = useCallback(() => {
    setPreviewHtml(null)
    resetGenerator()
  }, [resetGenerator, setPreviewHtml])

  // Keyboard shortcut: Cmd/Ctrl + Enter
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (profileComplete && generator.jd.trim() && generator.status !== 'loading') {
          handleGenerate()
        }
      }
    }
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [profileComplete, generator.jd, generator.status, handleGenerate])

  return (
    <div className="generator-page">
      {/* Left Panel: Input form */}
      <div className="gen-left">
        {/* Profile guard or compact status card */}
        {profileComplete ? <ProfileCard /> : <ProfileGuard />}

        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: 'var(--space-6)' }}>
          Generate Resume
        </h1>

        {/* Job Description */}
        <Textarea
          id="input-jd"
          label="Job Description"
          required
          rows={10}
          placeholder="Paste the full job description here. Include role title, responsibilities, qualifications, and any tools mentioned. The more complete, the better the tailoring."
          value={generator.jd}
          onChange={(e) => setGeneratorField('jd', e.target.value)}
          charCount
          currentLength={generator.jd.length}
        />

        {/* Priority Keywords */}
        <Textarea
          id="input-keywords"
          label="Priority Keywords"
          rows={4}
          placeholder={'List keywords you MUST have in the resume, comma-separated.\ne.g. Product Analytics, A/B Testing, SQL, Cross-functional'}
          value={generator.keywords}
          onChange={(e) => setGeneratorField('keywords', e.target.value)}
          helperText="These keywords will be force-included in the tailored resume if truthfully supportable."
        />

        {/* Generate Button */}
        <Button
          variant="primary"
          size="lg"
          loading={generator.status === 'loading'}
          disabled={!profileComplete || !generator.jd.trim() || generator.status === 'loading'}
          onClick={handleGenerate}
          rightIcon={generator.status !== 'loading' ? <ArrowRight size={16} /> : undefined}
          style={{ width: '100%', borderRadius: 'var(--radius-lg)' }}
        >
          {generator.status === 'loading' ? 'Generating…' : 'Generate Tailored Resume'}
        </Button>
      </div>

      {/* Right Panel: Preview */}
      <div className="gen-right">
        <ResumePreview
          result={effectiveResult}
          status={effectiveStatus}
          loadingStep={generator.loadingStep}
          error={generator.error}
          onRetry={handleClear}
          onClear={handleClear}
        />
      </div>
    </div>
  )
}
