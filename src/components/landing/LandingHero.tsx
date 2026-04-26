import { ArrowRight, FileText } from 'lucide-react'

export function LandingHero() {
  return (
    <section
      className="landing-section"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        paddingTop: 'calc(var(--topbar-height) + var(--space-8))',
        paddingBottom: 'var(--space-16)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle background glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(62, 204, 144, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Section label */}
      <span className="section-label" style={{ marginBottom: 'var(--space-6)' }}>
        AI-Powered Resume Tailoring
      </span>

      {/* Headline */}
      <h1
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
          fontWeight: 700,
          color: 'var(--color-text)',
          letterSpacing: '-2px',
          lineHeight: 1.1,
          maxWidth: '800px',
          marginBottom: 'var(--space-6)',
        }}
      >
        Resume tailoring that{' '}
        <span style={{ color: 'var(--color-primary)' }}>actually works</span>
      </h1>

      {/* Subtext */}
      <p
        style={{
          fontSize: 'clamp(1rem, 2vw, 1.15rem)',
          color: 'var(--color-text-muted)',
          maxWidth: '580px',
          lineHeight: 1.7,
          marginBottom: 'var(--space-10)',
        }}
      >
        Paste a job description. Get a role-specific, recruiter-ready resume in under a minute.
        No templates. No guesswork. Just sharper positioning.
      </p>

      {/* CTA */}
      <a
        href="#how-it-works"
        className="btn-base btn-primary-variant btn-size-lg"
        style={{ textDecoration: 'none', gap: 'var(--space-2)' }}
      >
        See How It Works
        <ArrowRight size={16} />
      </a>

      {/* Tool preview mock */}
      <div
        style={{
          marginTop: 'var(--space-16)',
          width: '100%',
          maxWidth: '900px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-divider)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden',
          animation: 'cardIn 0.6s ease both',
        }}
      >
        {/* Mock top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            borderBottom: '1px solid var(--color-divider)',
          }}
        >
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'var(--color-error)',
              opacity: 0.7,
            }}
          />
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'var(--color-warning)',
              opacity: 0.7,
            }}
          />
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'var(--color-success)',
              opacity: 0.7,
            }}
          />
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-faint)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            resumatch
          </span>
        </div>

        {/* Mock two-panel layout */}
        <div className="landing-hero-panels">
          {/* Left: Input mock */}
          <div
            className="landing-hero-panel-left"
            style={{
              padding: 'var(--space-6)',
              borderRight: '1px solid var(--color-divider)',
            }}
          >
            <div
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                marginBottom: 'var(--space-4)',
                color: 'var(--color-text)',
              }}
            >
              Job Description
            </div>
            <div
              style={{
                background: 'var(--color-surface-offset)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
                lineHeight: 1.7,
                border: '1px solid var(--color-border)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>
                Associate Product Manager
              </span>
              <br />
              We're looking for an APM to drive product strategy for our AI-powered platform.
              You'll work with engineering, design, and data to ship features that solve real user
              problems…
            </div>
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-2)',
                flexWrap: 'wrap',
              }}
            >
              <span className="tag-pill" style={{ fontSize: '0.7rem', padding: '4px 10px' }}>
                Product Analytics
              </span>
              <span className="tag-pill" style={{ fontSize: '0.7rem', padding: '4px 10px' }}>
                A/B Testing
              </span>
              <span className="tag-pill" style={{ fontSize: '0.7rem', padding: '4px 10px' }}>
                SQL
              </span>
            </div>
          </div>

          {/* Right: Output mock */}
          <div className="landing-hero-panel-right" style={{ padding: 'var(--space-6)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                marginBottom: 'var(--space-4)',
                color: 'var(--color-primary)',
              }}
            >
              <FileText size={14} />
              Tailored Resume
            </div>
            {/* Skeleton lines representing resume output */}
            <div
              style={{
                background: 'var(--color-surface-offset)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="skeleton" style={{ height: '14px', width: '55%', marginBottom: 'var(--space-2)' }} />
              <div className="skeleton" style={{ height: '9px', width: '75%', marginBottom: 'var(--space-2)' }} />
              <div className="skeleton" style={{ height: '9px', width: '65%', marginBottom: 'var(--space-4)' }} />
              <div style={{ height: '1px', background: 'var(--color-divider)', marginBottom: 'var(--space-3)' }} />
              <div className="skeleton" style={{ height: '11px', width: '35%', marginBottom: 'var(--space-2)' }} />
              <div className="skeleton" style={{ height: '8px', width: '92%', marginBottom: 'var(--space-1)' }} />
              <div className="skeleton" style={{ height: '8px', width: '80%', marginBottom: 'var(--space-1)' }} />
              <div className="skeleton" style={{ height: '8px', width: '87%', marginBottom: 'var(--space-3)' }} />
              <div className="skeleton" style={{ height: '11px', width: '30%', marginBottom: 'var(--space-2)' }} />
              <div className="skeleton" style={{ height: '8px', width: '88%', marginBottom: 'var(--space-1)' }} />
              <div className="skeleton" style={{ height: '8px', width: '70%', marginBottom: 'var(--space-1)' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
