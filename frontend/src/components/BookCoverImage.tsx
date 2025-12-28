'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { SkeletonLoader } from './SkeletonLoader'
import { ModernPlaceholder } from './ModernPlaceholder'

/**
 * BookCoverImage Component
 * 
 * Smart book cover component with:
 * - Lazy loading for performance
 * - Skeleton loader while fetching
 * - Modern placeholder fallback for missing covers
 * - Smooth fade-in animation
 * - Error handling
 * - Framer Motion support for shared layout transitions
 * 
 * Features:
 * - Uses Next.js Image for optimization
 * - Supports Open Library and Google Books URLs
 * - Genre-based placeholder colors
 * - Responsive sizing
 */

interface BookCoverImageProps {
  src?: string | null
  title: string
  author?: string
  genre?: string
  size?: 'small' | 'medium' | 'large'
  className?: string
  priority?: boolean // For above-the-fold images
  onLoad?: () => void
  onError?: () => void
  layoutId?: string // For shared layout transitions
}

const SIZE_MAP = {
  small: { width: 96, height: 144 },      // 24rem x 36rem (2:3 ratio)
  medium: { width: 128, height: 192 },    // 32rem x 48rem
  large: { width: 192, height: 288 },     // 48rem x 72rem
}

export function BookCoverImage({
  src,
  title,
  author,
  genre,
  size = 'medium',
  className = '',
  priority = false,
  onLoad,
  onError,
  layoutId,
}: BookCoverImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | null>(src || null)

  const dimensions = SIZE_MAP[size]

  // Reset states when src changes
  useEffect(() => {
    if (src) {
      setImageSrc(src)
      setIsLoading(true)
      setHasError(false)
    } else {
      setImageSrc(null)
      setIsLoading(false)
      setHasError(false)
    }
  }, [src])

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    setImageSrc(null)
    onError?.()
  }

  // Show placeholder if no image or error
  if (!imageSrc || hasError) {
    return (
      <ModernPlaceholder
        title={title}
        author={author}
        genre={genre}
        size={size}
        className={className}
      />
    )
  }

  return (
    <motion.div 
      layoutId={layoutId}
      className={`relative ${className}`} 
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 z-10">
          <SkeletonLoader
            variant="rectangular"
            width={dimensions.width}
            height={dimensions.height}
            animation="shimmer"
          />
        </div>
      )}

      {/* Actual image */}
      <Image
        src={imageSrc}
        alt={`Cover of ${title}`}
        width={dimensions.width}
        height={dimensions.height}
        className={`
          rounded-lg shadow-lg object-cover
          transition-opacity duration-300
          ${isLoading ? 'opacity-0' : 'opacity-100'}
        `}
        onLoad={handleLoad}
        onError={handleError}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        unoptimized={imageSrc.includes('covers.openlibrary.org') || imageSrc.includes('googleapis.com')}
      />
    </motion.div>
  )
}

