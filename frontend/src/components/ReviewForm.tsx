'use client'

// ReviewForm Component - Rate and review a book
// Mobile-first design with TailwindCSS
// Reusable in Next.js and React Native (with minor adjustments)

import { useState } from 'react'
import { useBookReview } from '@book-app/shared'
import Button from './Button'
import type { UserBook } from '@book-app/shared'

interface ReviewFormProps {
  userBook?: UserBook | null
  onReviewSubmit?: () => void
}

/**
 * Component for rating and reviewing books
 * 
 * Usage:
 * ```tsx
 * <ReviewForm userBook={userBook} />
 * ```
 * 
 * For React Native:
 * - Replace textarea with TextInput from react-native
 * - Adjust className to StyleSheet
 * - Keep the same prop interface
 * 
 * Note: This is a placeholder feature. The backend endpoint
 * needs to be implemented for full functionality.
 */
export default function ReviewForm({ userBook, onReviewSubmit }: ReviewFormProps) {
  const { saveReview, loading } = useBookReview()
  const [rating, setRating] = useState(userBook?.rating || 0)
  const [review, setReview] = useState(userBook?.review || '')
  const [hoveredRating, setHoveredRating] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      alert('Please select a rating')
      return
    }
    if (!userBook?.id) {
      return
    }

    try {
      await saveReview(userBook.id, rating, review || undefined)
      onReviewSubmit?.()
    } catch (error) {
      console.error('Failed to save review:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Rate & Review</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Rating
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="text-3xl focus:outline-none transition-transform hover:scale-110"
              >
                {star <= (hoveredRating || rating) ? '⭐' : '☆'}
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-slate-600 mt-1">
              {rating} {rating === 1 ? 'star' : 'stars'}
            </p>
          )}
        </div>

        {/* Review Text */}
        <div>
          <label htmlFor="review" className="block text-sm font-medium text-slate-700 mb-2">
            Review (Optional)
          </label>
          <textarea
            id="review"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            placeholder="Share your thoughts about this book..."
          />
          <p className="text-xs text-slate-500 mt-1">{review.length} characters</p>
        </div>

        {/* Current Review Display */}
        {userBook?.review && (
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              <span className="font-medium">Your review:</span> {userBook.review}
            </p>
          </div>
        )}

        <Button type="submit" isLoading={loading} fullWidth>
          {userBook?.rating ? 'Update Review' : 'Submit Review'}
        </Button>
      </form>

      <p className="text-xs text-slate-500 mt-4">
        Note: Review feature is in development. Your review will be saved once the backend endpoint is implemented.
      </p>
    </div>
  )
}

