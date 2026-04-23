// InputField Component - Reusable input with validation error display
// Reusable in Next.js and React Native (with minor adjustments)

import React from 'react'

export interface InputFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
}

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  function InputField(
    { label, error, helperText, fullWidth = true, className = '', id, ...props },
    ref
  ) {
    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-') || 'field'}`

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-lit-2)' }}>
            {label}
            {props.required && <span className="ml-1" style={{ color: 'var(--color-error)' }}>*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`block rounded-xl px-3 py-2.5 text-base sm:text-sm transition-colors outline-none disabled:opacity-50 disabled:cursor-not-allowed ${fullWidth ? 'w-full' : ''} ${className}`}
          style={{
            backgroundColor: 'var(--color-grove)',
            border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-rim)'}`,
            color: 'var(--color-lit)',
          }}
          onFocus={e => { if (!error) e.currentTarget.style.borderColor = 'var(--color-accent)' }}
          onBlur={e => { e.currentTarget.style.borderColor = error ? 'var(--color-error)' : 'var(--color-rim)' }}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm" role="alert" style={{ color: 'var(--color-error)' }}>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-xs" style={{ color: 'var(--color-lit-3)' }}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

export default InputField
