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
  onViewBooks?: () => void
  onGoToFeed?: () => void
}

export function ImportProgress({
  status,
  totalBooks,
  processedBooks,
  successfulImports,
  failedImports,
  progressPercentage,
  errorMessage,
  metadata,
  onViewBooks,
  onGoToFeed,
}: ImportProgressProps) {
  const router = useRouter()

  const handleViewBooks = () => (onViewBooks ? onViewBooks() : router.push('/library'))
  const handleGoToDashboard = () => (onGoToFeed ? onGoToFeed() : router.push('/dashboard'))

  const isInProgress = status === 'pending' || status === 'processing'
  const isComplete = status === 'completed'
  const isFailed = status === 'failed'

  const statusConfig = {
    pending: {
      icon: <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />,
      title: 'Preparing Import…',
      desc: 'Your books are being queued',
    },
    processing: {
      icon: <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />,
      title: 'Importing Your Books…',
      desc: `Processing ${processedBooks} of ${totalBooks} books`,
    },
    completed: {
      icon: <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />,
      title: 'Import Complete!',
      desc: `Successfully imported ${successfulImports} books`,
    },
    failed: {
      icon: <XCircle className="w-8 h-8" style={{ color: 'var(--color-error)' }} />,
      title: 'Import Failed',
      desc: errorMessage || 'An error occurred during import',
    },
  }[status]

  return (
    <div className="space-y-6">
      {/* Status header */}
      <div className="rounded-2xl p-6 text-center"
        style={{
          backgroundColor: isFailed ? 'rgba(220,38,38,0.08)' : 'var(--color-grove)',
          border: `1px solid ${isFailed ? 'rgba(220,38,38,0.3)' : 'var(--color-rim)'}`,
        }}>
        <div className="flex justify-center mb-4">{statusConfig.icon}</div>
        <h2 className="font-serif text-2xl font-bold mb-1" style={{ color: 'var(--color-lit)' }}>
          {statusConfig.title}
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-lit-2)' }}>{statusConfig.desc}</p>
      </div>

      {/* Progress bar */}
      {isInProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium" style={{ color: 'var(--color-lit-3)' }}>
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: 'var(--color-grove)' }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%`, backgroundColor: 'var(--color-accent)' }}
            />
          </div>
          <p className="text-xs text-center" style={{ color: 'var(--color-lit-3)' }}>
            {processedBooks} of {totalBooks} books processed
          </p>
        </div>
      )}

      {/* Stats */}
      {(isComplete || (isInProgress && processedBooks > 0)) && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: TrendingUp, label: 'Total', value: totalBooks },
            { icon: CheckCircle2, label: 'Imported', value: successfulImports },
            ...(failedImports > 0 ? [{ icon: AlertTriangle, label: 'Skipped', value: failedImports }] : []),
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl p-4 text-center"
              style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}>
              <Icon className="w-4 h-4 mx-auto mb-2" style={{ color: 'var(--color-accent)' }} />
              <p className="text-xl font-bold" style={{ color: 'var(--color-lit)' }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-lit-3)' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Error details */}
      {isFailed && errorMessage && (
        <div className="rounded-xl p-4 flex gap-3"
          style={{ backgroundColor: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)' }}>
          <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-error)' }} />
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-error)' }}>Error Details</p>
            <p className="text-sm" style={{ color: 'var(--color-lit-2)' }}>{errorMessage}</p>
            {metadata?.errors && Array.isArray(metadata.errors) && (
              <ul className="mt-2 space-y-1">
                {metadata.errors.map((err: string, idx: number) => (
                  <li key={idx} className="text-xs" style={{ color: 'var(--color-lit-3)' }}>· {err}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Partial failure warning */}
      {isComplete && failedImports > 0 && (
        <div className="rounded-xl p-4 flex gap-3"
          style={{ backgroundColor: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)' }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }} />
          <div>
            <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-lit)' }}>Some books were skipped</p>
            <p className="text-sm" style={{ color: 'var(--color-lit-2)' }}>
              {failedImports} books couldn't be imported — usually missing title or author.
              Your other {successfulImports} books were imported successfully.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      {isComplete && (
        <div className="flex gap-3">
          <button
            onClick={handleViewBooks}
            className="flex-1 py-3 px-5 rounded-xl font-bold text-sm transition-all hover:opacity-80"
            style={{ backgroundColor: 'var(--color-grove)', color: 'var(--color-lit-2)', border: '1px solid var(--color-rim)' }}
          >
            View My Books
          </button>
          <button
            onClick={handleGoToDashboard}
            className="flex-1 py-3 px-5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
          >
            Go to Dashboard
          </button>
        </div>
      )}

      {isFailed && (
        <button
          onClick={() => router.push('/import/goodreads')}
          className="w-full py-3 px-5 rounded-xl font-bold text-sm transition-all hover:opacity-80"
          style={{ backgroundColor: 'var(--color-grove)', color: 'var(--color-lit-2)', border: '1px solid var(--color-rim)' }}
        >
          Try Again
        </button>
      )}

      {isInProgress && (
        <p className="text-xs text-center" style={{ color: 'var(--color-lit-3)' }}>
          This may take a few minutes depending on your library size. Feel free to navigate away — we'll keep working in the background.
        </p>
      )}
    </div>
  )
}
