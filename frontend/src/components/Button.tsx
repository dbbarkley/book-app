// Button Component - Reusable styled button
// Mobile-first design with TailwindCSS
// Reusable in Next.js and React Native (with minor adjustments)

import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  fullWidth?: boolean
  children: React.ReactNode
}

/**
 * Reusable Button component with multiple variants
 * 
 * Usage:
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 * 
 * For React Native:
 * - Replace button with TouchableOpacity or Pressable
 * - Adjust className to StyleSheet
 * - Keep the same prop interface for consistency
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm'

  const variantStyles = {
    primary:
      'bg-brand-indigo text-white hover:bg-brand-indigo-dark focus:ring-brand-indigo/60 active:bg-brand-indigo-dark/90',
    secondary:
      'bg-transparent border border-border-default text-text-primary hover:border-brand-indigo focus:ring-brand-indigo/50',
    outline:
      'border border-border-default text-text-primary hover:border-brand-indigo focus:ring-brand-indigo/50',
    ghost:
      'text-brand-indigo hover:text-brand-indigo-dark focus:ring-brand-indigo/40',
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  const widthStyles = fullWidth ? 'w-full' : ''

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  )
}

