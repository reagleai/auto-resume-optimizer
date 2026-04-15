import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  charCount?: boolean
  monospace?: boolean
  currentLength?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, id, error, helperText, required, charCount, monospace, currentLength = 0, className, ...props }, ref) => {
    return (
      <div className={cn('field-group', error && 'has-error')}>
        {label && (
          <label className="field-label" htmlFor={id}>
            {label}
            {required && <span className="field-required">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn('field-input', 'textarea-input', monospace && 'monospace', error && 'has-error', className)}
          required={required}
          {...props}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {error && <span className="field-error-msg">{error}</span>}
            {!error && helperText && <span className="field-helper">{helperText}</span>}
          </div>
          {charCount && (
            <span className="field-char-count">
              {currentLength.toLocaleString()} {currentLength === 1 ? 'character' : 'characters'}
            </span>
          )}
        </div>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
