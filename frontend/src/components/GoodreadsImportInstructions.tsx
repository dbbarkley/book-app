'use client'

import { FileText, Download, Upload, Info } from 'lucide-react'

/**
 * GoodreadsImportInstructions Component
 * 
 * Explains the Goodreads CSV export process with clear, friendly copy
 * Includes a CTA button to open the Goodreads export page
 * 
 * Why we use CSV instead of direct login:
 * - Goodreads API is deprecated and unavailable for new apps
 * - Direct login/scraping would violate Goodreads Terms of Service
 * - CSV export is the only officially supported method for data portability
 */
export function GoodreadsImportInstructions() {
  const handleOpenGoodreadsExport = () => {
    // Open Goodreads export page in new tab
    window.open('https://www.goodreads.com/review/import', '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-emerald-50 rounded-lg">
          <FileText className="w-6 h-6 text-emerald-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Import your Goodreads library
          </h2>
          <p className="text-gray-600">
            Bring your entire reading history, ratings, and shelves over in less than a minute. 
            We'll guide you through exporting from Goodreads and importing here.
          </p>
        </div>
      </div>

      {/* Info callout */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">Why do I need to export manually?</p>
          <p className="text-blue-800">
            Goodreads doesn't provide an API for third-party apps to access your data directly. 
            CSV export is their official way to give you data portability while respecting their terms of service.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">How to export from Goodreads:</h3>
        
        <div className="space-y-3">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold text-sm">
              1
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-gray-700">
                Click the button below to open the Goodreads export page
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold text-sm">
              2
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-gray-700">
                On Goodreads, scroll down and click <span className="font-medium">"Export Library"</span>
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold text-sm">
              3
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-gray-700">
                Wait for your CSV file to download (usually takes a few seconds)
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold text-sm">
              4
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-gray-700">
                Come back here and upload the CSV file below
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={handleOpenGoodreadsExport}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
      >
        <Download className="w-5 h-5" />
        Open Goodreads Export Page
      </button>

      {/* Future expansion note */}
      {/* StoryGraph import can be added here later with a similar flow */}
    </div>
  )
}

