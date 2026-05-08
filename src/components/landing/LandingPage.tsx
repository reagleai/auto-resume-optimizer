import { useEffect } from 'react'
import { LandingNav } from './LandingNav'
import { LandingHero } from './LandingHero'
import { HowItWorks } from './HowItWorks'
import { BeforeAfter } from './BeforeAfter'
import { ValueSection } from './ValueSection'
import { TrustSection } from './TrustSection'
import { AccessSection } from './AccessSection'

interface LandingPageProps {
  onUnlock: () => void
}

export function LandingPage({ onUnlock }: LandingPageProps) {
  // Override body overflow:hidden so landing page can scroll
  // Also initialize theme (same logic as useTheme hook)
  useEffect(() => {
    document.body.style.overflow = 'auto'

    // Initialize theme for landing page
    const saved = localStorage.getItem('rt-theme')
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved)
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    }

    return () => {
      document.body.style.overflow = 'hidden'
    }
  }, [])

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-body)',
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      <LandingNav />
      <LandingHero />
      <HowItWorks />
      <BeforeAfter />
      <ValueSection />
      <TrustSection />
      <AccessSection onUnlock={onUnlock} />

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: 'var(--space-8) var(--space-6)',
          borderTop: '1px solid var(--color-divider)',
        }}
      >
        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-faint)',
          }}
        >
          Resumatch - AI-powered resume tailoring. Built as a product engineering case study.
        </p>
      </footer>
    </div>
  )
}
