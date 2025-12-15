// ImportDataStep Component - Placeholder for importing data from external services
// Mobile-first design with TailwindCSS
// Reusable in Next.js and React Native (with minor adjustments)

'use client'

import React, { useState } from 'react'
import Button from './Button'

export interface ImportDataStepProps {
  onImport?: (service: 'goodreads' | 'storygraph', file: File) => Promise<void>
  className?: string
}

/**
 * ImportDataStep component for importing data from Goodreads/StoryGraph
 * Currently a placeholder with "Coming soon" UI
 * 
 * Usage:
 * ```tsx
 * <ImportDataStep onImport={handleImport} />
 * ```
 * 
 * TODO: Implement actual import functionality when backend is ready
 * 1. Add file upload handling
 * 2. Call onImport with selected service and file
 * 3. Show progress indicator during import
 * 4. Display success/error messages
 * 5. Update user preferences after successful import
 * 
 * For React Native:
 * - Replace input with DocumentPicker or similar library
 * - Replace Button with TouchableOpacity or Pressable
 * - Adjust className to StyleSheet
 * - Keep the same prop interface for consistency
 */
export default function ImportDataStep({
  onImport,
  className = '',
}: ImportDataStepProps) {
  const [selectedService, setSelectedService] = useState<'goodreads' | 'storygraph' | null>(
    null
  )
  const [isImporting, setIsImporting] = useState(false)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedService || !onImport) {
      return
    }

    setIsImporting(true)
    try {
      await onImport(selectedService, file)
      // Reset after successful import
      setSelectedService(null)
      event.target.value = ''
    } catch (error) {
      console.error('Import failed:', error)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Coming soon!</strong> Import your reading data from Goodreads or StoryGraph
          to quickly populate your profile with books, authors, and reading history.
        </p>
      </div>

      {/* Service selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Choose a service to import from:
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Goodreads option */}
          <button
            type="button"
            onClick={() => setSelectedService('goodreads')}
            className={`
              p-6 rounded-lg border-2 text-left transition-all
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${
                selectedService === 'goodreads'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 font-bold text-lg">G</span>
              </div>
              <div className="font-semibold text-slate-900">Goodreads</div>
            </div>
            <p className="text-sm text-slate-600">
              Import your books, ratings, and reading history from Goodreads
            </p>
          </button>

          {/* StoryGraph option */}
          <button
            type="button"
            onClick={() => setSelectedService('storygraph')}
            className={`
              p-6 rounded-lg border-2 text-left transition-all
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${
                selectedService === 'storygraph'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold text-lg">SG</span>
              </div>
              <div className="font-semibold text-slate-900">StoryGraph</div>
            </div>
            <p className="text-sm text-slate-600">
              Import your reading data and preferences from StoryGraph
            </p>
          </button>
        </div>
      </div>

      {/* File upload (placeholder) */}
      {selectedService && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Upload your export file
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileSelect}
                disabled={isImporting}
                className="hidden"
                id="import-file-input"
              />
              <label
                htmlFor="import-file-input"
                className="cursor-pointer"
              >
                <div className="space-y-2">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="text-sm text-slate-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Click to upload
                    </span>{' '}
                    or drag and drop
                  </div>
                  <p className="text-xs text-slate-500">
                    CSV or JSON file (max 10MB)
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This feature is currently in development. The import
              functionality will be available soon. For now, you can manually select your
              favorite genres and authors above.
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-6">
        <h4 className="font-semibold text-slate-900 mb-2">How to export your data:</h4>
        <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
          <li>
            <strong>Goodreads:</strong> Go to Settings → Export Your Library → Download
            CSV
          </li>
          <li>
            <strong>StoryGraph:</strong> Go to Account Settings → Export Data → Download
            JSON
          </li>
        </ul>
      </div>
    </div>
  )
}

