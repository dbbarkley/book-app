'use client'

import { useRouter } from 'next/navigation'
import { Heart, Pencil, Plus, RotateCcw, Diamond, Sparkles, BookOpen, Bookmark, Star } from 'lucide-react'
import type { UserList, UserListItem } from '@book-app/shared'
import { BookCoverImage } from './BookCoverImage'

interface UserListsCardProps {
  lists: UserList[]
  top10: UserList | null
  isOwnProfile: boolean
  onToggleTop10Like: () => void
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const BOOK_BG_COLORS = [
  '#183F4F', '#1A3D2A', '#1B3520', '#1E2D18', '#3B2815',
  '#1A1F58', '#2A1838', '#200808', '#280808', '#183A22',
]

function rankStyle(pos: number): { bg: string; color: string } {
  if (pos === 1) return { bg: '#F1C75B', color: '#1A1A1A' }
  if (pos <= 3)  return { bg: '#D5582E', color: '#FAF6EB' }
  return { bg: '#1A1A1A', color: '#FAF6EB' }
}

// ── Book card ──────────────────────────────────────────────────────────────────

function BookCard({ item }: { item: UserListItem }) {
  const router  = useRouter()
  const rank    = rankStyle(item.position)
  const bgColor = BOOK_BG_COLORS[(item.position - 1) % BOOK_BG_COLORS.length]

  return (
    <button
      onClick={() => router.push(`/books/${item.book.google_books_id ?? item.book.id}`)}
      className="text-left w-full"
      style={{ paddingTop: 14 }}
    >
      <div style={{ position: 'relative' }}>
        {/* Rank badge — pops above the card */}
        <div
          className="flex items-center justify-center font-bold absolute z-10"
          style={{
            top: -14, left: 8,
            width: 26, height: 26,
            borderRadius: '50%',
            backgroundColor: rank.bg,
            border: '2px solid var(--color-ink)',
            fontSize: 11,
            color: rank.color,
          }}
        >
          {item.position}
        </div>

        {/* Card */}
        <div
          style={{
            aspectRatio: '2/3',
            borderRadius: 8,
            overflow: 'hidden',
            border: '2px solid var(--color-ink)',
            boxShadow: '3px 3px 0px var(--color-accent)',
            position: 'relative',
            backgroundColor: bgColor,
          }}
        >
          {item.book.cover_image_url && (
            <BookCoverImage
              src={item.book.cover_image_url}
              title={item.book.title}
              author={item.book.author_name}
              size="small"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Gradient overlay for legibility */}
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 35%, rgba(0,0,0,0.72) 65%)',
            }}
          />

          {/* Author — top */}
          {item.book.author_name && (
            <p
              className="absolute font-bold uppercase"
              style={{
                top: 8, left: 8, right: 8,
                fontSize: 8, letterSpacing: '0.14em',
                color: 'rgba(255,255,255,0.72)',
                lineHeight: 1.3,
              }}
            >
              {item.book.author_name}
            </p>
          )}

          {/* Spine line */}
          <div
            style={{
              position: 'absolute', left: 8, right: 8,
              top: '58%', height: 1,
              backgroundColor: 'rgba(255,255,255,0.15)',
            }}
          />

          {/* Title — bottom */}
          <p
            className="absolute font-serif font-bold"
            style={{
              bottom: 8, left: 8, right: 8,
              fontSize: 13, lineHeight: 1.25,
              color: '#FAF6EB',
            }}
          >
            {item.book.title}
          </p>
        </div>
      </div>

      {/* Title below card */}
      <p
        className="line-clamp-2 mt-1.5"
        style={{ fontSize: 10, color: 'var(--color-ink)', lineHeight: 1.35 }}
      >
        {item.book.title}
      </p>
    </button>
  )
}

// ── Top 10 card ────────────────────────────────────────────────────────────────

function Top10Card({
  top10,
  isOwnProfile,
  onToggleTop10Like,
}: {
  top10: UserList | null
  isOwnProfile: boolean
  onToggleTop10Like: () => void
}) {
  const router = useRouter()
  const items  = top10?.items ?? []

  return (
    <div
      style={{
        backgroundColor: 'var(--color-canvas)',
        border: '2px solid var(--color-ink)',
        borderRadius: 20,
        boxShadow: '5px 5px 0px var(--color-accent)',
        padding: '22px 22px 24px',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p
            className="font-bold uppercase"
            style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--color-accent)', marginBottom: 4 }}
          >
            My Top 10
          </p>
          <h3
            className="font-serif font-black leading-tight"
            style={{ fontSize: 26, color: 'var(--color-ink)' }}
          >
            The shelf I&apos;d save
          </h3>
          <h3
            className="font-serif font-black leading-tight"
            style={{ fontSize: 26, color: 'var(--color-accent)', fontStyle: 'italic' }}
          >
            from a house fire.
          </h3>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          {top10 && top10.likes_count > 0 && (
            <span
              className="flex items-center gap-1.5 font-bold"
              style={{
                fontSize: 12, letterSpacing: '0.05em',
                border: '2px solid var(--color-ink)',
                borderRadius: 999,
                padding: '7px 14px',
                color: 'var(--color-ink)',
              }}
            >
              <Heart size={12} strokeWidth={2} />
              {top10.likes_count}
            </span>
          )}
          {isOwnProfile ? (
            <button
              onClick={() => router.push('/settings?tab=lists')}
              className="flex items-center gap-1.5 font-bold uppercase transition-opacity hover:opacity-70"
              style={{
                fontSize: 11, letterSpacing: '0.12em',
                border: '2px solid var(--color-ink)',
                borderRadius: 999,
                padding: '7px 14px',
                color: 'var(--color-ink)',
                backgroundColor: 'transparent',
              }}
            >
              Edit <Pencil size={11} strokeWidth={2.5} />
            </button>
          ) : top10 ? (
            <button
              onClick={onToggleTop10Like}
              className="flex items-center gap-1.5 font-bold uppercase transition-opacity hover:opacity-70"
              style={{
                fontSize: 11, letterSpacing: '0.12em',
                border: '2px solid var(--color-ink)',
                borderRadius: 999,
                padding: '7px 14px',
                backgroundColor: top10.liked_by_current_user ? 'var(--color-ink)' : 'transparent',
                color: top10.liked_by_current_user ? 'var(--color-canvas)' : 'var(--color-ink)',
              }}
            >
              <Heart size={11} strokeWidth={2.5} />
              {top10.liked_by_current_user ? 'Liked' : 'Like'}
            </button>
          ) : null}
        </div>
      </div>

      {/* Book grid */}
      {items.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 10,
          }}
        >
          {items.map(item => (
            <BookCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p
          className="text-center"
          style={{ fontSize: 13, color: 'var(--color-ink-3)', padding: '16px 0' }}
        >
          {isOwnProfile ? "You haven't added any books yet." : "No books added yet."}
        </p>
      )}
    </div>
  )
}

// ── Custom lists ───────────────────────────────────────────────────────────────

const LIST_ICONS   = [RotateCcw, Diamond, Sparkles, BookOpen, Bookmark, Star]
const LIST_ICON_BG = ['#D5582E', '#234A5A', '#F1C75B', '#2D6A4F', '#8B3A2A', '#5B7FA6']
const LIST_SHADOWS = [
  '5px 5px 0px var(--color-accent)',
  '5px 5px 0px var(--color-accent-teal)',
  '5px 5px 0px var(--color-accent-yellow)',
  '5px 5px 0px #2D6A4F',
  '5px 5px 0px #8B3A2A',
  '5px 5px 0px #5B7FA6',
]

const MINI_BG_COLORS = [
  '#183F4F', '#1A3D2A', '#1B3520', '#1E2D18', '#3B2815',
  '#1A1F58', '#2A1838', '#200808', '#280808', '#183A22',
]

function MiniFan({ items }: { items: UserListItem[] }) {
  const display = items.slice(0, 5)
  const CARD_W  = 72
  const OVERLAP = 46  // px each card steps right

  return (
    <div
      style={{
        position: 'relative',
        height: 108,
        width: CARD_W + (display.length - 1) * OVERLAP,
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      {display.map((item, i) => {
        const bg = MINI_BG_COLORS[i % MINI_BG_COLORS.length]
        return (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              left: i * OVERLAP,
              top: 0,
              width: CARD_W,
              height: 108,
              borderRadius: 6,
              overflow: 'hidden',
              border: '2px solid var(--color-ink)',
              backgroundColor: bg,
              zIndex: i,
            }}
          >
            {item.book.cover_image_url && (
              <BookCoverImage
                src={item.book.cover_image_url}
                title={item.book.title}
                author={item.book.author_name}
                size="small"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div
              style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, transparent 35%, rgba(0,0,0,0.75) 65%)',
              }}
            />
            {item.book.author_name && (
              <p
                className="absolute font-bold uppercase"
                style={{
                  top: 5, left: 5, right: 5,
                  fontSize: 7, letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.65)',
                  lineHeight: 1.2,
                }}
              >
                {item.book.author_name}
              </p>
            )}
            <p
              className="absolute font-serif font-bold"
              style={{
                bottom: 5, left: 5, right: 5,
                fontSize: 11, lineHeight: 1.2,
                color: '#FAF6EB',
              }}
            >
              {item.book.title}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function CustomListsCard({
  lists,
  isOwnProfile,
}: {
  lists: UserList[]
  isOwnProfile: boolean
}) {
  const router    = useRouter()
  const cardBasis = lists.length <= 2 ? 'calc(50% - 6px)' : 'calc(33.333% - 8px)'

  if (!isOwnProfile && lists.length === 0) return null

  return (
    <div>
      {/* Section header — outside the scrollable area */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p
            className="font-bold uppercase"
            style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--color-accent-teal)', marginBottom: 4 }}
          >
            Custom Lists
          </p>
          <h3
            className="font-serif font-bold leading-tight"
            style={{ fontSize: 22, color: 'var(--color-ink)' }}
          >
            Other shelves{' '}
            <em style={{ color: 'var(--color-accent-teal)', fontStyle: 'italic' }}>in rotation</em>
          </h3>
        </div>
        {isOwnProfile && (
          <button
            onClick={() => router.push('/settings?tab=lists')}
            className="flex items-center gap-1.5 font-bold uppercase transition-opacity hover:opacity-80"
            style={{
              fontSize: 11, letterSpacing: '0.12em',
              backgroundColor: 'var(--color-accent-teal)',
              color: '#FAF6EB',
              border: '2px solid var(--color-ink)',
              borderRadius: 999,
              padding: '9px 18px',
              marginTop: 4,
              flexShrink: 0,
            }}
          >
            New List <Plus size={12} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {lists.length > 0 ? (
        /* Horizontally scrollable row */
        <div
          className="scrollbar-hide"
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            paddingBottom: 4,
          }}
        >
          {lists.map((list, i) => {
            const Icon    = LIST_ICONS[i % LIST_ICONS.length]
            const iconBg  = LIST_ICON_BG[i % LIST_ICON_BG.length]
            const shadow  = LIST_SHADOWS[i % LIST_SHADOWS.length]
            const iconColor = iconBg === '#F1C75B' ? '#1A1A1A' : '#FAF6EB'

            return (
              <button
                key={list.id}
                onClick={() => router.push(`/lists/${list.id}`)}
                className="text-left flex-none transition-opacity hover:opacity-80"
                style={{
                  width: cardBasis,
                  minWidth: 220,
                  backgroundColor: 'var(--color-canvas)',
                  border: '2px solid var(--color-ink)',
                  borderRadius: 16,
                  boxShadow: shadow,
                  padding: '16px 16px 18px',
                }}
              >
                {/* Card header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 36, height: 36,
                      borderRadius: 8,
                      backgroundColor: iconBg,
                      border: '2px solid var(--color-ink)',
                    }}
                  >
                    <Icon size={16} strokeWidth={2} style={{ color: iconColor }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif font-bold truncate" style={{ fontSize: 15, color: 'var(--color-ink)' }}>
                      {list.name}
                    </p>
                    {typeof list.items_count === 'number' && (
                      <p className="font-bold uppercase" style={{ fontSize: 9, letterSpacing: '0.15em', color: 'var(--color-ink-3)', marginTop: 1 }}>
                        {list.items_count} Book{list.items_count !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* Book fan */}
                {list.items && list.items.length > 0 && (
                  <MiniFan items={list.items} />
                )}
              </button>
            )
          })}
        </div>
      ) : isOwnProfile ? (
        <div
          style={{
            backgroundColor: 'var(--color-canvas)',
            border: '2px solid var(--color-ink)',
            borderRadius: 16,
            padding: '28px 24px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 14, color: 'var(--color-ink-3)' }}>
            No custom lists yet — create your first one.
          </p>
        </div>
      ) : null}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function UserListsCard({
  lists,
  top10,
  isOwnProfile,
  onToggleTop10Like,
}: UserListsCardProps) {
  const customLists = lists.filter(l => l.list_type !== 'top_10')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {(top10 || isOwnProfile) && (
        <Top10Card
          top10={top10}
          isOwnProfile={isOwnProfile}
          onToggleTop10Like={onToggleTop10Like}
        />
      )}
      {(customLists.length > 0 || isOwnProfile) && (
        <CustomListsCard lists={customLists} isOwnProfile={isOwnProfile} />
      )}
    </div>
  )
}
