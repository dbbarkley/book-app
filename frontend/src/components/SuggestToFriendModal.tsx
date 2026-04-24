'use client'

import { useState, useEffect } from 'react'
import { X, Send, Users, Check, MessageSquare } from 'lucide-react'
import { useFriends, apiClient } from '@book-app/shared'
import Avatar from './Avatar'
import type { User } from '@book-app/shared'

interface SuggestToFriendModalProps {
  isOpen: boolean
  onClose: () => void
  bookId: number
  bookTitle: string
}

export default function SuggestToFriendModal({
  isOpen,
  onClose,
  bookId,
  bookTitle,
}: SuggestToFriendModalProps) {
  const { friends, loading: friendsLoading } = useFriends()
  const [selected, setSelected]   = useState<Set<number>>(new Set())
  const [message, setMessage]     = useState('')
  const [sending, setSending]     = useState(false)
  const [sent, setSent]           = useState(false)
  const [sentMessage, setSentMessage] = useState('')
  const [error, setError]         = useState<string | null>(null)

  // Reset state each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setSelected(new Set())
      setMessage('')
      setSent(false)
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

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
      const result = await apiClient.suggestBook(bookId, Array.from(selected), message.trim() || undefined)
      setSentMessage(result.message)
      setSent(true)
      setTimeout(onClose, 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send suggestion')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        {/* Modal panel */}
        <div
          className="relative w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] overflow-hidden"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-rim-accent)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--color-rim)' }}
          >
            <div>
              <h2 className="font-serif text-lg font-bold" style={{ color: 'var(--color-lit)' }}>
                Suggest to a Friend
              </h2>
              <p className="text-xs mt-0.5 truncate max-w-[240px]" style={{ color: 'var(--color-lit-3)' }}>
                {bookTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl transition-colors"
              style={{ color: 'var(--color-lit-3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-lit)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-lit-3)')}
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

            {/* Success state */}
            {sent ? (
              <div className="py-10 text-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
                >
                  <Check size={24} />
                </div>
                <p className="font-bold" style={{ color: 'var(--color-lit)' }}>{sentMessage}</p>
              </div>
            ) : (
              <>
                {/* Friend list */}
                {friendsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--color-grove)' }} />
                    ))}
                  </div>
                ) : friends.length === 0 ? (
                  <div className="py-8 text-center">
                    <Users size={28} className="mx-auto mb-2" style={{ color: 'var(--color-lit-3)' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--color-lit-2)' }}>No friends yet</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-lit-3)' }}>Add friends to suggest books to them</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-lit-3)' }}>
                      Select friends
                    </p>
                    <div className="space-y-2">
                      {friends.map((friend: User) => {
                        const isSelected = selected.has(friend.id)
                        return (
                          <button
                            key={friend.id}
                            onClick={() => toggleFriend(friend.id)}
                            className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left"
                            style={{
                              backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'var(--color-grove)',
                              border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-rim)'}`,
                            }}
                          >
                            <Avatar
                              src={friend.avatar_url}
                              name={friend.display_name || friend.username}
                              size="sm"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate" style={{ color: 'var(--color-lit)' }}>
                                {friend.display_name || friend.username}
                              </p>
                              {friend.display_name && (
                                <p className="text-xs" style={{ color: 'var(--color-lit-3)' }}>@{friend.username}</p>
                              )}
                            </div>
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                              style={{
                                backgroundColor: isSelected ? 'var(--color-accent)' : 'transparent',
                                border: `2px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-rim-accent)'}`,
                              }}
                            >
                              {isSelected && <Check size={11} style={{ color: 'var(--color-accent-on)' }} />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Message */}
                {friends.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <MessageSquare size={13} style={{ color: 'var(--color-lit-3)' }} />
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-lit-3)' }}>
                        Add a note <span className="normal-case font-normal">(optional)</span>
                      </p>
                    </div>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="You have to read this one…"
                      rows={3}
                      maxLength={280}
                      className="w-full px-4 py-3 rounded-2xl text-sm resize-none outline-none transition-all"
                      style={{
                        backgroundColor: 'var(--color-grove)',
                        border: '1px solid var(--color-rim)',
                        color: 'var(--color-lit)',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-rim-accent)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-rim)')}
                    />
                    {message.length > 0 && (
                      <p className="text-xs mt-1 text-right" style={{ color: 'var(--color-lit-3)' }}>
                        {message.length}/280
                      </p>
                    )}
                  </div>
                )}

                {error && (
                  <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {!sent && friends.length > 0 && (
            <div
              className="px-6 py-4 flex-shrink-0"
              style={{ borderTop: '1px solid var(--color-rim)' }}
            >
              <button
                onClick={handleSend}
                disabled={selected.size === 0 || sending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-40"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
              >
                <Send size={15} />
                {sending
                  ? 'Sending…'
                  : selected.size === 0
                    ? 'Select at least one friend'
                    : `Send to ${selected.size} friend${selected.size > 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
