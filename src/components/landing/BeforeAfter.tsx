import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

const EXAMPLES = [
  {
    section: 'Summary',
    before: 'Experienced professional with a background in technology and product development. Skilled in working with teams and delivering results.',
    after: 'Product-minded professional with hands-on experience in AI evaluation systems and marketplace operations. Combines structured analytical thinking with cross-functional execution to ship user-facing improvements backed by data.',
  },
  {
    section: 'Experience',
    before: 'Worked on improving user experience across products. Helped with A/B testing and analytics. Managed stakeholder relationships.',
    after: 'Redesigned onboarding flow for a B2B marketplace, reducing time-to-first-value by structuring user research and iterating with engineering. Ran A/B tests on key conversion funnels and translated findings into prioritized product decisions for stakeholders.',
  },
  {
    section: 'Projects',
    before: 'Built an automation tool that helps with resumes. Used AI and some APIs to make it work.',
    after: 'Designed and shipped an AI-powered resume tailoring system with a 9-stage automation pipeline. Architected the workflow to isolate factual data from narrative content, enabling 4 independent AI rewrite steps while preserving document integrity.',
  },
]

export function BeforeAfter() {
  const [activeIndex, setActiveIndex] = useState(0)
  const ex = EXAMPLES[activeIndex]

  return (
    <section className="landing-section" style={{ paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-16)', background: 'var(--color-surface)', borderTop: '1px solid var(--color-divider)', borderBottom: '1px solid var(--color-divider)' }}>
      <span className="section-label" style={{ textAlign: 'center', display: 'block' }}>Demonstration</span>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 700, color: 'var(--color-text)', textAlign: 'center', letterSpacing: '-1px', marginBottom: 'var(--space-4)' }}>
        What refinement looks like
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', maxWidth: '540px', margin: '0 auto', marginBottom: 'var(--space-10)', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
        The system transforms vague, generic content into sharp, role-specific language — grounded in your actual experience.
      </p>

      {/* Section tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-8)', flexWrap: 'wrap' }}>
        {EXAMPLES.map((item, i) => (
          <button key={item.section} onClick={() => setActiveIndex(i)} style={{ padding: '8px 20px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-body)', border: '1.5px solid', borderColor: i === activeIndex ? 'var(--color-primary)' : 'var(--color-border)', background: i === activeIndex ? 'var(--color-primary-highlight)' : 'transparent', color: i === activeIndex ? 'var(--color-primary)' : 'var(--color-text-muted)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
            {item.section}
          </button>
        ))}
      </div>

      {/* Before / After panels */}
      <div className="landing-demo-grid">
        <div className="landing-demo-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' as const, letterSpacing: '2px', color: 'var(--color-text-faint)' }}>Before</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', padding: '2px 8px', background: 'var(--color-surface-offset)', borderRadius: 'var(--radius-full)' }}>{ex.section}</span>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.8, fontStyle: 'italic' }}>"{ex.before}"</p>
        </div>

        <div className="landing-demo-arrow">
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary-highlight)', border: '1.5px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRight size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
        </div>

        <div className="landing-demo-block" style={{ borderColor: 'var(--color-primary)', borderWidth: '1.5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' as const, letterSpacing: '2px', color: 'var(--color-primary)' }}>After</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', padding: '2px 8px', background: 'var(--color-primary-highlight)', borderRadius: 'var(--radius-full)' }}>Refined</span>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.8 }}>"{ex.after}"</p>
        </div>
      </div>
    </section>
  )
}
