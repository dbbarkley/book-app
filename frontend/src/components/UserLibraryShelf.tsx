'use client'

import type { UserBook } from '@book-app/shared'
import BookCard from './BookCard'

interface UserLibraryShelfProps {
  userBooks: UserBook[]
  emptyMessage: string
  shelfName: string
}

export default function UserLibraryShelf({
  userBooks,
  emptyMessage,
  shelfName,
}: UserLibraryShelfProps) {
  if (userBooks.length === 0) {
    return (
      <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
        <div className="mb-3 text-4xl">📚</div>
        <p className="text-slate-500 font-medium">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
      {userBooks.map((ub) => (
        <BookCard
          key={ub.id}
          book={ub.book!}
          userBook={ub}
          showDescription={false}
          coverSize="medium"
        />
      ))}
    </div>
  )
}

