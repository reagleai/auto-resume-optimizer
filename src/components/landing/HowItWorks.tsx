import { ClipboardPaste, Cpu, Download } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    icon: ClipboardPaste,
    title: 'Paste the Job Description',
    description:
      'Drop in the full JD. The system extracts role signals, required skills, and hiring intent automatically.',
    detail: 'Add optional priority keywords to force-include specific terms you need.',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'AI Refines Your Resume',
    description:
      'A structured 9-stage pipeline rewrites your Summary, Experience, Projects, and Skills — each independently.',
    detail: 'Your real background is the source of truth. Titles, tenures, and company names are locked.',
  },
  {
    number: '03',
    icon: Download,
    title: 'Download Your Tailored Resume',
    description:
      'Get a polished PDF, ready to submit. Every version is saved to your history for easy reuse and comparison.',
    detail: 'The entire process takes approximately one minute.',
  },
]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="landing-section"
      style={{
        paddingTop: 'var(--space-16)',
        paddingBottom: 'var(--space-16)',
      }}
    >
      {/* Section label */}
      <span className="section-label" style={{ textAlign: 'center', display: 'block' }}>
        How It Works
      </span>

      <h2
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
          fontWeight: 700,
          color: 'var(--color-text)',
          textAlign: 'center',
          letterSpacing: '-1px',
          marginBottom: 'var(--space-4)',
        }}
      >
        Three steps. One minute. Done.
      </h2>

      <p
        style={{
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          maxWidth: '540px',
          margin: '0 auto',
          marginBottom: 'var(--space-12)',
          fontSize: 'var(--text-sm)',
          lineHeight: 1.7,
        }}
      >
        The workflow is designed to replace the tedious 20–30 minute manual editing cycle
        with a structured, repeatable process.
      </p>

      {/* Steps grid */}
      <div className="landing-steps-grid">
        {STEPS.map((step, i) => (
          <div key={step.number} className="landing-step-card card-hover" style={{ animationDelay: `${i * 0.1}s` }}>
            {/* Step number */}
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-primary)',
                letterSpacing: '2px',
                marginBottom: 'var(--space-4)',
              }}
            >
              STEP {step.number}
            </div>

            {/* Icon */}
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-primary-highlight)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-4)',
              }}
            >
              <step.icon size={22} style={{ color: 'var(--color-primary)' }} />
            </div>

            {/* Title */}
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
                fontWeight: 600,
                color: 'var(--color-text)',
                marginBottom: 'var(--space-3)',
                letterSpacing: '-0.5px',
              }}
            >
              {step.title}
            </h3>

            {/* Description */}
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-muted)',
                lineHeight: 1.7,
                marginBottom: 'var(--space-3)',
              }}
            >
              {step.description}
            </p>

            {/* Detail */}
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-faint)',
                lineHeight: 1.6,
              }}
            >
              {step.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
