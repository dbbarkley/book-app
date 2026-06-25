'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { SkeletonLoader } from './SkeletonLoader'
import { ModernPlaceholder } from './ModernPlaceholder'

interface BookCoverImageProps {
  src?: string | null
  title: string
  author?: string
  genre?: string
  isbn?: string
  size?: 'small' | 'medium' | 'large'
  className?: string
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
  layoutId?: string
  objectFit?: 'cover' | 'contain'
}

const SIZE_MAP = {
  small:  { width: 96,  height: 144 },
  medium: { width: 128, height: 192 },
  large:  { width: 192, height: 288 },
}

export function BookCoverImage({
  src,
  title,
  author,
  genre,
  isbn,
  size = 'medium',
  className = '',
  priority = false,
  onLoad,
  onError,
  layoutId,
  objectFit,
}: BookCoverImageProps) {
  const [isLoading, setIsLoading]               = useState(true)
  const [showSkeleton, setShowSkeleton]         = useState(false)
  const [hasError, setHasError]                 = useState(false)
  const [imageSrc, setImageSrc]                 = useState<string | null>(src || null)
  const [hasTriedFallback, setHasTriedFallback] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const dimensions = SIZE_MAP[size]

  const finishLoading = useCallback(() => {
    setIsLoading(false)
    setShowSkeleton(false)
  }, [])

  useEffect(() => {
    if (src) {
      setImageSrc(src)
      setIsLoading(true)
      setHasError(false)
      setHasTriedFallback(false)
    } else {
      setImageSrc(null)
      setIsLoading(false)
      setHasError(false)
    }
  }, [src])

  // Cached images load before onLoad can fire — check img.complete after paint
  useEffect(() => {
    if (!imageSrc) return
    const rafId = requestAnimationFrame(() => {
      const img = imgRef.current
      if (img?.complete && img.naturalWidth > 0) {
        finishLoading()
      }
    })
    return () => cancelAnimationFrame(rafId)
  }, [imageSrc, finishLoading])

  // Only show skeleton after 100ms — avoids flash for browser-cached images
  useEffect(() => {
    if (!isLoading || !imageSrc) {
      setShowSkeleton(false)
      return
    }
    const timer = setTimeout(() => setShowSkeleton(true), 100)
    return () => clearTimeout(timer)
  }, [isLoading, imageSrc])

  const handleLoad = () => {
    finishLoading()
    onLoad?.()
  }

  const handleError = () => {
    if (!hasTriedFallback && isbn) {
      setHasTriedFallback(true)
      setImageSrc(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`)
      return
    }
    setIsLoading(false)
    setHasError(true)
    setImageSrc(null)
    onError?.()
  }

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

  const isFull   = className.includes('w-full') || className.includes('h-full')
  const fitClass = objectFit ? `object-${objectFit}` : isFull ? 'object-cover' : 'object-contain'

  return (
    <motion.div
      layoutId={layoutId}
      className={`relative overflow-hidden flex items-center justify-center ${className}`}
      style={!isFull ? { width: dimensions.width, height: dimensions.height } : undefined}
    >
      {isLoading && showSkeleton && (
        <div className="absolute inset-0 z-10" data-testid="skeleton-loader">
          <SkeletonLoader variant="rectangular" width="100%" height="100%" animation="shimmer" />
        </div>
      )}

      <Image
        ref={imgRef}
        src={imageSrc}
        alt={`Cover of ${title || 'Unknown'}`}
        {...(isFull ? { fill: true } : { width: dimensions.width, height: dimensions.height })}
        className={`
          rounded-lg shadow-lg ${fitClass}
          transition-opacity duration-300
          ${isLoading ? 'opacity-0' : 'opacity-100'}
        `}
        onLoad={handleLoad}
        onError={handleError}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        unoptimized={
          imageSrc.includes('covers.openlibrary.org') ||
          imageSrc.includes('googleapis.com') ||
          imageSrc.includes('images.isbndb.com')
        }
      />
    </motion.div>
  )
}
