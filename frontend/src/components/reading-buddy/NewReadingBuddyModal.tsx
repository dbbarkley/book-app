'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { X, Search, Loader2, AlertTriangle, Check, Users, Mail } from 'lucide-react'
import { useFriends, useReadingBuddy, apiClient } from '@book-app/shared'
import type { UserBook, User } from '@book-app/shared'
import Avatar from '../Avatar'

type InviteTab = 'one_friend' | 'group' | 'email'

interface Props {
  onClose: () => void
}

const PILL_COLORS = [
  { bg: '#D5582E', text: '#FAF6EB' },
  { bg: '#F1C75B', text: '#1A1A1A' },
  { bg: '#234A5A', text: '#FAF6EB' },
  { bg: '#7B8F6E', text: '#FAF6EB' },
  { bg: '#9B6E4A', text: '#FAF6EB' },
  { bg: '#6B5B95', text: '#FAF6EB' },
]

function getPillColor(id: number) {
  return PILL_COLORS[id % PILL_COLORS.length]
}

function NumberedBadge({ n }: { n: string }) {
  return (
    <div style={{
      width: 30, height: 30, borderRadius: '50%',
      backgroundColor: 'var(--color-ink)',
      border: '2px solid var(--color-ink)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: '#FAF6EB', lineHeight: 1 }}>{n}</span>
    </div>
  )
}

export default function NewReadingBuddyModal({ onClose }: Props) {
  const { friends, loading: friendsLoading } = useFriends()
  const { createSession }                    = useReadingBuddy()

  const [tab, setTab]                   = useState<InviteTab>('one_friend')
  const [selectedUserBook, setSelectedUserBook] = useState<UserBook | null>(null)
  const [selectedFriend, setSelectedFriend]     = useState<User | null>(null)
  const [isSwapping, setIsSwapping]     = useState(false)
  const [bookQuery, setBookQuery]       = useState('')
  const [friendQuery, setFriendQuery]   = useState('')
  const [inviting, setInviting]         = useState(false)
  const [inviteSuccess, setSuccess]     = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [library, setLibrary]           = useState<UserBook[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)

  useEffect(() => {
    setLibraryLoading(true)
    apiClient.getUserBooks()
      .then(({ user_books }) => setLibrary(user_books))
      .catch(() => {})
      .finally(() => setLibraryLoading(false))
  }, [])

  const filteredBooks = useMemo(() => {
    const q = bookQuery.trim().toLowerCase()
    if (!q) return library
    return library.filter(ub => {
      const title  = ub.book?.title?.toLowerCase() ?? ''
      const author = ub.book?.author_name?.toLowerCase() ?? ''
      return title.includes(q) || author.includes(q)
    })
  }, [library, bookQuery])

  const filteredFriends = useMemo(() => {
    const q = friendQuery.trim().toLowerCase()
    if (!q) return friends
    return friends.filter(f => {
      const name = (f.display_name || '').toLowerCase()
      const user = f.username.toLowerCase()
      return name.includes(q) || user.includes(q)
    })
  }, [friends, friendQuery])

  const handleSelectBook = (ub: UserBook) => {
    setSelectedUserBook(ub)
    setIsSwapping(false)
    setBookQuery('')
  }

  const handleInvite = async () => {
    if (!selectedUserBook || !selectedFriend) return
    setInviting(true)
    setError(null)
    try {
      await createSession(selectedUserBook.book_id, selectedFriend.id)
      setSuccess(true)
      setInviting(false)
      setTimeout(() => onClose(), 3200)
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to send invite')
      setInviting(false)
    }
  }

  const TABS: { id: InviteTab; label: string }[] = [
    { id: 'one_friend', label: 'One Friend'           },
    { id: 'group',      label: 'A Group'               },
    { id: 'email',      label: 'By Email · Share Link' },
  ]

  const canInvite = !!selectedUserBook && !!selectedFriend

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        className="w-full rounded-t-2xl sm:rounded-[20px]"
        style={{
          maxWidth: 640,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '2px solid var(--color-ink)',
          boxShadow: '6px 6px 0px var(--color-ink)',
        }}
        initial={{ y: 56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 56, opacity: 0 }}
        transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* ── Dark header ── */}
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'var(--color-ink)',
          flexShrink: 0,
          padding: '28px 32px 32px',
        }}>
          <div aria-hidden style={{
            position: 'absolute', top: 0, right: 0,
            width: '45%', height: '100%',
            background: 'radial-gradient(ellipse at top right, rgba(213,88,46,0.45) 0%, transparent 65%)',
            pointerEvents: 'none',
          }} />

          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 20, right: 24,
              width: 38, height: 38, borderRadius: '50%',
              border: '1.5px solid rgba(250,246,235,0.25)',
              backgroundColor: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(250,246,235,0.6)',
              transition: 'border-color 0.15s, color 0.15s',
              zIndex: 2,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(250,246,235,0.6)'; (e.currentTarget as HTMLElement).style.color = '#FAF6EB' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(250,246,235,0.25)'; (e.currentTarget as HTMLElement).style.color = 'rgba(250,246,235,0.6)' }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>

          <div className="flex items-center gap-3" style={{ marginBottom: 14, position: 'relative', zIndex: 1 }}>
            <div style={{ width: 24, height: 2, backgroundColor: 'var(--color-accent-yellow)', flexShrink: 0 }} />
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.22em',
              color: 'var(--color-accent-yellow)', textTransform: 'uppercase',
            }}>
              New Buddy Read
            </span>
          </div>

          <h2
            className="font-serif font-black"
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.6rem)',
              color: '#FAF6EB',
              lineHeight: 1.05,
              marginBottom: 10,
              position: 'relative', zIndex: 1,
            }}
          >
            Invite a reader
            <span style={{ color: 'var(--color-accent)' }}>.</span>
          </h2>

          <p style={{
            fontSize: 14, color: 'rgba(250,246,235,0.55)',
            lineHeight: 1.6, maxWidth: '48ch',
            position: 'relative', zIndex: 1,
          }}>
            Pick a friend, pick a pace, send a note. They get a quiet prompt&mdash;not a demand.
          </p>
        </div>

        {/* ── Tab bar ── */}
        <div style={{
          backgroundColor: 'var(--color-canvas)',
          borderBottom: '2px solid var(--color-ink)',
          padding: '14px 28px',
          display: 'flex', alignItems: 'center', gap: 10,
          flexShrink: 0,
          overflowX: 'auto',
        }}>
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.22em',
            color: 'var(--color-ink-3)', textTransform: 'uppercase',
            marginRight: 4, whiteSpace: 'nowrap',
          }}>
            Invite
          </span>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="font-bold uppercase"
              style={{
                fontSize: 11, letterSpacing: '0.12em',
                padding: '8px 16px', borderRadius: 999,
                border: '2px solid var(--color-ink)',
                cursor: 'pointer', whiteSpace: 'nowrap',
                backgroundColor: tab === t.id ? 'var(--color-ink)' : 'transparent',
                color: tab === t.id ? '#FAF6EB' : 'var(--color-ink)',
                transition: 'background-color 0.15s, color 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div style={{
          flex: 1, overflow: 'hidden', minHeight: 0,
          backgroundColor: 'var(--color-canvas)',
        }}>
          {/* ── Success state ── */}
          {inviteSuccess ? (
            <div className="flex items-center justify-center" style={{ height: '100%', padding: '32px 28px' }}>
              <div
                style={{
                  width: '100%',
                  backgroundColor: '#3D7553',
                  border: '2px solid var(--color-ink)',
                  borderRadius: 18,
                  boxShadow: '5px 5px 0px var(--color-ink)',
                  padding: '22px 26px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                }}
              >
                {/* Circle check */}
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  border: '2px solid rgba(255,255,255,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check style={{ width: 22, height: 22, color: '#fff', strokeWidth: 2.5 }} />
                </div>

                {/* Text */}
                <div>
                  <p className="font-serif font-black" style={{ fontSize: 22, color: '#fff', lineHeight: 1.1, marginBottom: 5 }}>
                    Invite sent.
                  </p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
                    We&apos;ll let you know the moment they accept.
                  </p>
                </div>
              </div>
            </div>
          ) : tab === 'one_friend' ? (
            <div className="overflow-y-auto" style={{ height: '100%', padding: '28px 28px 32px' }}>

              {/* ── Section 1: The book ── */}
              <div style={{ marginBottom: 32 }}>
                <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
                  <NumberedBadge n="①" />
                  <h3 className="font-serif font-bold" style={{ fontSize: 19, color: 'var(--color-ink)' }}>
                    The book
                  </h3>
                </div>

                {selectedUserBook && !isSwapping ? (
                  /* Selected book card */
                  <div className="flex items-center gap-3" style={{
                    padding: '14px 16px',
                    border: '2px solid var(--color-ink)',
                    borderRadius: 14,
                    boxShadow: '4px 4px 0px var(--color-ink)',
                    backgroundColor: 'var(--color-surface)',
                  }}>
                    <div style={{
                      width: 42, height: 62, borderRadius: 5, overflow: 'hidden',
                      border: '1px solid var(--color-rim)', flexShrink: 0,
                      backgroundColor: 'var(--color-cave)',
                    }}>
                      {selectedUserBook.book?.cover_image_url && (
                        <img
                          src={selectedUserBook.book.cover_image_url}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-bold line-clamp-1" style={{ fontSize: 15, color: 'var(--color-ink)' }}>
                        {selectedUserBook.book?.title}
                      </p>
                      {selectedUserBook.book?.author_name && (
                        <p style={{ fontSize: 12, color: 'var(--color-ink-3)', marginTop: 2 }}>
                          {selectedUserBook.book.author_name}
                        </p>
                      )}
                      {selectedUserBook.book?.page_count && (
                        <p style={{ fontSize: 11, color: 'var(--color-ink-3)', marginTop: 4 }}>
                          {selectedUserBook.book.page_count} pages
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => { setIsSwapping(true); setBookQuery('') }}
                      style={{
                        fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
                        color: 'var(--color-accent)', border: '1.5px solid var(--color-accent)',
                        borderRadius: 6, padding: '5px 12px', cursor: 'pointer',
                        backgroundColor: 'transparent', flexShrink: 0, whiteSpace: 'nowrap',
                        transition: 'background-color 0.15s, color 0.15s',
                      }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = 'var(--color-accent)'; el.style.color = '#FAF6EB' }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = 'transparent'; el.style.color = 'var(--color-accent)' }}
                    >
                      SWAP
                    </button>
                  </div>
                ) : (
                  /* Library search */
                  <div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      border: '2px solid var(--color-ink)', borderRadius: 12,
                      padding: '10px 14px', backgroundColor: 'var(--color-surface)',
                      marginBottom: 8,
                    }}>
                      <Search style={{ width: 14, height: 14, color: 'var(--color-ink-3)', flexShrink: 0 }} />
                      <input
                        autoFocus
                        value={bookQuery}
                        onChange={e => setBookQuery(e.target.value)}
                        placeholder="Filter your library…"
                        className="flex-1 outline-none bg-transparent"
                        style={{ fontSize: 14, color: 'var(--color-ink)' }}
                      />
                      {libraryLoading && (
                        <Loader2 style={{ width: 14, height: 14, flexShrink: 0, color: 'var(--color-accent)' }} className="animate-spin" />
                      )}
                    </div>

                    <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                      {libraryLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 style={{ width: 20, height: 20, color: 'var(--color-accent)' }} className="animate-spin" />
                        </div>
                      ) : filteredBooks.length > 0 ? (
                        filteredBooks.map(ub => (
                          <button
                            key={ub.id}
                            onClick={() => handleSelectBook(ub)}
                            className="w-full flex items-center gap-3 text-left transition-opacity hover:opacity-70"
                            style={{
                              padding: '10px 4px',
                              borderBottom: '1.5px dashed var(--color-rim)',
                              cursor: 'pointer', backgroundColor: 'transparent',
                            }}
                          >
                            <div style={{
                              width: 34, height: 50, flexShrink: 0, borderRadius: 4,
                              overflow: 'hidden', border: '1px solid var(--color-rim)',
                              backgroundColor: 'var(--color-cave)',
                            }}>
                              {ub.book?.cover_image_url && (
                                <img src={ub.book.cover_image_url} alt={ub.book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-serif font-bold leading-snug line-clamp-1" style={{ fontSize: 14, color: 'var(--color-ink)' }}>
                                {ub.book?.title}
                              </p>
                              {ub.book?.author_name && (
                                <p style={{ fontSize: 11, color: 'var(--color-ink-3)', marginTop: 2 }}>{ub.book.author_name}</p>
                              )}
                            </div>
                            <span style={{
                              fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                              color: 'var(--color-ink-3)', border: '1px solid var(--color-rim)',
                              borderRadius: 4, padding: '2px 6px', flexShrink: 0,
                            }}>
                              {ub.status === 'reading' ? 'Reading' : ub.status === 'read' ? 'Read' : 'To read'}
                            </span>
                          </button>
                        ))
                      ) : !libraryLoading && library.length === 0 ? (
                        <p className="text-center py-8" style={{ fontSize: 13, color: 'var(--color-ink-3)' }}>
                          Your library is empty — add books first.
                        </p>
                      ) : (
                        <p className="text-center py-8" style={{ fontSize: 13, color: 'var(--color-ink-3)' }}>
                          No matches for &ldquo;{bookQuery}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Section 2: Who you're reading with ── */}
              <div>
                <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
                  <NumberedBadge n="②" />
                  <h3 className="font-serif font-bold" style={{ fontSize: 19, color: 'var(--color-ink)' }}>
                    Who you&apos;re reading with
                  </h3>
                </div>

                {/* Friend search */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  border: '2px solid var(--color-ink)', borderRadius: 12,
                  padding: '10px 14px', backgroundColor: 'var(--color-surface)',
                  marginBottom: 14,
                }}>
                  <Search style={{ width: 14, height: 14, color: 'var(--color-ink-3)', flexShrink: 0 }} />
                  <input
                    value={friendQuery}
                    onChange={e => setFriendQuery(e.target.value)}
                    placeholder="Search friends…"
                    className="flex-1 outline-none bg-transparent"
                    style={{ fontSize: 14, color: 'var(--color-ink)' }}
                  />
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                    color: 'var(--color-ink-3)', border: '1px solid var(--color-rim)',
                    borderRadius: 4, padding: '2px 6px', flexShrink: 0,
                  }}>
                    ⌘K
                  </span>
                </div>

                {/* Friend pills */}
                {friendsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 style={{ width: 20, height: 20, color: 'var(--color-accent)' }} className="animate-spin" />
                  </div>
                ) : friends.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--color-ink-3)', padding: '12px 0' }}>
                    You haven&apos;t added any friends yet.
                  </p>
                ) : filteredFriends.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--color-ink-3)', padding: '12px 0' }}>
                    No friends match &ldquo;{friendQuery}&rdquo;
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {filteredFriends.map(friend => {
                      const isSelected = selectedFriend?.id === friend.id
                      const pillColor  = getPillColor(friend.id)
                      return (
                        <button
                          key={friend.id}
                          onClick={() => setSelectedFriend(isSelected ? null : friend)}
                          className="flex items-center gap-2"
                          style={{
                            padding: '7px 14px 7px 8px',
                            borderRadius: 999,
                            border: '2px solid var(--color-ink)',
                            backgroundColor: isSelected ? pillColor.bg : 'transparent',
                            color: isSelected ? pillColor.text : 'var(--color-ink)',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s, color 0.15s',
                          }}
                        >
                          <Avatar
                            src={friend.avatar_url ?? undefined}
                            name={friend.display_name || friend.username}
                            size="xs"
                          />
                          <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {friend.display_name || friend.username}
                          </span>
                          {isSelected && (
                            <Check style={{ width: 11, height: 11, flexShrink: 0 }} />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Selected friend detail card */}
                {selectedFriend && (
                  <div style={{
                    marginTop: 16,
                    padding: '14px 16px',
                    border: '2px solid var(--color-ink)',
                    borderRadius: 14,
                    backgroundColor: 'var(--color-surface)',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <Avatar
                      src={selectedFriend.avatar_url ?? undefined}
                      name={selectedFriend.display_name || selectedFriend.username}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold line-clamp-1" style={{ fontSize: 15, color: 'var(--color-ink)' }}>
                        {selectedFriend.display_name || selectedFriend.username}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--color-ink-3)', marginTop: 2 }}>
                        @{selectedFriend.username}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedFriend(null)}
                      style={{
                        width: 28, height: 28, borderRadius: '50%',
                        border: '1.5px solid var(--color-rim)',
                        backgroundColor: 'transparent', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-ink-3)', flexShrink: 0,
                      }}
                    >
                      <X style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                )}
              </div>

              {/* ── Error ── */}
              {error && (
                <div className="flex items-center gap-2 mt-5 px-4 py-3 rounded-xl" style={{
                  fontSize: 13, backgroundColor: 'rgba(213,88,46,0.10)',
                  border: '1px solid rgba(213,88,46,0.30)', color: 'var(--color-accent)',
                }}>
                  <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />
                  {error}
                </div>
              )}

              {/* ── Send invite ── */}
              {canInvite && (
                <div style={{ marginTop: 28 }}>
                  <button
                    onClick={handleInvite}
                    disabled={inviting}
                    className="w-full flex items-center justify-center gap-2 font-bold uppercase transition-opacity disabled:opacity-60"
                    style={{
                      padding: '15px 24px',
                      borderRadius: 14,
                      border: '2px solid var(--color-ink)',
                      boxShadow: '4px 4px 0px var(--color-ink)',
                      backgroundColor: 'var(--color-ink)',
                      color: '#FAF6EB',
                      fontSize: 13, letterSpacing: '0.14em',
                      cursor: inviting ? 'not-allowed' : 'pointer',
                    }}
                    onMouseDown={e => { if (!inviting) (e.currentTarget as HTMLElement).style.transform = 'translate(2px,2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '2px 2px 0px var(--color-ink)' }}
                    onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0px var(--color-ink)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0px var(--color-ink)' }}
                  >
                    {inviting ? (
                      inviteSuccess
                        ? <><Check style={{ width: 16, height: 16 }} /> Invite sent!</>
                        : <><Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> Sending…</>
                    ) : (
                      'Send Invite'
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Placeholder for A GROUP and BY EMAIL tabs */
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center" style={{ padding: 40, height: '100%' }}>
              {tab === 'group'
                ? <Users style={{ width: 32, height: 32, color: 'var(--color-ink-3)' }} />
                : <Mail style={{ width: 32, height: 32, color: 'var(--color-ink-3)' }} />
              }
              <p className="font-serif font-bold" style={{ fontSize: 18, color: 'var(--color-ink)' }}>
                {tab === 'group' ? 'Group reads' : 'Email & share link'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-ink-3)', maxWidth: '30ch', lineHeight: 1.6 }}>
                {tab === 'group'
                  ? 'Invite multiple friends to read the same book together. Coming soon.'
                  : 'Share a link or send an email invite to anyone. Coming soon.'
                }
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
