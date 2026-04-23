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
        return <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
      case 'currently-reading':
        return <BookOpen className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
      case 'to-read':
        return <BookMarked className="w-4 h-4" style={{ color: 'var(--color-lit-3)' }} />
      default:
        return <Book className="w-4 h-4" style={{ color: 'var(--color-lit-3)' }} />
    }
  }

  const getShelfLabel = (shelf: string) => {
    switch (shelf.toLowerCase()) {
      case 'read': return 'Read'
      case 'currently-reading': return 'Currently Reading'
      case 'to-read': return 'Want to Read'
      default: return shelf
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl font-bold mb-1" style={{ color: 'var(--color-lit)' }}>
          Preview Your Import
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-lit-2)' }}>
          We found <span className="font-semibold" style={{ color: 'var(--color-lit)' }}>{totalBooks} books</span> in
          your Goodreads export. Review below and confirm to start importing.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: totalBooks, icon: Book },
          { label: 'Read', value: booksByShelf.read, icon: CheckCircle2 },
          { label: 'Reading', value: booksByShelf['currently-reading'], icon: BookOpen },
          { label: 'To Read', value: booksByShelf['to-read'], icon: BookMarked },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl p-4 text-center"
            style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}>
            <Icon className="w-4 h-4 mx-auto mb-2" style={{ color: 'var(--color-accent)' }} />
            <p className="text-xl font-bold" style={{ color: 'var(--color-lit)' }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-lit-3)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Sample books */}
      {sampleBooks.length > 0 && (
        <div className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--color-rim)' }}>
          <div className="px-4 py-3" style={{ backgroundColor: 'var(--color-grove)', borderBottom: '1px solid var(--color-rim)' }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-lit-3)' }}>
              Sample Books
            </p>
          </div>
          <div style={{ backgroundColor: 'var(--color-surface)' }}>
            {sampleBooks.slice(0, 5).map((book, index) => (
              <div key={index} className="flex items-start gap-3 px-4 py-3"
                style={{ borderBottom: index < Math.min(sampleBooks.length, 5) - 1 ? '1px solid var(--color-rim)' : 'none' }}>
                <div className="pt-0.5">{getShelfIcon(book.shelf)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-lit)' }}>{book.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-lit-3)' }}>{book.author}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs" style={{ color: 'var(--color-lit-3)' }}>{getShelfLabel(book.shelf)}</span>
                    {book.rating && book.rating > 0 && (
                      <>
                        <span style={{ color: 'var(--color-rim)' }}>·</span>
                        <span className="text-xs" style={{ color: 'var(--color-accent)' }}>{'★'.repeat(book.rating)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {sampleBooks.length > 5 && (
            <div className="px-4 py-3 text-center" style={{ borderTop: '1px solid var(--color-rim)', backgroundColor: 'var(--color-grove)' }}>
              <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>
                …and {sampleBooks.length - 5} more books
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 py-3 px-5 rounded-xl font-bold text-sm transition-all hover:opacity-80 disabled:opacity-40"
          style={{ backgroundColor: 'var(--color-grove)', color: 'var(--color-lit-2)', border: '1px solid var(--color-rim)' }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 py-3 px-5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
        >
          {isLoading ? 'Starting…' : 'Start Import'}
        </button>
      </div>
    </div>
  )
}
