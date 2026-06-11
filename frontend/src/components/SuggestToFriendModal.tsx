'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Users, Check, MessageSquare } from 'lucide-react'
import { useFriends, apiClient } from '@book-app/shared'
import type { User, Book } from '@book-app/shared'

interface SuggestToFriendModalProps {
  isOpen: boolean
  onClose: () => void
  bookId: number | null
  bookTitle: string
  bookData?: Book
}

export default function SuggestToFriendModal({
  isOpen,
  onClose,
  bookId,
  bookTitle,
  bookData,
}: SuggestToFriendModalProps) {
  const { friends, loading: friendsLoading } = useFriends()
  const [selected, setSelected]   = useState<Set<number>>(new Set())
  const [message, setMessage]     = useState('')
  const [sending, setSending]     = useState(false)
  const [sent, setSent]           = useState(false)
  const [sentMessage, setSentMessage] = useState('')
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setSelected(new Set())
      setMessage('')
      setSent(false)
      setError(null)
    }
  }, [isOpen])

  const toggleFriend = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSend = async () => {
    if (selected.size === 0) return
    setSending(true)
    setError(null)
    try {
      let resolvedBookId = bookId
      if (!resolvedBookId && bookData) {
        const ensured = await apiClient.ensureBook({
          title:           bookData.title,
          author_name:     bookData.author_name ?? undefined,
          google_books_id: bookData.google_books_id ?? undefined,
          isbn:            bookData.isbn ?? undefined,
          description:     bookData.description ?? undefined,
          cover_image_url: bookData.cover_image_url ?? undefined,
          release_date:    bookData.release_date ?? undefined,
          page_count:      bookData.page_count ?? undefined,
          categories:      bookData.categories ?? undefined,
        })
        resolvedBookId = ensured.id
      }
      if (!resolvedBookId) throw new Error('Could not resolve book')
      const result = await apiClient.suggestBook(resolvedBookId, Array.from(selected), message.trim() || undefined)
      setSentMessage(result.message)
      setSent(true)
      setTimeout(onClose, 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send suggestion')
    } finally {
      setSending(false)
    }
  }

  const AVATAR_COLORS = ['#C4521F', '#234A5A', '#2D6A4F', '#1A1F58', '#8B5E3C']

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center sm:p-4 pointer-events-none">
            <motion.div
              className="pointer-events-auto w-full sm:max-w-md flex flex-col rounded-t-[20px] sm:rounded-[20px]"
              style={{
                backgroundColor: 'var(--color-canvas)',
                border: '2px solid var(--color-ink)',
                boxShadow: '6px 6px 0px var(--color-ink)',
                maxHeight: '88dvh',
                overflow: 'hidden',
              }}
              initial={{ opacity: 0, y: 48 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 48 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Mobile drag handle */}
              <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                <div style={{ width: 36, height: 4, borderRadius: 999, backgroundColor: 'var(--color-ink-3)' }} />
              </div>

              {/* Header */}
              <div className="px-6 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: '2px solid var(--color-ink)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold uppercase" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--color-accent)', marginBottom: 4 }}>
                      Pass the Word · {selected.size > 0 ? `${selected.size} Selected` : 'Choose Friends'}
                    </p>
                    <h2 className="font-serif font-bold leading-none" style={{ fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', color: 'var(--color-ink)' }}>
                      Suggest a{' '}
                      <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>Book</em>
                    </h2>
                    <p className="font-serif italic mt-1 truncate" style={{ fontSize: 13, color: 'var(--color-ink-2)' }}>
                      {bookTitle}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center flex-shrink-0 mt-1 transition-opacity hover:opacity-70"
                    style={{
                      width: 36, height: 36,
                      border: '2px solid var(--color-ink)',
                      borderRadius: 10,
                      backgroundColor: 'var(--color-canvas)',
                      color: 'var(--color-ink)',
                    }}
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5">

                {/* Success */}
                {sent ? (
                  <div className="py-10 text-center">
                    <div
                      className="w-14 h-14 flex items-center justify-center mx-auto mb-4"
                      style={{
                        backgroundColor: 'var(--color-accent)',
                        border: '2px solid var(--color-ink)',
                        borderRadius: 12,
                        boxShadow: '4px 4px 0px var(--color-ink)',
                        color: '#FAF6EB',
                      }}
                    >
                      <Check size={24} strokeWidth={2.5} />
                    </div>
                    <p className="font-serif font-bold" style={{ fontSize: 18, color: 'var(--color-ink)' }}>
                      {sentMessage}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">

                    {/* Friend list */}
                    {friendsLoading ? (
                      <div className="flex flex-col gap-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="animate-pulse" style={{ height: 58, borderRadius: 10, backgroundColor: 'var(--color-surface)' }} />
                        ))}
                      </div>
                    ) : friends.length === 0 ? (
                      <div className="py-8 text-center">
                        <div
                          className="w-12 h-12 flex items-center justify-center mx-auto mb-3"
                          style={{ border: '2px solid var(--color-ink-3)', borderRadius: 10, color: 'var(--color-ink-3)' }}
                        >
                          <Users size={22} />
                        </div>
                        <p className="font-bold uppercase" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--color-ink)', marginBottom: 4 }}>
                          No Friends Yet
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--color-ink-3)' }}>
                          Add friends to suggest books to them
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-bold uppercase" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--color-ink-3)', marginBottom: 10 }}>
                          Select Friends
                        </p>
                        <div className="flex flex-col gap-2">
                          {friends.map((friend: User) => {
                            const isSelected = selected.has(friend.id)
                            const name = friend.display_name || friend.username
                            const initial = name.charAt(0).toUpperCase()
                            const colorIdx = [...friend.username].reduce((acc, c) => acc + c.charCodeAt(0), 0)
                            const avatarBg = AVATAR_COLORS[colorIdx % AVATAR_COLORS.length]
                            return (
                              <button
                                key={friend.id}
                                onClick={() => toggleFriend(friend.id)}
                                className="flex items-center gap-3 text-left transition-all hover:opacity-80"
                                style={{
                                  border: `2px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-ink)'}`,
                                  borderRadius: 10,
                                  padding: '10px 14px',
                                  backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'var(--color-canvas)',
                                  boxShadow: `3px 3px 0px ${isSelected ? 'var(--color-accent)' : 'var(--color-ink)'}`,
                                }}
                              >
                                <div
                                  style={{
                                    width: 34, height: 34, borderRadius: '50%',
                                    backgroundColor: avatarBg,
                                    border: '2px solid var(--color-ink)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  <span className="font-bold" style={{ fontSize: 13, color: '#FAF6EB' }}>{initial}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold truncate" style={{ fontSize: 14, color: 'var(--color-ink)', lineHeight: 1.25 }}>
                                    {name}
                                  </p>
                                  {friend.display_name && (
                                    <p style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>@{friend.username}</p>
                                  )}
                                </div>
                                {isSelected && (
                                  <div
                                    style={{
                                      width: 22, height: 22, borderRadius: '50%',
                                      backgroundColor: 'var(--color-accent)',
                                      border: '2px solid var(--color-ink)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      flexShrink: 0,
                                    }}
                                  >
                                    <Check size={11} strokeWidth={3} style={{ color: '#FAF6EB' }} />
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Note */}
                    {friends.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare size={11} style={{ color: 'var(--color-ink-3)' }} />
                          <p className="font-bold uppercase" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--color-ink-3)' }}>
                            Add a Note <span className="normal-case font-normal" style={{ letterSpacing: 0 }}>(optional)</span>
                          </p>
                        </div>
                        <textarea
                          value={message}
                          onChange={e => setMessage(e.target.value)}
                          placeholder="You have to read this one…"
                          rows={3}
                          maxLength={280}
                          className="w-full resize-none outline-none font-serif italic"
                          style={{
                            backgroundColor: 'var(--color-canvas)',
                            border: '2px solid var(--color-ink)',
                            borderRadius: 10,
                            padding: '12px 14px',
                            fontSize: 15,
                            color: 'var(--color-ink)',
                            lineHeight: 1.6,
                          }}
                          onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                          onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-ink)')}
                        />
                        {message.length > 0 && (
                          <p className="text-right mt-1" style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>
                            {message.length}/280
                          </p>
                        )}
                      </div>
                    )}

                    {error && (
                      <p className="font-bold uppercase" style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--color-accent)' }}>
                        {error}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              {!sent && friends.length > 0 && (
                <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: '2px solid var(--color-ink)' }}>
                  <button
                    onClick={handleSend}
                    disabled={selected.size === 0 || sending}
                    className="w-full flex items-center justify-center gap-2 font-bold uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
                    style={{
                      fontSize: 11, letterSpacing: '0.16em',
                      border: '2px solid var(--color-ink)',
                      borderRadius: 999,
                      padding: '14px 20px',
                      backgroundColor: 'var(--color-ink)',
                      color: 'var(--color-canvas)',
                      boxShadow: selected.size > 0 ? '4px 4px 0px var(--color-accent)' : 'none',
                    }}
                  >
                    <Send size={13} strokeWidth={2.5} />
                    {sending
                      ? 'Sending…'
                      : selected.size === 0
                        ? 'Select at least one friend'
                        : `Send to ${selected.size} friend${selected.size > 1 ? 's' : ''}`}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
