'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { GoodreadsImportInstructions } from '@/components/GoodreadsImportInstructions'
import { CsvUploader } from '@/components/CsvUploader'
import { ImportPreview } from '@/components/ImportPreview'
import { ImportProgress } from '@/components/ImportProgress'
import { useGoodreadsImport, useImportStatus } from '@book-app/shared'

/**
 * Goodreads Import Page
 * 
 * Multi-step flow for importing Goodreads data:
 * 1. Instructions + CSV upload
 * 2. Preview parsed data
 * 3. Confirm and start import
 * 4. Show progress and completion
 * 
 * Can be accessed from:
 * - Onboarding flow
 * - User profile/settings
 * - Direct navigation
 */

// Helper to parse CSV client-side for preview
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

        // Find column indices
        const titleIdx = headers.findIndex((h) => h === 'Title')
        const authorIdx = headers.findIndex((h) => h === 'Author')
        const shelfIdx = headers.findIndex((h) => h === 'Exclusive Shelf')
        const ratingIdx = headers.findIndex((h) => h === 'My Rating')

        const books: ParsedBook[] = []
        const shelfCounts = {
          read: 0,
          'currently-reading': 0,
          'to-read': 0,
          other: 0,
        }

        // Parse each row (skip header)
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          // Simple CSV parsing (handles quoted fields)
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
          } else if (shelfRaw === 'dnf' || shelfRaw === 'did-not-finish') {
            shelf = 'dnf'
          }

          if (!title || !author) continue

          books.push({ title, author, shelf, rating })

          // Count by shelf
          if (shelf === 'read') {
            shelfCounts.read++
          } else if (shelf === 'currently-reading') {
            shelfCounts['currently-reading']++
          } else if (shelf === 'to-read') {
            shelfCounts['to-read']++
          } else {
            shelfCounts.other++
          }
        }

        resolve({
          totalBooks: books.length,
          booksByShelf: shelfCounts,
          sampleBooks: books.slice(0, 10), // First 10 books as sample
        })
      } catch (error) {
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

  // Step management
  const [step, setStep] = useState<'upload' | 'preview' | 'progress'>('upload')
  
  // Upload step state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Preview step state
  const [previewData, setPreviewData] = useState<ParsedCsvData | null>(null)
  const [isParsingPreview, setIsParsingPreview] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  // Progress step state
  const [importId, setImportId] = useState<number | null>(null)
  const { status, isLoading: isPolling } = useImportStatus(importId, step === 'progress')

  // Handle file selection
  const handleFileSelected = async (file: File) => {
    setSelectedFile(file)
    setParseError(null)
    setIsParsingPreview(true)

    try {
      const parsed = await parseCsvForPreview(file)
      setPreviewData(parsed)
      setStep('preview')
    } catch (error) {
      setParseError('Failed to parse CSV. Please ensure it is a valid Goodreads export.')
    } finally {
      setIsParsingPreview(false)
    }
  }

  // Handle import confirmation
  const handleConfirmImport = async () => {
    if (!selectedFile) return

    try {
      const result = await uploadCsv(selectedFile)
      setImportId(result.id)
      setStep('progress')
    } catch (error) {
      // Error is handled by the hook
      console.error('Upload failed:', error)
    }
  }

  // Handle cancel preview
  const handleCancelPreview = () => {
    setStep('upload')
    setSelectedFile(null)
    setPreviewData(null)
  }

  // Handle back button
  const handleBack = () => {
    if (step === 'preview') {
      handleCancelPreview()
    } else {
      router.back()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Import from Goodreads</h1>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-6">
            <GoodreadsImportInstructions />
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Your CSV</h2>
              <CsvUploader
                onFileSelected={handleFileSelected}
                isLoading={isParsingPreview}
                error={parseError || uploadError}
              />
              {isParsingPreview && (
                <p className="text-sm text-gray-500 mt-4 text-center">
                  Parsing your CSV for preview...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && previewData && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
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

        {/* Step 3: Progress */}
        {step === 'progress' && status && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <ImportProgress
              status={status.status}
              totalBooks={status.total_books}
              processedBooks={status.processed_books}
              successfulImports={status.successful_imports}
              failedImports={status.failed_imports}
              progressPercentage={status.progress_percentage}
              errorMessage={status.error_message}
              metadata={status.metadata}
            />
          </div>
        )}
      </div>
    </div>
  )
}

