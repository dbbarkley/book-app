'use client'

import { useRouter } from 'next/navigation'
import { List, Plus } from 'lucide-react'
import type { UserList, UserListItem } from '@book-app/shared'
import { BookCoverImage } from './BookCoverImage'

interface UserListsCardProps {
  /** All of the user's public lists (includes the top-10 list). */
  lists: UserList[]
  /** The top-10 list, if any. */
  top10: UserList | null
  isOwnProfile: boolean
  /** Toggles a like on the top-10 list (other-profile only). */
  onToggleTop10Like: () => void
}

const divider = <div style={{ height: 1, background: 'var(--color-rim)' }} />

// Horizontal strip of book covers with rank badges.
function BookStrip({ items, top }: { items: UserListItem[]; top?: boolean }) {
  const router = useRouter()
  return (
    <div
      className="flex overflow-x-auto scrollbar-hide"
      style={{ gap: 10, padding: '0 16px 4px' }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => router.push(`/books/${item.book.google_books_id ?? item.book.id}`)}
          className="flex flex-col flex-none text-left"
          style={{ width: 90, gap: 5 }}
        >
          <div className="relative">
            <span
              className="absolute z-10"
              style={{
                top: 6,
                left: 6,
                borderRadius: 8,
                padding: '2px 6px',
                fontSize: 11,
                fontWeight: 800,
                backgroundColor:
                  top && item.position === 1 ? 'rgba(255,180,0,0.85)' : 'rgba(0,0,0,0.65)',
                color: top && item.position === 1 ? '#1a1000' : '#fff',
              }}
            >
              #{item.position}
            </span>
            <div className="w-full overflow-hidden rounded-xl" style={{ aspectRatio: '2/3' }}>
              <BookCoverImage
                src={item.book.cover_image_url}
                title={item.book.title}
                author={item.book.author_name}
                size="small"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <p
            className="line-clamp-2"
            style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-lit)', lineHeight: '15px' }}
          >
            {item.book.title}
          </p>
          {item.book.author_name && (
            <p className="truncate" style={{ fontSize: 10, color: 'var(--color-lit-3)' }}>
              {item.book.author_name}
            </p>
          )}
        </button>
      ))}
    </div>
  )
}

/**
 * UserListsCard — unified card containing the user's Top 10 and custom lists,
 * with internal dividers. Mirrors the mobile `ListsCard`.
 */
export default function UserListsCard({
  lists,
  top10,
  isOwnProfile,
  onToggleTop10Like,
}: UserListsCardProps) {
  const router = useRouter()
  const customLists = lists.filter((l) => l.list_type !== 'top_10')

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderRadius: 20,
        border: '1px solid var(--color-rim)',
        overflow: 'hidden',
      }}
    >
      {/* ── My Top 10 ── */}
      <div style={{ padding: '16px 16px 12px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <div className="flex items-center gap-2">
            <List size={15} style={{ color: 'var(--color-accent)' }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-lit)' }}>My Top 10</h3>
            {top10 && top10.likes_count > 0 && (
              <span
                className="flex items-center gap-1"
                style={{
                  backgroundColor: 'var(--color-grove)',
                  border: '1px solid var(--color-rim)',
                  borderRadius: 9999,
                  padding: '2px 7px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--color-accent)',
                }}
              >
                ♥ {top10.likes_count}
              </span>
            )}
          </div>
          {isOwnProfile ? (
            <button
              onClick={() => router.push('/settings?tab=lists')}
              style={{
                background: 'var(--color-grove)',
                border: '1px solid var(--color-rim)',
                borderRadius: 10,
                padding: '6px 10px',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-lit-2)',
              }}
            >
              Edit
            </button>
          ) : top10 ? (
            <button
              onClick={onToggleTop10Like}
              style={{
                background: top10.liked_by_current_user ? 'var(--color-accent)' : 'var(--color-grove)',
                border: `1px solid ${top10.liked_by_current_user ? 'var(--color-accent)' : 'var(--color-rim)'}`,
                borderRadius: 10,
                padding: '6px 10px',
                fontSize: 12,
                fontWeight: 600,
                color: top10.liked_by_current_user ? 'var(--color-accent-on)' : 'var(--color-lit-2)',
              }}
            >
              {top10.liked_by_current_user ? '♥ Liked' : '♡ Like'}
            </button>
          ) : null}
        </div>
      </div>

      {top10?.items && top10.items.length > 0 ? (
        <BookStrip items={top10.items} top />
      ) : (
        <p
          className="text-center"
          style={{ fontSize: 13, color: 'var(--color-lit-3)', padding: '0 16px 16px' }}
        >
          {isOwnProfile ? "You haven't added any books yet." : "This user hasn't added any books yet."}
        </p>
      )}

      {divider}

      {/* ── My Lists ── */}
      <div style={{ padding: '16px 16px 12px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <div className="flex items-center gap-2">
            <List size={15} style={{ color: 'var(--color-accent)' }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-lit)' }}>My Lists</h3>
          </div>
          {isOwnProfile && (
            <button
              onClick={() => router.push('/settings?tab=lists')}
              style={{
                background: 'var(--color-accent)',
                borderRadius: 10,
                padding: '6px 10px',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--color-accent-on)',
              }}
            >
              New List
            </button>
          )}
        </div>
      </div>

      {customLists.length > 0 ? (
        <div style={{ paddingBottom: 12 }}>
          {customLists.map((list, i) => (
            <div key={list.id}>
              {i > 0 && divider}
              <button
                onClick={() => router.push(`/lists/${list.id}`)}
                className="w-full text-left"
                style={{ padding: '4px 0 8px' }}
              >
                <p
                  style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-lit)', padding: '0 16px', marginBottom: 8 }}
                >
                  {list.name}
                  {typeof list.items_count === 'number' && (
                    <span style={{ color: 'var(--color-lit-3)', fontWeight: 500 }}>
                      {'  '}· {list.items_count}
                    </span>
                  )}
                </p>
                {list.items && list.items.length > 0 && <BookStrip items={list.items} />}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center text-center"
          style={{ gap: 4, padding: '8px 16px 24px' }}
        >
          <Plus size={18} style={{ color: 'var(--color-lit-3)' }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-lit-2)' }}>
            Create your first list
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-lit-3)' }}>
            Top 5 Romance, Favourite Series…
          </p>
        </div>
      )}
    </div>
  )
}
