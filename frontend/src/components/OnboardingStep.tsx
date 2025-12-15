// OnboardingStep Component - Wrapper for each onboarding step
// Provides consistent layout and structure
// Mobile-first design with TailwindCSS
// Reusable in Next.js and React Native (with minor adjustments)

import React from 'react'

export interface OnboardingStepProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

/**
 * OnboardingStep wrapper component for consistent step layout
 * 
 * Usage:
 * ```tsx
 * <OnboardingStep title="Welcome" description="Let's get started">
 *   <YourStepContent />
 * </OnboardingStep>
 * ```
 * 
 * For React Native:
 * - Replace div with View
 * - Adjust className to StyleSheet
 * - Keep the same prop interface for consistency
 */
export default function OnboardingStep({
  title,
  description,
  children,
  className = '',
}: OnboardingStepProps) {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          {title}
        </h2>
        {description && (
          <p className="text-base sm:text-lg text-slate-600">{description}</p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}

