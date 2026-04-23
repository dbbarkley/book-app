'use client'

import { useParams } from 'next/navigation'
import { useAuthorProfile } from '@book-app/shared'
import { BookList, FollowButton, Avatar } from '@/components'
import { formatNumber } from '@/utils/format'

const cardStyle = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-rim)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
}

export default function AuthorProfilePage() {
  const params = useParams()
  const authorId = parseInt(params.id as string, 10)
  const { author, books, loading, error, refetch } = useAuthorProfile(
    isNaN(authorId) ? null : authorId
  )

  if (loading) {
    return (
      <div className="container-mobile py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <p className="mt-4 text-lit-2">Loading author...</p>
        </div>
      </div>
    )
  }

  if (error || !author) {
    return (
      <div className="container-mobile py-12">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold text-lit mb-4">Author Not Found</h1>
          <p className="text-lit-2 mb-4">{error || "The author you're looking for doesn't exist."}</p>
          {error && (
            <button
              onClick={refetch}
              className="px-4 py-2 rounded-xl font-medium text-accent-on transition-colors"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container-mobile py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">

        {/* Author Header Card */}
        <div className="rounded-[28px] p-6 sm:p-8 mb-6" style={cardStyle}>
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              <Avatar src={author.avatar_url} name={author.name} size="2xl" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-lit mb-2">
                {author.name}
              </h1>
              {author.bio && (
                <p className="text-lit-2 leading-relaxed mb-4">{author.bio}</p>
              )}
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 mb-4 text-sm text-lit-2">
                {author.books_count !== undefined && (
                  <span>{formatNumber(author.books_count)} books</span>
                )}
                {author.followers_count !== undefined && (
                  <span>{formatNumber(author.followers_count)} followers</span>
                )}
              </div>
              {author.website_url && (
                <a
                  href={author.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent-hover text-sm mb-4 inline-block"
                >
                  Visit Website →
                </a>
              )}
              <div className="flex justify-center sm:justify-start">
                <FollowButton authorId={author.id} />
              </div>
            </div>
          </div>
        </div>

        {/* Books Section */}
        {books.length > 0 && (
          <div className="mb-6">
            <BookList books={books} title="Books" showDescription={false} gridCols={4} />
          </div>
        )}


      </div>
    </div>
  )
}
