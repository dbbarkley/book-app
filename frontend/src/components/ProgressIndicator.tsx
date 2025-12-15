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
      {/* Step numbers */}
      <div className="flex justify-between mb-2">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div
            key={index}
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
              index <= currentStep
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {index + 1}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-blue-600 h-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Step indicator text */}
      <p className="text-xs text-gray-600 mt-2 text-center">
        Step {currentStep + 1} of {totalSteps}
      </p>
    </div>
  )
}

