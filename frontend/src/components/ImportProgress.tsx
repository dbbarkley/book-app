'use client'

import { CheckCircle2, XCircle, Loader2, TrendingUp, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ImportProgressProps {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  totalBooks: number
  processedBooks: number
  successfulImports: number
  failedImports: number
  progressPercentage: number
  errorMessage?: string
  metadata?: Record<string, any>
}

/**
 * ImportProgress Component
 * 
 * Displays real-time progress of the import job
 * Shows:
 * - Progress bar
 * - Status (pending, processing, completed, failed)
 * - Success/failure counts
 * - Error messages if any
 * - Navigation CTAs when complete
 */
export function ImportProgress({
  status,
  totalBooks,
  processedBooks,
  successfulImports,
  failedImports,
  progressPercentage,
  errorMessage,
  metadata,
}: ImportProgressProps) {
  const router = useRouter()

  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />,
          title: 'Preparing Import...',
          description: 'Your books are being queued for import',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        }
      case 'processing':
        return {
          icon: <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />,
          title: 'Importing Your Books...',
          description: `Processing ${processedBooks} of ${totalBooks} books`,
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
        }
      case 'completed':
        return {
          icon: <CheckCircle2 className="w-8 h-8 text-emerald-600" />,
          title: 'Import Complete!',
          description: `Successfully imported ${successfulImports} books`,
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
        }
      case 'failed':
        return {
          icon: <XCircle className="w-8 h-8 text-red-600" />,
          title: 'Import Failed',
          description: errorMessage || 'An error occurred during import',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        }
    }
  }

  const statusConfig = getStatusConfig()
  const isInProgress = status === 'pending' || status === 'processing'
  const isComplete = status === 'completed'
  const isFailed = status === 'failed'

  return (
    <div className="space-y-6">
      {/* Status header */}
      <div
        className={`${statusConfig.bgColor} border ${statusConfig.borderColor} rounded-lg p-6 text-center`}
      >
        <div className="flex justify-center mb-4">{statusConfig.icon}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{statusConfig.title}</h2>
        <p className="text-gray-600">{statusConfig.description}</p>
      </div>

      {/* Progress bar */}
      {isInProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-emerald-600 h-full transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 text-center">
            {processedBooks} of {totalBooks} books processed
          </p>
        </div>
      )}

      {/* Stats grid */}
      {(isComplete || (isInProgress && processedBooks > 0)) && (
        <div className="grid grid-cols-3 gap-4">
          {/* Total */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <TrendingUp className="w-5 h-5 text-gray-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{totalBooks}</p>
            <p className="text-sm text-gray-600">Total</p>
          </div>

          {/* Successful */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-900">{successfulImports}</p>
            <p className="text-sm text-emerald-700">Imported</p>
          </div>

          {/* Failed */}
          {failedImports > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <AlertTriangle className="w-5 h-5 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-900">{failedImports}</p>
              <p className="text-sm text-amber-700">Skipped</p>
            </div>
          )}
        </div>
      )}

      {/* Error details */}
      {isFailed && errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-900 mb-1">Error Details</p>
              <p className="text-sm text-red-800">{errorMessage}</p>
              {metadata?.errors && Array.isArray(metadata.errors) && (
                <ul className="mt-2 space-y-1">
                  {metadata.errors.map((err: string, idx: number) => (
                    <li key={idx} className="text-xs text-red-700">
                      • {err}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warnings for partial failures */}
      {isComplete && failedImports > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-900 mb-1">Some books were skipped</p>
              <p className="text-sm text-amber-800">
                {failedImports} books couldn't be imported. This usually happens when books are missing key information
                like title or author. Your other {successfulImports} books were imported successfully.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {isComplete && (
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/books')}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            View My Books
          </button>
          <button
            onClick={() => router.push('/feed')}
            className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            Go to Feed
          </button>
        </div>
      )}

      {isFailed && (
        <button
          onClick={() => router.push('/import/goodreads')}
          className="w-full px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Try Again
        </button>
      )}

      {/* Loading message */}
      {isInProgress && (
        <p className="text-sm text-gray-500 text-center">
          This may take a few minutes depending on your library size. Feel free to navigate away—we'll keep working in
          the background.
        </p>
      )}
    </div>
  )
}

