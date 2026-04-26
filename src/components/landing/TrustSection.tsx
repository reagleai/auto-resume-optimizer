import { UserCheck, Brain, FileOutput } from 'lucide-react'

const PILLARS = [
  {
    icon: UserCheck,
    title: 'You provide the raw material',
    body: 'Your base resume, your work history, your project details. The system never invents experience — it starts and ends with your actual background.',
  },
  {
    icon: Brain,
    title: 'AI sharpens the signal',
    body: 'The system extracts hiring intent from the JD, maps your experience against it, and rewrites with stronger positioning. It refines — it doesn\'t fabricate.',
  },
  {
    icon: FileOutput,
    title: 'Output is yours to review',
    body: 'Every resume is downloadable, editable, and saved to your history. You stay in full control of what gets submitted.',
  },
]

export function TrustSection() {
  return (
    <section className="landing-section" style={{ paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-16)', background: 'var(--color-surface)', borderTop: '1px solid var(--color-divider)', borderBottom: '1px solid var(--color-divider)' }}>
      <span className="section-label" style={{ textAlign: 'center', display: 'block' }}>User Control</span>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 700, color: 'var(--color-text)', textAlign: 'center', letterSpacing: '-1px', marginBottom: 'var(--space-4)' }}>
        Refinement, not fabrication
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', maxWidth: '540px', margin: '0 auto', marginBottom: 'var(--space-12)', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
        No hallucinated experience. No invented metrics. Just clearer framing of what you've actually done — adapted for the role you're targeting.
      </p>

      <div className="landing-steps-grid">
        {PILLARS.map((p, i) => (
          <div key={p.title} className="landing-step-card card-hover" style={{ animationDelay: `${i * 0.08}s` }}>
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-lg)', background: 'var(--color-primary-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
              <p.icon size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-3)', letterSpacing: '-0.5px' }}>
              {p.title}
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
              {p.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
