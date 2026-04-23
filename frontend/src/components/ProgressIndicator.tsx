// ProgressIndicator Component - Shows current step in multi-step wizard
// Mobile-first design with TailwindCSS
// Reusable in Next.js and React Native (with minor adjustments)

import React from 'react'

export interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  className?: string
}

/**
 * ProgressIndicator component for multi-step workflows
 * 
 * Usage:
 * ```tsx
 * <ProgressIndicator currentStep={2} totalSteps={4} />
 * ```
 * 
 * For React Native:
 * - Replace div with View
 * - Adjust className to StyleSheet
 * - Keep the same prop interface for consistency
 */
export default function ProgressIndicator({
  currentStep,
  totalSteps,
  className = '',
}: ProgressIndicatorProps) {
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className={`w-full ${className}`}>
      {/* Step dots */}
      <div className="flex justify-between mb-3">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div
            key={index}
            className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all"
            style={
              index < currentStep
                ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }
                : index === currentStep
                ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)', boxShadow: '0 0 0 3px rgba(201,168,76,0.25)' }
                : { backgroundColor: 'var(--color-grove)', color: 'var(--color-lit-3)', border: '1px solid var(--color-rim)' }
            }
          >
            {index + 1}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: 'var(--color-grove)' }}>
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%`, backgroundColor: 'var(--color-accent)' }}
        />
      </div>

      {/* Step indicator text */}
      <p className="text-xs mt-2 text-center" style={{ color: 'var(--color-lit-3)' }}>
        Step {currentStep + 1} of {totalSteps}
      </p>
    </div>
  )
}

