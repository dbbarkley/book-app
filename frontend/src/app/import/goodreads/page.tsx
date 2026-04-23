'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { GoodreadsImportInstructions } from '@/components/GoodreadsImportInstructions'
import { CsvUploader } from '@/components/CsvUploader'
import { ImportPreview } from '@/components/ImportPreview'
import { ImportProgress } from '@/components/ImportProgress'
import { useGoodreadsImport, useImportStatus, useOnboarding, useAuth } from '@book-app/shared'

interface ParsedBook {
  title: string
  author: string
  shelf: string
  rating?: number
}

interface ParsedCsvData {
  totalBooks: number
  booksByShelf: {
    read: number
    'currently-reading': number
    'to-read': number
    other: number
  }
  sampleBooks: ParsedBook[]
}

const parseCsvForPreview = async (file: File): Promise<ParsedCsvData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n')
        const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))

        const titleIdx = headers.findIndex((h) => h === 'Title')
        const authorIdx = headers.findIndex((h) => h === 'Author')
        const shelfIdx = headers.findIndex((h) => h === 'Exclusive Shelf')
        const ratingIdx = headers.findIndex((h) => h === 'My Rating')

        const books: ParsedBook[] = []
        const shelfCounts = { read: 0, 'currently-reading': 0, 'to-read': 0, other: 0 }

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          const values: string[] = []
          let current = ''
          let inQuotes = false

          for (let j = 0; j < line.length; j++) {
            const char = line[j]
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim())
              current = ''
            } else {
              current += char
            }
          }
          values.push(current.trim())

          const title = values[titleIdx]?.replace(/"/g, '').trim()
          const author = values[authorIdx]?.replace(/"/g, '').trim()
          const shelfRaw = values[shelfIdx]?.replace(/"/g, '').trim().toLowerCase()
          const rating = parseInt(values[ratingIdx]?.replace(/"/g, '').trim() || '0', 10)
          let shelf = 'to-read'

          if (shelfRaw === 'read' || values[headers.findIndex((h) => h === 'Date Read')]?.trim()) {
            shelf = 'read'
          } else if (shelfRaw === 'currently-reading' || shelfRaw === 'currently reading') {
            shelf = 'currently-reading'
          } else if (shelfRaw === 'to-read' || shelfRaw === 'to read') {
            shelf = 'to-read'
          }

          if (!title || !author) continue

          books.push({ title, author, shelf, rating })

          if (shelf === 'read') shelfCounts.read++
          else if (shelf === 'currently-reading') shelfCounts['currently-reading']++
          else if (shelf === 'to-read') shelfCounts['to-read']++
          else shelfCounts.other++
        }

        resolve({ totalBooks: books.length, booksByShelf: shelfCounts, sampleBooks: books.slice(0, 10) })
      } catch {
        reject(new Error('Failed to parse CSV'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

export default function GoodreadsImportPage() {
  const router = useRouter()
  const { uploadCsv, isUploading, error: uploadError } = useGoodreadsImport()
  const { submitPreferences } = useOnboarding()
  const { refreshUser } = useAuth()

  const [step, setStep] = useState<'upload' | 'preview' | 'progress'>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<ParsedCsvData | null>(null)
  const [isParsingPreview, setIsParsingPreview] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [importId, setImportId] = useState<number | null>(null)
  const { status } = useImportStatus(importId, step === 'progress')

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file)
    setParseError(null)
    setIsParsingPreview(true)
    try {
      const parsed = await parseCsvForPreview(file)
      setPreviewData(parsed)
      setStep('preview')
    } catch {
      setParseError('Failed to parse CSV. Please ensure it is a valid Goodreads export.')
    } finally {
      setIsParsingPreview(false)
    }
  }

  const handleConfirmImport = async () => {
    if (!selectedFile) return
    try {
      const result = await uploadCsv(selectedFile)
      setImportId(result.id)
      setStep('progress')
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const handleCancelPreview = () => {
    setStep('upload')
    setSelectedFile(null)
    setPreviewData(null)
  }

  const handleBack = () => {
    if (step === 'preview') handleCancelPreview()
    else router.back()
  }

  const handleFinish = async (targetPath: string) => {
    try {
      await submitPreferences()
      await refreshUser()
    } catch {
      // best effort
    } finally {
      router.push(targetPath)
    }
  }

  const stepLabel = step === 'upload' ? 'Upload CSV' : step === 'preview' ? 'Preview' : 'Importing'

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-canvas)' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--color-rim)', backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-2xl mx-auto px-4 py-5">
          {step !== 'progress' && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 mb-4 text-sm font-medium transition-all hover:opacity-70"
              style={{ color: 'var(--color-lit-3)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <h1 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-lit)' }}>
            Import from Goodreads
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-lit-3)' }}>{stepLabel}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Step: Upload */}
        {step === 'upload' && (
          <>
            <GoodreadsImportInstructions />
            <div className="rounded-2xl p-6"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)' }}>
              <h2 className="font-serif text-lg font-bold mb-4" style={{ color: 'var(--color-lit)' }}>
                Upload Your CSV
              </h2>
              <CsvUploader
                onFileSelected={handleFileSelected}
                isLoading={isParsingPreview}
                error={parseError || uploadError}
              />
              {isParsingPreview && (
                <p className="text-sm mt-4 text-center" style={{ color: 'var(--color-lit-3)' }}>
                  Parsing your CSV for preview…
                </p>
              )}
            </div>
          </>
        )}

        {/* Step: Preview */}
        {step === 'preview' && previewData && (
          <div className="rounded-2xl p-6"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)' }}>
            <ImportPreview
              totalBooks={previewData.totalBooks}
              booksByShelf={previewData.booksByShelf}
              sampleBooks={previewData.sampleBooks}
              onConfirm={handleConfirmImport}
              onCancel={handleCancelPreview}
              isLoading={isUploading}
            />
          </div>
        )}

        {/* Step: Progress */}
        {step === 'progress' && status && (
          <div className="rounded-2xl p-6"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)' }}>
            <ImportProgress
              status={status.status}
              totalBooks={status.total_books}
              processedBooks={status.processed_books}
              successfulImports={status.successful_imports}
              failedImports={status.failed_imports}
              progressPercentage={status.progress_percentage}
              errorMessage={status.error_message}
              metadata={status.metadata}
              onViewBooks={() => handleFinish('/library')}
              onGoToFeed={() => handleFinish('/dashboard')}
            />
          </div>
        )}
      </div>
    </div>
  )
}
