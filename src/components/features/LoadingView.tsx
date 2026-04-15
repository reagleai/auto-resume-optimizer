import { LOADING_STEPS } from '@/lib/constants'

interface LoadingViewProps {
  currentStep: number
}

export function LoadingView({ currentStep }: LoadingViewProps) {
  const step = LOADING_STEPS[currentStep] || LOADING_STEPS[0]

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-6)',
        textAlign: 'center' as const,
      }}
    >
      {/* Pulsing dots */}
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-primary)',
              animation: `pulse-dot 1.4s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Step label */}
      <div style={{ fontSize: 'var(--text-base)', color: 'var(--color-text)', fontWeight: 500 }}>
        {step.label}
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
        Step {currentStep + 1} of {LOADING_STEPS.length}
      </div>

      {/* Skeleton resume */}
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: 'var(--space-6)',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="skeleton" style={{ height: '18px', width: '55%', marginBottom: 'var(--space-3)' }} />
        <div className="skeleton" style={{ height: '10px', width: '45%', marginBottom: 'var(--space-2)' }} />
        <div className="skeleton" style={{ height: '10px', width: '55%', marginBottom: 'var(--space-2)' }} />
        <div style={{ height: '1px', background: 'var(--color-divider)', margin: 'var(--space-3) 0' }} />
        <div className="skeleton" style={{ height: '14px', width: '30%', margin: 'var(--space-4) 0 var(--space-3)' }} />
        <div className="skeleton" style={{ height: '12px', width: '95%', marginBottom: 'var(--space-2)' }} />
        <div className="skeleton" style={{ height: '12px', width: '80%', marginBottom: 'var(--space-2)' }} />
        <div className="skeleton" style={{ height: '12px', width: '88%', marginBottom: 'var(--space-2)' }} />
        <div style={{ height: '1px', background: 'var(--color-divider)', margin: 'var(--space-3) 0' }} />
        <div className="skeleton" style={{ height: '14px', width: '30%', margin: 'var(--space-4) 0 var(--space-3)' }} />
        <div className="skeleton" style={{ height: '12px', width: '90%', marginBottom: 'var(--space-2)' }} />
        <div className="skeleton" style={{ height: '12px', width: '70%', marginBottom: 'var(--space-2)' }} />
        <div className="skeleton" style={{ height: '12px', width: '85%', marginBottom: 'var(--space-2)' }} />
        <div className="skeleton" style={{ height: '12px', width: '60%', marginBottom: 'var(--space-2)' }} />
        <div className="skeleton" style={{ height: '12px', width: '75%', marginBottom: 'var(--space-2)' }} />
      </div>
    </div>
  )
}
