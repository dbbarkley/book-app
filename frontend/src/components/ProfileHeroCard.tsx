'use client'

import { useRouter } from 'next/navigation'
import { Pencil, Layers, MapPin } from 'lucide-react'
import type { User, FriendshipStatus } from '@book-app/shared'
import FriendButton from './FriendButton'

interface ProfileHeroCardProps {
  user: User
  stats: { friends_count: number; followers_count: number; following_count: number } | null
  isOwnProfile: boolean
  onEditProfile?: () => void
  friendshipStatus?: FriendshipStatus
  friendshipId?: number | null
  isFollowing?: boolean
  onFollowToggle?: () => void
  followLoading?: boolean
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function avatarBg(name: string): string {
  const COLORS = ['#234A5A', '#2D6A4F', '#8B4513', '#4A3728', '#1A3A4A']
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return COLORS[Math.abs(h) % COLORS.length]
}

function formatJoinDate(dateStr?: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
}

// ── Stat pill ──────────────────────────────────────────────────────────────────

function StatPill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div
      className="flex items-center gap-2"
      style={{ border: `2px solid var(--color-ink)`, boxShadow: `4px 4px 0px ${color}`, borderRadius: 999, padding: '9px 18px', flexShrink: 0 }}
    >
      <span className="font-serif font-black" style={{ fontSize: 20, color, lineHeight: 1 }}>
        {value}
      </span>
      <span className="font-bold uppercase" style={{ fontSize: 11, letterSpacing: '0.15em', color }}>
        {label}
      </span>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

const ORANGE_H    = 180   // height of the orange banner in px
const AVATAR_SIZE = 88
const AVATAR_PAD  = 14    // gap between avatar bottom and orange bottom

export default function ProfileHeroCard({
  user,
  stats,
  isOwnProfile,
  onEditProfile,
  friendshipStatus,
  friendshipId,
  isFollowing,
  onFollowToggle,
  followLoading,
}: ProfileHeroCardProps) {
  const router   = useRouter()
  const name     = user.display_name || user.username
  const initial  = name.charAt(0).toUpperCase()
  const joinDate = formatJoinDate(user.created_at)

  // Avatar sits fully inside the orange, AVATAR_PAD above the bottom edge
  const avatarTop  = ORANGE_H - AVATAR_SIZE - AVATAR_PAD   // = 78
  const avatarLeft = 22
  // Name is vertically centred with the avatar
  const nameCenterY = avatarTop + AVATAR_SIZE / 2           // = 122
  const nameLeft    = avatarLeft + AVATAR_SIZE + 16         // = 126

  return (
    <div
      style={{
        position: 'relative',
        border: '2px solid var(--color-ink)',
        borderRadius: 20,
        boxShadow: '5px 5px 0px var(--color-ink)',
        overflow: 'hidden',
        backgroundColor: 'var(--color-canvas)',
      }}
    >

      {/* ── Orange banner ───────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          height: ORANGE_H,
          backgroundColor: 'var(--color-accent)',
          borderBottom: '2px solid var(--color-ink)',
          overflow: 'hidden',
        }}
      >
        {/* Rotated sticker */}
        <div
          className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-[0.18em] px-3 py-1.5 z-10"
          style={{
            border: '2px solid rgba(255,255,255,0.9)',
            borderRadius: 6,
            color: 'rgba(255,255,255,0.95)',
            transform: 'rotate(-3deg)',
          }}
        >
          {isOwnProfile ? 'Your Public Profile' : 'A Reader at WellRead'}
        </div>

        {/* Large yellow circle — clipped at right */}
        <div
          aria-hidden
          style={{
            position: 'absolute', right: -55, top: -55,
            width: 230, height: 230,
            borderRadius: '50%',
            backgroundColor: 'var(--color-accent-yellow)',
            border: '3px solid var(--color-ink)',
          }}
        />

        {/* Small teal circle */}
        <div
          aria-hidden
          style={{
            position: 'absolute', right: 200, top: 22,
            width: 58, height: 58,
            borderRadius: '50%',
            backgroundColor: 'var(--color-accent-teal)',
            border: '3px solid var(--color-ink)',
          }}
        />

        {/* "Reader since" — inside yellow circle area */}
        {joinDate && (
          <div
            className="absolute font-bold uppercase"
            style={{ right: 22, bottom: 14, fontSize: 10, letterSpacing: '0.2em', color: '#fcf4e0' }}
          >
            Reader since {joinDate}
          </div>
        )}

        {/* ── Avatar — fully inside the orange ──────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: avatarTop,
            left: avatarLeft,
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: '50%',
            backgroundColor: avatarBg(name),
            border: '3px solid rgba(255,255,255,0.9)',
            boxShadow: '4px 4px 0px var(--color-ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <span className="font-serif font-black" style={{ fontSize: 36, color: '#FAF6EB', lineHeight: 1 }}>
            {initial}
          </span>
        </div>

        {/* ── Name — vertically centred with avatar, fully in orange ─────────── */}
        <h1
          className="font-serif font-black leading-tight"
          style={{
            position: 'absolute',
            top: nameCenterY,
            transform: 'translateY(-50%)',
            left: nameLeft,
            right: 20,
            fontSize: 'clamp(1.9rem, 4vw, 3rem)',
            color: '#FAF6EB',
            zIndex: 15,
            textShadow: '1px 1px 0 rgba(0,0,0,0.15)',
          }}
        >
          {name}
        </h1>
      </div>

      {/* ── Cream body ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '18px 20px 22px' }}>

        {/* Username + location + action buttons — full width, no indent needed */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[13px]" style={{ color: 'var(--color-accent)' }}>
                @{user.username}
              </span>
              {(user as any).location && (
                <>
                  <span style={{ color: 'var(--color-ink-3)' }}>·</span>
                  <span className="flex items-center gap-1 text-[13px]" style={{ color: 'var(--color-ink-3)' }}>
                    <MapPin size={12} strokeWidth={2} />
                    {(user as any).location}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isOwnProfile ? (
              <>
                <button
                  onClick={onEditProfile ?? (() => router.push('/settings'))}
                  className="flex items-center gap-2 font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: 'var(--color-ink)',
                    color: 'var(--color-canvas)',
                    border: '2px solid var(--color-ink)',
                    borderRadius: 999,
                    padding: '10px 18px',
                    fontSize: 11,
                  }}
                >
                  Edit Profile <Pencil size={12} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => router.push('/library')}
                  className="flex items-center justify-center transition-opacity hover:opacity-70 flex-shrink-0"
                  style={{
                    width: 40, height: 40,
                    borderRadius: '50%',
                    border: '2px solid var(--color-accent-teal)',
                    backgroundColor: 'var(--color-canvas)',
                    color: 'var(--color-accent-teal)',
                  }}
                  aria-label="My Library"
                >
                  <Layers size={16} strokeWidth={2} />
                </button>
              </>
            ) : (
              <>
                {friendshipStatus !== undefined && (
                  <FriendButton
                    userId={user.id}
                    initialStatus={friendshipStatus}
                    initialFriendshipId={friendshipId ?? null}
                  />
                )}
                {onFollowToggle && (
                  <button
                    onClick={onFollowToggle}
                    disabled={followLoading}
                    className="font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-80 disabled:opacity-40"
                    style={{
                      backgroundColor: isFollowing ? 'transparent' : 'var(--color-ink)',
                      color: isFollowing ? 'var(--color-ink)' : 'var(--color-canvas)',
                      border: '2px solid var(--color-ink)',
                      borderRadius: 999,
                      padding: '10px 18px',
                      fontSize: 11,
                    }}
                  >
                    {followLoading ? '…' : isFollowing ? 'Following' : '+ Follow'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="leading-relaxed mt-5" style={{ fontSize: 15, color: 'var(--color-ink)', lineHeight: 1.65 }}>
            &ldquo;{user.bio}&rdquo;
          </p>
        )}

        {/* Stats pills */}
        {stats && (
          <div className="flex items-center gap-3 mt-5 flex-wrap">
            <StatPill value={stats.friends_count}   label="Friends"   color="#D5582E" />
            <StatPill value={stats.followers_count} label="Followers" color="#234A5A" />
            <StatPill value={stats.following_count} label="Following" color="#2D6A4F" />
          </div>
        )}
      </div>

    </div>
  )
}
