import { useEffect, useCallback } from 'react'
import { ArrowRight } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useGenerate } from '@/hooks/useGenerate'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { ProfileCard } from '@/components/features/ProfileCard'
import { ProfileGuard } from '@/components/features/ProfileGuard'
import { ResumePreview } from '@/components/features/ResumePreview'

export function GeneratorPage() {
  const isProfileComplete = useAppStore((s) => s.isProfileComplete)
  const profileLoading = useAppStore((s) => s.profileLoading)
  const generator = useAppStore((s) => s.generator)
  const setGeneratorField = useAppStore((s) => s.setGeneratorField)
  const resetGenerator = useAppStore((s) => s.resetGenerator)
  const previewHtml = useAppStore((s) => s.previewHtml)
  const setPreviewHtml = useAppStore((s) => s.setPreviewHtml)

  // Loading-step progression is now driven by the real job status (see
  // useGenerate → setLoadingStep), so no client-side timers are needed.
  const { generate } = useGenerate()

  const profileComplete = isProfileComplete()

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

  const effectiveStatus = previewHtml ? ('success' as const) : generator.status

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
        {/* Profile guard or compact status card - hidden while initial fetch is in-flight */}
        {!profileLoading && (profileComplete ? <ProfileCard /> : <ProfileGuard />)}

        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 500, marginBottom: 'var(--space-6)' }}>
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
