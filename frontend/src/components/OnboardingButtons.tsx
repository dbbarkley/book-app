// OnboardingButtons Component - Navigation buttons for onboarding steps
// Mobile-first design with TailwindCSS
// Reusable in Next.js and React Native (with minor adjustments)

import React from 'react'
import Button from './Button'

export interface OnboardingButtonsProps {
  onNext?: () => void
  onBack?: () => void
  onSkip?: () => void
  nextLabel?: string
  backLabel?: string
  skipLabel?: string
  showBack?: boolean
  showSkip?: boolean
  isLoading?: boolean
  nextDisabled?: boolean
  className?: string
}

/**
 * OnboardingButtons component for step navigation
 * 
 * Usage:
 * ```tsx
 * <OnboardingButtons
 *   onNext={handleNext}
 *   onBack={handleBack}
 *   onSkip={handleSkip}
 *   showBack={currentStep > 0}
 *   showSkip={true}
 * />
 * ```
 * 
 * For React Native:
 * - Replace Button with TouchableOpacity or Pressable
 * - Adjust className to StyleSheet
 * - Keep the same prop interface for consistency
 */
export default function OnboardingButtons({
  onNext,
  onBack,
  onSkip,
  nextLabel = 'Next',
  backLabel = 'Back',
  skipLabel = 'Skip for now',
  showBack = false,
  showSkip = false,
  isLoading = false,
  nextDisabled = false,
  className = '',
}: OnboardingButtonsProps) {
  return (
    <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 ${className}`}>
      {/* Back button */}
      {showBack && onBack && (
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="order-2 sm:order-1"
        >
          {backLabel}
        </Button>
      )}

      {/* Skip button */}
      {showSkip && onSkip && (
        <Button
          variant="ghost"
          onClick={onSkip}
          disabled={isLoading}
          className="order-1 sm:order-2 sm:ml-auto"
        >
          {skipLabel}
        </Button>
      )}

      {/* Next button */}
      {onNext && (
        <Button
          variant="primary"
          onClick={onNext}
          isLoading={isLoading}
          disabled={nextDisabled || isLoading}
          fullWidth={!showBack && !showSkip}
          className="order-3 sm:ml-auto"
        >
          {nextLabel}
        </Button>
      )}
    </div>
  )
}

