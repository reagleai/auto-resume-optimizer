import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { ChevronDown } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useToast } from '@/hooks/useToast'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import type { ProfileState } from '@/types'

const REQUIRED_FIELDS: (keyof ProfileState)[] = ['firstName', 'lastName', 'baseResumeHtml', 'webhookUrl']

export function ProfilePage() {
  const profile = useAppStore((s) => s.profile)
  const setProfile = useAppStore((s) => s.setProfile)
  const { toast } = useToast()
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProfileState>({
    defaultValues: profile,
  })

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
    setProfile({
      ...data,
      maxgrowthpct: Number(data.maxgrowthpct) || 8,
      companynamefallback: data.companynamefallback || 'unknown-company',
      roletitlefallback: data.roletitlefallback || 'target-role',
    })
    toast('Profile saved! Ready to generate resumes.', 'success')
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const resumeLength = watchedValues.baseResumeHtml?.length || 0

  return (
    <div style={{
      maxWidth: 'var(--content-narrow)',
      margin: '0 auto',
      padding: 'var(--space-6)',
      animation: 'pageIn 0.6s ease',
    }}>
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 600, lineHeight: 1.15, marginBottom: 'var(--space-1)' }}>
          Your Profile
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          Set once. Used on every resume generation run.
        </p>

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
              {...register('firstName', { required: 'This field is required' })}
            />
            <Input
              id="input-lastName"
              label="Last Name"
              required
              placeholder="e.g. Sharma"
              error={errors.lastName?.message}
              {...register('lastName', { required: 'This field is required' })}
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
          <Textarea
            id="input-baseResumeHtml"
            label="Base Resume HTML"
            required
            rows={14}
            monospace
            charCount
            currentLength={resumeLength}
            placeholder="Paste your full resume HTML here. This is the source template the AI will tailor for each job application."
            error={errors.baseResumeHtml?.message}
            {...register('baseResumeHtml', { required: 'This field is required' })}
          />
        </div>

        {/* Section C: Webhook */}
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
            Webhook
          </div>
          <Input
            id="input-webhookUrl"
            label="n8n Webhook URL"
            required
            type="url"
            placeholder="https://your-n8n-instance.com/webhook/..."
            helperText="The POST endpoint of your n8n Resume Tailor workflow."
            error={errors.webhookUrl?.message}
            {...register('webhookUrl', { required: 'This field is required' })}
          />
        </div>

        {/* Section D: Advanced */}
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
                  {...register('maxgrowthpct')}
                />
                <Input
                  id="input-companynamefallback"
                  label="Company Name Fallback"
                  helperText="Used if JD doesn't mention company name."
                  {...register('companynamefallback')}
                />
              </div>
              <Input
                id="input-roletitlefallback"
                label="Role Title Fallback"
                helperText="Used if JD doesn't mention role title."
                {...register('roletitlefallback')}
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="profile-actions-wrapper">
          <Button
            type="submit"
            variant="primary"
            style={saved ? { background: 'var(--color-success)', pointerEvents: 'none' } : undefined}
          >
            {saved ? 'Saved ✓' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </div>
  )
}


