'use client'

import { Book, BookOpen, BookMarked, CheckCircle2 } from 'lucide-react'

interface BookPreview {
  title: string
  author: string
  shelf: string
  rating?: number
}

interface ImportPreviewProps {
  totalBooks: number
  booksByShelf: {
    read: number
    'currently-reading': number
    'to-read': number
    other: number
  }
  sampleBooks: BookPreview[]
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

/**
 * ImportPreview Component
 * 
 * Shows a preview of what will be imported before starting the actual import
 * Displays:
 * - Total book count
 * - Count by shelf (read, reading, to-read)
 * - Sample books from the CSV
 * - Confirmation CTA
 */
export function ImportPreview({
  totalBooks,
  booksByShelf,
  sampleBooks,
  onConfirm,
  onCancel,
  isLoading = false,
}: ImportPreviewProps) {
  const getShelfIcon = (shelf: string) => {
    switch (shelf.toLowerCase()) {
      case 'read':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />
      case 'currently-reading':
        return <BookOpen className="w-4 h-4 text-blue-600" />
      case 'to-read':
        return <BookMarked className="w-4 h-4 text-amber-600" />
      default:
        return <Book className="w-4 h-4 text-gray-600" />
    }
  }

  const getShelfLabel = (shelf: string) => {
    switch (shelf.toLowerCase()) {
      case 'read':
        return 'Read'
      case 'currently-reading':
        return 'Currently Reading'
      case 'to-read':
        return 'Want to Read'
      default:
        return shelf
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Preview Your Import</h2>
        <p className="text-gray-600">
          We found <span className="font-semibold text-gray-900">{totalBooks} books</span> in your Goodreads export.
          Review the details below and confirm to start importing.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Book className="w-5 h-5 text-gray-500" />
            <p className="text-sm font-medium text-gray-600">Total Books</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalBooks}</p>
        </div>

        {/* Read */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-700">Read</p>
          </div>
          <p className="text-2xl font-bold text-emerald-900">{booksByShelf.read}</p>
        </div>

        {/* Reading */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-blue-700">Reading</p>
          </div>
          <p className="text-2xl font-bold text-blue-900">{booksByShelf['currently-reading']}</p>
        </div>

        {/* To Read */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookMarked className="w-5 h-5 text-amber-600" />
            <p className="text-sm font-medium text-amber-700">To Read</p>
          </div>
          <p className="text-2xl font-bold text-amber-900">{booksByShelf['to-read']}</p>
        </div>
      </div>

      {/* Sample books */}
      {sampleBooks.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Sample Books</h3>
          <div className="space-y-3">
            {sampleBooks.slice(0, 5).map((book, index) => (
              <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="pt-1">{getShelfIcon(book.shelf)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{book.title}</p>
                  <p className="text-sm text-gray-600">{book.author}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{getShelfLabel(book.shelf)}</span>
                    {book.rating && book.rating > 0 && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs text-amber-600">{'★'.repeat(book.rating)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {sampleBooks.length > 5 && (
            <p className="text-sm text-gray-500 mt-3 text-center">
              ...and {sampleBooks.length - 5} more books
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Starting Import...' : 'Start Import'}
        </button>
      </div>
    </div>
  )
}

