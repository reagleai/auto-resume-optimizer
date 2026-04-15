import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'btn-primary-variant',
  secondary: 'btn-secondary-variant',
  ghost: 'btn-ghost-variant',
  danger: 'btn-danger-variant',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'btn-size-sm',
  md: 'btn-size-md',
  lg: 'btn-size-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, className, disabled, style, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn('btn-base', variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled || loading}
        style={style}
        {...props}
      >
        {loading ? (
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
        ) : leftIcon ? (
          <span className="btn-icon-wrap">{leftIcon}</span>
        ) : null}
        {children}
        {!loading && rightIcon && <span className="btn-icon-wrap">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
