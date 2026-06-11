'use client'

import { forwardRef } from 'react'
import { ArrowRight } from 'lucide-react'

type Variant = 'primary' | 'ink' | 'social' | 'ghost'
type Size    = 'sm' | 'md' | 'lg'

interface ZineButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  arrow?: boolean
  fullWidth?: boolean
  as?: 'button' | 'a'
  href?: string
}

const SIZE_PADDING: Record<Size, string> = {
  sm: 'py-2 px-4',
  md: 'py-3 px-6',
  lg: 'py-4 px-8',
}

export const ZineButton = forwardRef<HTMLButtonElement, ZineButtonProps>(
  function ZineButton(
    { variant = 'primary', size = 'lg', isLoading, arrow, fullWidth, children, className = '', disabled, ...props },
    ref
  ) {
    const variantClass = `zine-btn-${variant}`
    const widthClass   = fullWidth ? 'w-full' : ''
    const padClass     = SIZE_PADDING[size]

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`zine-btn ${variantClass} ${padClass} ${widthClass} ${className}`}
        {...props}
      >
        {isLoading ? 'Loading…' : (
          <>
            {children}
            {arrow && <ArrowRight size={14} />}
          </>
        )}
      </button>
    )
  }
)

export default ZineButton
