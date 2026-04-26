import { Clock, Target, ShieldCheck, Layers } from 'lucide-react'

const VALUES = [
  {
    icon: Clock,
    title: '~1 minute per resume',
    body: 'Down from 20–30 minutes of manual editing per application. Generate, review, and submit — on a cycle that scales.',
  },
  {
    icon: Target,
    title: 'Role-specific positioning',
    body: 'Every section adapts to the target JD\'s language and priorities. Your experience is framed around what the hiring team actually cares about.',
  },
  {
    icon: ShieldCheck,
    title: 'Factual integrity',
    body: 'Titles, tenures, and company names are locked. Only positioning language and narrative framing change — never the underlying facts.',
  },
  {
    icon: Layers,
    title: 'Structured, not random',
    body: '4 targeted AI decisions across a 9-stage pipeline. Each resume section is rewritten independently with dedicated context — not a single monolithic prompt.',
  },
]

export function ValueSection() {
  return (
    <section className="landing-section" style={{ paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-16)' }}>
      <span className="section-label" style={{ textAlign: 'center', display: 'block' }}>Impact</span>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 700, color: 'var(--color-text)', textAlign: 'center', letterSpacing: '-1px', marginBottom: 'var(--space-4)' }}>
        What becomes easier
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', maxWidth: '540px', margin: '0 auto', marginBottom: 'var(--space-12)', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
        The goal isn't to automate away judgment — it's to reduce the cognitive overhead of repetitive resume editing so you can focus on strategy.
      </p>

      <div className="landing-value-grid">
        {VALUES.map((v, i) => (
          <div key={v.title} className="landing-step-card card-hover" style={{ animationDelay: `${i * 0.08}s` }}>
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-lg)', background: 'var(--color-primary-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
              <v.icon size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-3)', letterSpacing: '-0.5px' }}>
              {v.title}
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
              {v.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
