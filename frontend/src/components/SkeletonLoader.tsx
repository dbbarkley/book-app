'use client'

/**
 * SkeletonLoader Component
 * 
 * Beautiful loading skeleton with shimmer effect
 * Used while images are loading or content is being fetched
 */

interface SkeletonLoaderProps {
  className?: string
  variant?: 'rectangular' | 'circular' | 'text'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'shimmer' | 'none'
}

export function SkeletonLoader({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'shimmer',
}: SkeletonLoaderProps) {
  const baseClasses = 'bg-gray-200 overflow-hidden relative'
  
  const variantClasses = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded h-4',
  }

  const animationClasses = {
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer',
    none: '',
  }

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : '100%',
    height: height ? (typeof height === 'number' ? `${height}px` : height) : '100%',
  }

  return (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${animationClasses[animation]}
        ${className}
      `}
      style={style}
    >
      {/* Shimmer overlay effect */}
      {animation === 'shimmer' && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer-slide bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      )}
    </div>
  )
}

