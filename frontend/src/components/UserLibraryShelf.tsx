'use client'

import { BookOpen } from 'lucide-react'
import type { UserBook } from '@book-app/shared'
import BookCard from './BookCard'

interface UserLibraryShelfProps {
  userBooks: UserBook[]
  emptyMessage: string
  shelfName: string
}

export default function UserLibraryShelf({ userBooks, emptyMessage }: UserLibraryShelfProps) {
  if (userBooks.length === 0) {
    return (
      <div
        className="py-12 text-center rounded-2xl"
        style={{ backgroundColor: 'var(--color-grove)', border: '1px dashed var(--color-rim)' }}
      >
        <BookOpen size={28} className="mx-auto mb-3" style={{ color: 'var(--color-lit-3)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--color-lit-2)' }}>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {userBooks.map((ub, index) => (
        <BookCard
          key={ub.id}
          book={ub.book!}
          userBook={ub}
          showDescription={false}
          coverSize="medium"
          priority={index < 6}
        />
      ))}
    </div>
  )
}
