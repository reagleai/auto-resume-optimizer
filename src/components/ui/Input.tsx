import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, error, helperText, required, className, ...props }, ref) => {
    return (
      <div className={cn('field-group', error && 'has-error')}>
        {label && (
          <label className="field-label" htmlFor={id}>
            {label}
            {required && <span className="field-required">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn('field-input', error && 'has-error', className)}
          required={required}
          {...props}
        />
        {error && <span className="field-error-msg">{error}</span>}
        {!error && helperText && <span className="field-helper">{helperText}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
