'use strict'
/**
 * FeedCard — rich activity card with three visual variants:
 *
 *  'featured'  hero with blurred book-cover background
 *              (home screen milestone events: finished / review)
 *  'default'   left-accent-border card with inline enrichments (standard list)
 *  'compact'   single-row social pill (friend requests, follows)
 *
 * When variant is omitted it defaults to 'default', but social-type events
 * automatically collapse to 'compact' so callers don't need to handle this.
 */
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import {
  CheckCircle, Star, UserPlus, UserCheck,
  Sparkles, BookMarked, Rss,
} from 'lucide-react-native'
import type { FeedEntry } from '@book-app/shared'
import BookCover from '@/components/BookCover'
import ProgressBar from '@/components/ProgressBar'
import StarRating from '@/components/StarRating'
import { Colors } from '@/constants/colors'

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7)  return `${d}d`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** True for purely social events that warrant the compact pill treatment. */
export function isSocialType(t: string): boolean {
  return (
    t === 'friend_request' ||
    t === 'friend_accepted' ||
    t === 'user_followed_author' ||
    t === 'user_followed_user'
  )
}

/** Per-activity accent color for left stripes, badges, and icons. */
function typeAccentColor(t: string): string {
  switch (t) {
    case 'user_finished_book':    return '#C9A84C' // gold  — milestone
    case 'user_review':           return '#D4872A' // amber — thoughtful
    case 'user_progress_update':  return '#5A9B72' // green — momentum
    case 'user_added_book':       return '#5B7FA6' // steel — discovery
    case 'book_release':
    case 'book_recommendation':   return '#8B6CC7' // purple — exciting
    case 'friend_accepted':       return '#5A9B72' // green — connection
    case 'friend_request':        return Colors.accent
    default:                      return Colors.lit3
  }
}

/** Tiny round avatar with initials fallback. */
function Avatar({ uri, name, size = 36 }: { uri?: string; name?: string; size?: number }) {
  const initial = (name || '?').charAt(0).toUpperCase()
  const r = size / 2
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: r }}
      />
    )
  }
  return (
    <View
      style={{
        width: size, height: size, borderRadius: r,
        backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.38, fontWeight: '700', color: Colors.accent }}>
        {initial}
      </Text>
    </View>
  )
}

// ── Featured Card ─────────────────────────────────────────────────────────────
// Used on the home screen for high-impact events (finished book, review).
// Blurred cover background, large cover thumbnail, prominent book title.

function FeaturedCard({
  entry,
  accentColor,
}: {
  entry: FeedEntry
  accentColor: string
}) {
  const router = useRouter()
  const { activity_type, metadata, feedable, created_at } = entry

  const actor     = metadata?.actor
  const actorName = actor?.display_name || actor?.username || 'Someone'
  const fb        = feedable as Record<string, any> | null | undefined
  const book      = fb?.book || metadata?.book || (fb?.type === 'Book' ? fb : null)
  const bookId    = book?.google_books_id ?? (book?.id ? String(book.id) : null)

  const rating = metadata?.rating ?? fb?.rating
  const review = metadata?.review ?? fb?.review

  const isFinished = activity_type === 'user_finished_book'
  const isReview   = activity_type === 'user_review'

  const goToBook  = () => bookId && router.push(`/book/${bookId}`)
  const goToActor = () => actor?.id && router.push(`/users/${actor.id}`)

  const actionLabel = isFinished ? 'finished reading' : 'reviewed'

  return (
    <TouchableOpacity
      style={[featStyles.card, { borderColor: `${accentColor}44` }]}
      activeOpacity={0.88}
      onPress={goToBook}
      accessibilityRole="button"
      accessibilityLabel={`${actorName} ${actionLabel} ${book?.title ?? ''}`}
    >
      {/* Blurred cover background */}
      {book?.cover_image_url ? (
        <Image
          source={{ uri: book.cover_image_url }}
          style={featStyles.bgImage}
          blurRadius={26}
        />
      ) : null}
      {/* Dark scrim */}
      <View style={featStyles.scrim} />

      {/* Top row: event badge (left) + book cover (right) */}
      <View style={featStyles.topRow}>
        <View
          style={[
            featStyles.badge,
            { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}55` },
          ]}
        >
          {isFinished
            ? <CheckCircle size={11} color={accentColor} />
            : <Star size={11} color={accentColor} />}
          <Text style={[featStyles.badgeText, { color: accentColor }]}>
            {isFinished ? 'FINISHED' : 'REVIEW'}
          </Text>
        </View>

        {book ? (
          <TouchableOpacity onPress={goToBook} activeOpacity={0.85} hitSlop={6}>
            <BookCover
              uri={book.cover_image_url}
              title={book.title}
              author={book.author_name}
              width={66}
              borderRadius={10}
              priority="high"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.45,
                shadowRadius: 12,
                elevation: 10,
              }}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Actor row */}
      <TouchableOpacity
        style={featStyles.actorRow}
        onPress={goToActor}
        activeOpacity={0.8}
        hitSlop={6}
      >
        <Avatar uri={actor?.avatar_url} name={actorName} size={30} />
        <View>
          <Text style={featStyles.actorName} numberOfLines={1}>{actorName}</Text>
          <Text style={featStyles.actionLabel}>{actionLabel}</Text>
        </View>
      </TouchableOpacity>

      {/* Book title */}
      {book ? (
        <Text style={featStyles.bookTitle} numberOfLines={2}>{book.title}</Text>
      ) : null}

      {/* Star rating */}
      {isReview && rating != null ? (
        <StarRating rating={rating} size={14} />
      ) : null}

      {/* Review excerpt */}
      {review ? (
        <Text style={featStyles.excerpt} numberOfLines={2}>"{review}"</Text>
      ) : null}

      {/* Timestamp */}
      <Text style={featStyles.time}>{timeAgo(created_at)}</Text>
    </TouchableOpacity>
  )
}

// ── Compact Social Card ───────────────────────────────────────────────────────
// Single-row pill for friend requests, accepts, and follows.

function CompactCard({
  entry,
  accentColor,
}: {
  entry: FeedEntry
  accentColor: string
}) {
  const router = useRouter()
  const { activity_type, metadata, new: isNew, created_at } = entry

  const actor     = metadata?.actor
  const actorName = actor?.display_name || actor?.username || 'Someone'
  // friend_request / friend_accepted supply `metadata.user` (the other party)
  // user_followed_user supplies `metadata.followed_user` (the person being followed)
  const user         = metadata?.user
  const followedUser = metadata?.followed_user

  const goToUser = () => {
    // Navigate to the other person in the event, falling back to the actor
    const id = user?.id ?? followedUser?.id ?? actor?.id
    if (id) router.push(`/users/${id}`)
  }

  const displayName = user?.display_name || user?.username || actorName
  const displayUri  = user?.avatar_url ?? actor?.avatar_url

  const actionText =
    activity_type === 'friend_request'
      ? 'sent you a friend request'
      : activity_type === 'friend_accepted'
        ? 'accepted your friend request'
        : activity_type === 'user_followed_author'
          ? `started following ${metadata?.author?.name || 'an author'}`
          : activity_type === 'user_followed_user'
            ? `is now following ${followedUser?.display_name || followedUser?.username || 'someone'}`
            : activity_type.replace(/_/g, ' ')

  const Icon =
    activity_type === 'friend_request'  ? UserPlus :
    activity_type === 'friend_accepted' ? UserCheck : BookMarked

  return (
    <TouchableOpacity
      style={[compactStyles.card, isNew && { borderColor: `${accentColor}55` }]}
      onPress={goToUser}
      activeOpacity={0.8}
      hitSlop={4}
      accessibilityRole="button"
    >
      {isNew ? (
        <View style={[compactStyles.newDot, { backgroundColor: accentColor }]} />
      ) : null}
      <View style={compactStyles.row}>
        <Avatar uri={displayUri} name={displayName} size={32} />
        <Text style={compactStyles.text} numberOfLines={1}>
          <Text style={compactStyles.name}>{displayName}</Text>
          {'  '}
          <Text style={compactStyles.action}>{actionText}</Text>
        </Text>
        <Text style={compactStyles.time}>{timeAgo(created_at)}</Text>
        <View style={[compactStyles.iconWrap, { backgroundColor: `${accentColor}18` }]}>
          <Icon size={13} color={accentColor} />
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export interface FeedCardProps {
  entry: FeedEntry
  /**
   * 'featured'  → hero card (home screen milestones)
   * 'default'   → left-accent-border enriched card (feed list)
   * 'compact'   → single-row social pill
   *
   * Social-type events (friend_request, friend_accepted, user_followed_*)
   * automatically collapse to 'compact' when variant is 'default', so
   * callers don't need to branch on activity_type.
   */
  variant?: 'featured' | 'default' | 'compact'
}

export default function FeedCard({ entry, variant = 'default' }: FeedCardProps) {
  const router = useRouter()
  const { activity_type, metadata, feedable, new: isNew, created_at } = entry

  const actor     = metadata?.actor
  const actorName = actor?.display_name || actor?.username || 'Someone'
  const fb        = feedable as Record<string, any> | null | undefined
  const book      = fb?.book || metadata?.book || (fb?.type === 'Book' ? fb : null)
  const bookId    = book?.google_books_id ?? (book?.id ? String(book.id) : null)

  const accentColor = typeAccentColor(activity_type)

  const goToBook  = () => bookId && router.push(`/book/${bookId}`)
  const goToActor = () => actor?.id && router.push(`/users/${actor.id}`)

  // Explicit compact request
  if (variant === 'compact') {
    return <CompactCard entry={entry} accentColor={accentColor} />
  }

  // Social events auto-collapse to compact in the default variant so callers
  // never need to inspect activity_type before rendering a FeedCard.
  if (variant === 'default' && isSocialType(activity_type)) {
    return <CompactCard entry={entry} accentColor={accentColor} />
  }

  // Featured hero
  if (variant === 'featured') {
    return <FeaturedCard entry={entry} accentColor={accentColor} />
  }

  // ── Default enriched card ─────────────────────────────────────────────────

  const pct    = metadata?.completion_percentage ?? fb?.completion_percentage
  const pages  = metadata?.pages_read ?? fb?.pages_read
  const total  = metadata?.total_pages ?? book?.page_count
  const rating = metadata?.rating ?? fb?.rating
  const review = metadata?.review ?? fb?.review

  const isBookRelease    = activity_type === 'book_release' || activity_type === 'book_recommendation'
  const isFinished       = activity_type === 'user_finished_book'
  const isProgress       = activity_type === 'user_progress_update'
  const isReview         = activity_type === 'user_review'
  const isFollowUser     = activity_type === 'user_followed_user'
  const isFollowAuthor   = activity_type === 'user_followed_author'
  const isFriendRequest  = activity_type === 'friend_request'
  const isFriendAccepted = activity_type === 'friend_accepted'
  const isSocial         = isFollowUser || isFollowAuthor || isFriendRequest || isFriendAccepted

  const releaseBook = metadata?.book || book
  const releaseId   = releaseBook?.google_books_id ?? (releaseBook?.id ? String(releaseBook.id) : null)
  const goToRelease = () => releaseId && router.push(`/book/${releaseId}`)

  // For follow events, the name of the person/author being followed
  const followedName =
    isFollowUser   ? (metadata?.followed_user?.display_name || metadata?.followed_user?.username || null) :
    isFollowAuthor ? (metadata?.author?.name || null) :
    null

  const actionText =
    isFinished         ? 'finished reading' :
    isProgress         ? 'made progress on' :
    isReview           ? 'reviewed' :
    isFriendRequest    ? 'sent you a friend request' :
    isFriendAccepted   ? 'accepted your friend request' :
    isFollowUser       ? 'started following' :
    isFollowAuthor     ? 'started following' :
    activity_type === 'user_added_book'     ? 'added to their shelf' :
    activity_type === 'friend_activity'     ? 'is reading' :
    activity_type === 'book_release'        ? 'New release' :
    activity_type === 'book_recommendation' ? 'Recommended' :
    activity_type.replace(/_/g, ' ')

  const displayBook = book || releaseBook
  const displayId   = bookId || releaseId
  const goToDisplay = () => displayId && router.push(`/book/${displayId}`)

  // Generic fallback for truly unknown types
  if (
    !isBookRelease && !isFinished && !isProgress && !isReview && !isSocial &&
    activity_type !== 'user_added_book' && activity_type !== 'friend_activity'
  ) {
    return (
      <View style={[defaultStyles.card, defaultStyles.cardFallback]}>
        <View style={defaultStyles.row}>
          <View style={defaultStyles.iconCircle}>
            <Rss size={14} color={Colors.lit3} />
          </View>
          <View style={defaultStyles.body}>
            <Text style={defaultStyles.dim}>{activity_type.replace(/_/g, ' ')}</Text>
            <Text style={defaultStyles.time}>{timeAgo(created_at)}</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={[defaultStyles.card, isNew && defaultStyles.cardNew]}>
      {/* Left accent stripe */}
      <View style={[defaultStyles.leftStripe, { backgroundColor: accentColor }]} />

      {/* New indicator dot */}
      {isNew ? (
        <View style={[defaultStyles.newDot, { backgroundColor: accentColor }]} />
      ) : null}

      <View style={defaultStyles.row}>
        {/* Avatar or system icon */}
        {isBookRelease ? (
          <View style={defaultStyles.iconCircle}>
            <Sparkles size={16} color={accentColor} />
          </View>
        ) : (
          <TouchableOpacity onPress={goToActor} hitSlop={8}>
            <Avatar uri={actor?.avatar_url} name={actorName} size={38} />
          </TouchableOpacity>
        )}

        {/* Body */}
        <View style={defaultStyles.body}>
          {/* Actor + action + book title */}
          {isBookRelease ? (
            <Text style={defaultStyles.bodyText} numberOfLines={2}>
              <Text style={defaultStyles.dim}>{actionText}: </Text>
              {releaseBook ? (
                <Text style={defaultStyles.bookTitle} onPress={goToRelease}>
                  {releaseBook.title}
                </Text>
              ) : null}
              {releaseBook?.author_name ? (
                <Text style={defaultStyles.dim}> by {releaseBook.author_name}</Text>
              ) : null}
            </Text>
          ) : (
            <Text style={defaultStyles.bodyText} numberOfLines={2}>
              <Text style={defaultStyles.actorName} onPress={goToActor}>{actorName}</Text>
              {'  '}
              <Text style={defaultStyles.dim}>{actionText}</Text>
              {/* Book title for book events */}
              {book ? (
                <Text>
                  {'  '}
                  <Text style={defaultStyles.bookTitle} onPress={goToBook}>{book.title}</Text>
                </Text>
              ) : null}
              {/* Followed person/author name for follow events */}
              {followedName ? (
                <Text style={defaultStyles.actorName}>{'  '}{followedName}</Text>
              ) : null}
            </Text>
          )}

          {/* Inline progress bar for progress updates */}
          {isProgress && typeof pct === 'number' ? (
            <View style={defaultStyles.progressWrap}>
              <ProgressBar percent={pct} height={3} />
              <Text style={defaultStyles.progressText}>
                {pct}%
                {typeof pages === 'number' && typeof total === 'number' && total > 0
                  ? `  ·  p. ${pages} of ${total}`
                  : ''}
              </Text>
            </View>
          ) : null}

          {/* Star rating for reviews */}
          {isReview && rating != null ? (
            <StarRating rating={rating} size={12} />
          ) : null}

          {/* Review excerpt */}
          {review ? (
            <Text style={defaultStyles.excerpt} numberOfLines={2}>"{review}"</Text>
          ) : null}

          {/* Completed badge */}
          {isFinished ? (
            <View style={[defaultStyles.completedBadge, { backgroundColor: `${accentColor}20` }]}>
              <CheckCircle size={10} color={accentColor} />
              <Text style={[defaultStyles.completedText, { color: accentColor }]}>Completed</Text>
            </View>
          ) : null}

          {/* Timestamp */}
          <Text style={defaultStyles.time}>{timeAgo(created_at)}</Text>
        </View>

        {/* Book cover thumbnail */}
        {displayBook ? (
          <TouchableOpacity onPress={goToDisplay} hitSlop={6}>
            <BookCover
              uri={displayBook.cover_image_url}
              title={displayBook.title}
              author={displayBook.author_name}
              width={50}
              borderRadius={8}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const featStyles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    padding: 16,
    gap: 12,
    marginBottom: 10,
  },
  bgImage: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.2,
  },
  scrim: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(13,26,15,0.62)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  actorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actorName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.lit,
  },
  actionLabel: {
    fontSize: 11,
    color: Colors.lit2,
    marginTop: 1,
  },
  bookTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.lit,
    lineHeight: 25,
    letterSpacing: -0.4,
  },
  excerpt: {
    fontSize: 13,
    fontStyle: 'italic',
    color: Colors.lit2,
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
    color: Colors.lit3,
    textAlign: 'right',
    marginTop: 2,
  },
})

const compactStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.rim,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: Colors.lit2,
  },
  name: {
    fontWeight: '700',
    color: Colors.lit,
  },
  action: {
    color: Colors.lit2,
  },
  time: {
    fontSize: 11,
    color: Colors.lit3,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
})

const defaultStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.rim,
    // extra left padding to clear the 3-px accent stripe
    paddingLeft: 17,
    paddingRight: 14,
    paddingVertical: 13,
    marginBottom: 8,
    overflow: 'hidden',
  },
  cardNew: {
    borderColor: `${Colors.accent}44`,
  },
  cardFallback: {
    paddingLeft: 14,
  },
  leftStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  newDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.grove,
    borderWidth: 1,
    borderColor: Colors.rim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  bodyText: {
    fontSize: 13,
    color: Colors.lit2,
    lineHeight: 18,
  },
  actorName: {
    fontWeight: '700',
    color: Colors.lit,
  },
  bookTitle: {
    fontWeight: '600',
    color: Colors.accent,
  },
  dim: {
    color: Colors.lit2,
  },
  progressWrap: {
    gap: 3,
    marginTop: 2,
  },
  progressText: {
    fontSize: 11,
    color: Colors.lit3,
  },
  excerpt: {
    fontSize: 12,
    fontStyle: 'italic',
    color: Colors.lit2,
    lineHeight: 17,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  completedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  time: {
    fontSize: 11,
    color: Colors.lit3,
    marginTop: 2,
  },
})
