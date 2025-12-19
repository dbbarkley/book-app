// InputField Component - Reusable input with validation error display
// Mobile-first design with TailwindCSS
// Reusable in Next.js and React Native (with minor adjustments)

import React from 'react'

export interface InputFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
}

/**
 * Reusable InputField component with label, error, and helper text
 * 
 * Usage:
 * ```tsx
 * <InputField
 *   label="Email"
 *   type="email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   error={errors.email}
 * />
 * ```
 * 
 * For React Native:
 * - Replace input with TextInput from react-native
 * - Convert className to StyleSheet
 * - Keep the same prop interface for consistency
 * - Use Text component for label/error/helper text
 */
const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  function InputField(
    {
      label,
      error,
      helperText,
      fullWidth = true,
      className = '',
      id,
      ...props
    },
    ref
  ) {
    const inputId =
      id || `input-${label?.toLowerCase().replace(/\s+/g, '-') || 'field'}`

    const baseInputStyles =
      'block rounded-lg border border-border-default bg-background-card text-text-primary placeholder:text-text-muted shadow-sm focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/50 transition-colors disabled:bg-background-muted disabled:cursor-not-allowed'

    const errorInputStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : ''

    const sizeStyles = 'px-3 py-2 text-base sm:text-sm'
    const widthStyles = fullWidth ? 'w-full' : ''

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${baseInputStyles} ${errorInputStyles} ${sizeStyles} ${widthStyles} ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-text-muted">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

export default InputField
