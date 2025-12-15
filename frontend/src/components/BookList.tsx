'use client'

// BookList Component - Displays a list of books
// Mobile-first design with TailwindCSS
// Reusable in Next.js and React Native (with minor adjustments)

import Link from 'next/link'
import type { Book } from '@book-app/shared'
import { formatDate } from '@/utils/format'
import BookCard from './BookCard'

interface BookListProps {
  books: Book[]
  title?: string
  showDescription?: boolean
  gridCols?: 2 | 3 | 4
  emptyMessage?: string
}

/**
 * Reusable BookList component for displaying books
 * 
 * Usage:
 * ```tsx
 * <BookList books={authorBooks} title="Books by Author" />
 * ```
 * 
 * For React Native:
 * - Replace Link with TouchableOpacity and navigation
 * - Adjust className to StyleSheet
 * - Use FlatList or ScrollView for better performance
 */
export default function BookList({
  books,
  title,
  showDescription = false,
  gridCols = 4,
  emptyMessage = 'No books found.',
}: BookListProps) {
  if (books.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-slate-500">{emptyMessage}</p>
      </div>
    )
  }

  const gridColsClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
  }[gridCols]

  return (
    <div>
      {title && (
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{title}</h2>
      )}
      <div className={`grid ${gridColsClass} gap-4`}>
        {books.map((book) => (
          <BookCard key={book.id} book={book} showDescription={showDescription} />
        ))}
      </div>
    </div>
  )
}

