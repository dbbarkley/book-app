'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, MessageCircle, X, EyeOff, Eye, Loader2, Highlighter, Lock, HeartCrack, PenLine, Layers, Bookmark, ThumbsDown, Smile } from 'lucide-react'
import { useReadingBuddy } from '@book-app/shared'
import type { ReadingBuddyHighlight } from '@book-app/shared'
import { parseMessage } from './utils'

const REACTION_EMOJIS = ['❤️', '😂', '🤯', '👀', '💔']
const MOOD_ICON: Record<string, React.ComponentType<{ style?: React.CSSProperties }>> = {
  wrecked:   HeartCrack,
  craft:     PenLine,
  structure: Layers,
  save:      Bookmark,
  disagree:  ThumbsDown,
  laugh:     Smile,
}
const MY_AVATAR_BG    = '#1f3a5f'
const PTN_AVATAR_BG   = '#D5582E'
const SEND_BTN_COLOR  = '#F1C75B'
const HIGHLIGHT_BG    = '#F1C75B'

export interface DiscussionPanelProps {
  sessionId: number
  filteredMessages: any[]
  highlights: ReadingBuddyHighlight[]
  chapterFilter: number | null; setChapterFilter: (n: number | null) => void
  chapterCount: number; totalPages: number
  myPct: number; partnerPct: number
  isActive: boolean; userId: number | undefined
  composerQuote: { content: string; userName: string } | null
  setComposerQuote: (q: { content: string; userName: string } | null) => void
  composerIsSpoiler: boolean; setComposerIsSpoiler: React.Dispatch<React.SetStateAction<boolean>>
  messageText: string; setMessageText: (t: string) => void
  handleSend: () => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  sending: boolean
  bottomRef: React.RefObject<HTMLDivElement>
  inputRef: React.RefObject<HTMLTextAreaElement>
}

type FeedItem =
  | { kind: 'message';   key: string; created_at: string; data: any }
  | { kind: 'highlight'; key: string; created_at: string; data: ReadingBuddyHighlight }

export default function DiscussionPanel({
  sessionId, filteredMessages, highlights,
  chapterFilter, setChapterFilter,
  chapterCount, totalPages, myPct, partnerPct,
  isActive, userId,
  composerQuote, setComposerQuote,
  composerIsSpoiler, setComposerIsSpoiler, messageText, setMessageText,
  handleSend, handleKeyDown, sending, bottomRef, inputRef,
}: DiscussionPanelProps) {
  const { toggleReaction } = useReadingBuddy()
  const [showReactionFor, setShowReactionFor]   = useState<string | null>(null)
  const [revealedMessages, setRevealedMessages] = useState<Set<string>>(new Set())

  // Merge messages + highlights into a single sorted timeline
  const feedItems: FeedItem[] = [
    ...filteredMessages.map(m => ({ kind: 'message'   as const, key: `m-${m.id}`,  created_at: m.created_at,    data: m })),
    ...highlights.map(h       => ({ kind: 'highlight' as const, key: `h-${h.id}`,  created_at: h.created_at,    data: h })),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const feedByDay = feedItems.reduce<Array<{ date: string; items: FeedItem[] }>>((acc, item) => {
    const day = new Date(item.created_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()
    const last = acc[acc.length - 1]
    if (last && last.date === day) last.items.push(item)
    else acc.push({ date: day, items: [item] })
    return acc
  }, [])

  const isEmpty = feedItems.length === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>

      {/* Feed */}
      <div style={{ padding: '12px 16px', flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {isEmpty ? (
          <div className="flex flex-col items-center text-center pt-10 gap-2">
            <MessageCircle style={{ width: 18, height: 18, color: 'var(--color-ink-3)' }} />
            <p style={{ fontSize: 13, color: 'var(--color-ink-3)', lineHeight: 1.55 }}>
              {chapterFilter !== null
                ? `No messages tagged to Ch. ${chapterFilter + 1} yet.`
                : isActive ? 'No messages yet — start the conversation.' : 'Chat unlocks once both of you accept.'
              }
            </p>
          </div>
        ) : (
          feedByDay.map(({ date, items }) => (
            <div key={date}>
              <div className="flex justify-center my-5">
                <span style={{
                  fontSize: 8, fontWeight: 800, letterSpacing: '0.18em',
                  color: 'var(--color-canvas)', textTransform: 'uppercase',
                  backgroundColor: 'var(--color-ink)', borderRadius: 20,
                  padding: '4px 12px',
                }}>
                  {date}
                </span>
              </div>
              {items.map(item => {
                if (item.kind === 'highlight') {
                  return <HighlightBubble key={item.key} h={item.data} userId={userId} totalPages={totalPages} chapterCount={chapterCount} />
                }

                // ── Message ──────────────────────────────────────────
                const msg = item.data
                const isMe     = msg.user_id === userId
                const name     = msg.user.display_name || msg.user.username
                const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                const time     = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                const { pageRef, isSpoiler, text } = parseMessage(msg.content)
                const msgKey = String(msg.id)
                let chapterLabel: string | null = null
                if (pageRef && totalPages > 0 && chapterCount > 0) {
                  const pageNum = parseInt(pageRef, 10)
                  const chIdx  = Math.min(chapterCount - 1, Math.floor((pageNum / totalPages) * chapterCount))
                  chapterLabel = `Ch. ${chIdx + 1}`
                }
                const reactions: { emoji: string; user_ids: number[] }[] = msg.reactions ?? []
                const myReactions = new Set(reactions.filter(r => r.user_ids.includes(userId!)).map(r => r.emoji))
                const hasAnyReaction = reactions.some(r => r.user_ids.length > 0)

                return (
                  <div key={msg.id} className={`flex items-start gap-2.5 mb-5 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      backgroundColor: isMe ? MY_AVATAR_BG : PTN_AVATAR_BG,
                      color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 900, flexShrink: 0,
                      border: '2px solid var(--color-ink)',
                    }}>
                      {initials}
                    </div>
                    <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <div className={`flex items-center gap-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-ink)' }}>{isMe ? 'You' : name.split(' ')[0]}</span>
                        {chapterLabel && <>
                          <span style={{ fontSize: 10, color: 'var(--color-ink-3)' }}>&middot;</span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-ink-2)' }}>{chapterLabel}</span>
                        </>}
                        <span style={{ fontSize: 10, color: 'var(--color-ink-3)' }}>&middot;</span>
                        <span style={{ fontSize: 10, color: 'var(--color-ink-3)' }}>{time}</span>
                      </div>
                      {(() => {
                        const isHidden = isSpoiler && !isMe && !revealedMessages.has(msgKey)
                        return (
                          <>
                            <div
                              onClick={() => {
                                if (isHidden) setRevealedMessages(prev => new Set(prev).add(msgKey))
                              }}
                              style={{
                                borderRadius: 18,
                                backgroundColor: isMe ? 'var(--color-ink)' : 'var(--color-canvas)',
                                color: isMe ? 'var(--color-lit)' : 'var(--color-ink)',
                                border: '2px solid var(--color-ink)',
                                boxShadow: isMe ? '4px 4px 0px var(--color-accent)' : '4px 4px 0px var(--color-ink)',
                                padding: '12px 16px', fontSize: 14, lineHeight: 1.55,
                                filter: isHidden ? 'blur(6px)' : 'none',
                                cursor: isHidden ? 'pointer' : 'default',
                                userSelect: isHidden ? 'none' : 'auto',
                                transition: 'filter 0.25s',
                                marginBottom: 4,
                              }}>
                              {text}
                            </div>
                            {isHidden && (
                              <p style={{ fontSize: 9, color: 'var(--color-ink-3)', textAlign: 'left', fontWeight: 700 }}>
                                Spoiler — click to reveal
                              </p>
                            )}
                          </>
                        )
                      })()}
                      {(hasAnyReaction || isActive) && (
                        <div className={`flex items-center gap-1.5 flex-wrap ${isMe ? 'justify-end' : ''}`}>
                          {reactions.filter(r => r.user_ids.length > 0).map(r => (
                            <button key={r.emoji}
                              onClick={() => toggleReaction(sessionId, msg.id, r.emoji)}
                              style={{
                                fontSize: 12, padding: '3px 8px', borderRadius: 20,
                                background: myReactions.has(r.emoji) ? 'var(--color-accent-subtle)' : 'var(--color-surface)',
                                border: myReactions.has(r.emoji) ? '1.5px solid var(--color-accent)' : '1.5px solid var(--color-ink)',
                                cursor: 'pointer', fontWeight: 700,
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                              }}>
                              {r.emoji}
                              {r.user_ids.length > 1 && (
                                <span style={{ fontSize: 10, color: 'var(--color-ink-2)', fontWeight: 800 }}>{r.user_ids.length}</span>
                              )}
                            </button>
                          ))}
                          {isActive && (
                            <div style={{ position: 'relative' }}>
                              <button
                                onClick={() => setShowReactionFor(showReactionFor === msgKey ? null : msgKey)}
                                style={{
                                  width: 26, height: 26, borderRadius: '50%',
                                  background: 'transparent', border: '1.5px dashed var(--color-ink)',
                                  cursor: 'pointer', fontSize: 14,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: 'var(--color-ink-3)',
                                }}>
                                +
                              </button>
                              <AnimatePresence>
                                {showReactionFor === msgKey && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.85, y: 4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.85, y: 4 }}
                                    transition={{ duration: 0.1 }}
                                    style={{
                                      position: 'absolute',
                                      right: isMe ? 0 : 'auto',
                                      left: isMe ? 'auto' : 0,
                                      bottom: 'calc(100% + 6px)',
                                      display: 'flex', gap: 3,
                                      padding: '6px 10px', borderRadius: 20,
                                      background: 'var(--color-canvas)',
                                      border: '2px solid var(--color-ink)',
                                      boxShadow: '3px 3px 0px var(--color-ink)',
                                      zIndex: 10,
                                    }}>
                                    {REACTION_EMOJIS.map(emoji => (
                                      <button key={emoji}
                                        onClick={() => {
                                          toggleReaction(sessionId, msg.id, emoji)
                                          setShowReactionFor(null)
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.3)')}
                                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                        style={{ fontSize: 16, cursor: 'pointer', padding: '1px 2px', background: 'none', border: 'none', lineHeight: 1, transition: 'transform 0.1s' }}>
                                        {emoji}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      {isActive && (
        <div style={{ padding: '10px 14px 12px', flexShrink: 0, borderTop: '1px solid var(--color-rim)' }}>
          {composerQuote && (
            <div style={{ marginBottom: 8, padding: '8px 10px', borderRadius: 8, background: 'var(--color-surface)', border: '1.5px solid var(--color-rim)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ width: 3, minHeight: 28, borderRadius: 2, background: 'var(--color-accent)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 9, fontWeight: 800, color: 'var(--color-accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>Quoting {composerQuote.userName}</p>
                <p style={{ fontSize: 11, color: 'var(--color-ink-2)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{composerQuote.content}</p>
              </div>
              <button onClick={() => setComposerQuote(null)} style={{ color: 'var(--color-ink-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
                <X style={{ width: 12, height: 12 }} />
              </button>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-surface)', border: '2px solid var(--color-ink)', borderRadius: 12, padding: '8px 10px' }}>
            <textarea ref={inputRef} value={messageText} onChange={e => setMessageText(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Say something about the book…" rows={1}
              className="flex-1 resize-none bg-transparent outline-none font-serif"
              style={{ fontSize: 14, color: 'var(--color-ink)', maxHeight: 100, lineHeight: 1.5, caretColor: 'var(--color-accent)', padding: 0, display: 'block' }}
              onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = `${Math.min(t.scrollHeight, 100)}px` }} />
            <div style={{ display: 'flex' }}>
            <button onClick={() => setComposerIsSpoiler(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                background: composerIsSpoiler ? 'var(--color-accent)' : 'var(--color-surface)',
                border: composerIsSpoiler ? '1.5px solid var(--color-ink)' : '1.5px solid var(--color-rim)',
                color: composerIsSpoiler ? '#fff' : 'var(--color-ink-3)',
                fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}>
                  {composerIsSpoiler ? <EyeOff style={{ width: 11, height: 11 }} /> : <Eye style={{ width: 11, height: 11 }} />}
                  {composerIsSpoiler ? 'Spoiler On' : 'No Spoiler'}
                </button>
              </div>
            <button onClick={handleSend} disabled={!messageText.trim() || sending}
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9,
                fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
                background: SEND_BTN_COLOR, color: '#1A1A1A', border: '2px solid var(--color-ink)', cursor: 'pointer',
                opacity: (!messageText.trim() || sending) ? 0.35 : 1, transition: 'opacity 0.15s',
              }}>
              {sending ? <Loader2 style={{ width: 11, height: 11 }} className="animate-spin" /> : <Send style={{ width: 11, height: 11 }} />}
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Highlight bubble ─────────────────────────────────────────────────────────
function HighlightBubble({ h, userId, totalPages, chapterCount }: {
  h: ReadingBuddyHighlight
  userId: number | undefined
  totalPages: number
  chapterCount: number
}) {
  const isMe     = h.user.id === userId
  const name     = h.user.display_name || h.user.username
  const firstName = name.split(' ')[0]
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const time     = new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  let chapterLabel: string | null = null
  if (totalPages > 0 && chapterCount > 0) {
    const chIdx = Math.min(chapterCount - 1, Math.floor((h.page_number / totalPages) * chapterCount))
    chapterLabel = `Ch. ${chIdx + 1}`
  }

  return (
    <div className={`flex items-start gap-2.5 mb-5 ${isMe ? 'flex-row-reverse' : ''}`}>
      <div style={{
        width: 34, height: 34, borderRadius: '50%',
        backgroundColor: isMe ? MY_AVATAR_BG : PTN_AVATAR_BG,
        color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 900, flexShrink: 0,
        border: '2px solid var(--color-ink)',
      }}>
        {initials}
      </div>
      <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
        {/* Header row */}
        <div className={`flex items-center gap-1 ${isMe ? 'flex-row-reverse' : ''}`}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-ink)' }}>{isMe ? 'You' : firstName}</span>
          <span style={{ fontSize: 10, color: 'var(--color-ink-3)' }}>&middot;</span>
          <span style={{ fontSize: 10, color: 'var(--color-ink-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Highlighter style={{ width: 9, height: 9 }} />
            shared a highlight
          </span>
          {chapterLabel && <>
            <span style={{ fontSize: 10, color: 'var(--color-ink-3)' }}>&middot;</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-ink-2)' }}>{chapterLabel}</span>
          </>}
          <span style={{ fontSize: 10, color: 'var(--color-ink-3)' }}>&middot;</span>
          <span style={{ fontSize: 10, color: 'var(--color-ink-3)' }}>{time}</span>
        </div>

        {/* Highlight card — locked or full */}
        {h.locked ? (
          <div style={{
            borderRadius: 14,
            backgroundColor: 'var(--color-surface)',
            border: '2px dashed var(--color-ink)',
            padding: '16px',
            width: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              backgroundColor: 'var(--color-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Lock style={{ width: 16, height: 16, color: '#FAF6EB' }} />
            </div>
            <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-ink)', margin: 0 }}>
              Spoiler locked
            </p>
            <p style={{ fontSize: 11, color: 'var(--color-ink-3)', margin: 0, lineHeight: 1.5 }}>
              {firstName} marked this as a spoiler. Update your progress past{' '}
              <span style={{ fontWeight: 700, color: 'var(--color-ink)' }}>p. {h.page_number}</span> to reveal it.
            </p>
          </div>
        ) : (
          <div style={{
            borderRadius: 14,
            backgroundColor: HIGHLIGHT_BG,
            border: '2px solid var(--color-ink)',
            boxShadow: '4px 4px 0px var(--color-ink)',
            padding: '14px 16px',
            width: '100%',
          }}>
            {/* Page badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              backgroundColor: 'var(--color-ink)', color: '#FAF6EB',
              borderRadius: 5, padding: '2px 8px',
              fontSize: 9, fontWeight: 900, letterSpacing: '0.1em',
              textTransform: 'uppercase', marginBottom: 10,
            }}>
              P. {h.page_number}
            </div>

            {/* Quote */}
            <blockquote className="font-serif" style={{
              fontSize: 14, lineHeight: 1.65, color: 'var(--color-ink)',
              fontStyle: 'italic', margin: 0,
            }}>
              &ldquo;{h.highlighted_text}&rdquo;
            </blockquote>

            {/* Dashed divider + note + moods */}
            <div style={{ borderTop: '1.5px dashed rgba(26,26,26,0.3)', marginTop: 12, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {h.note ? (
                <p style={{ fontSize: 12, color: 'var(--color-ink)', margin: 0, lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 800 }}>{isMe ? 'Your' : `${firstName}'s`} note:</span>{' '}
                  {h.note}
                </p>
              ) : (
                <p style={{ fontSize: 11, color: 'rgba(26,26,26,0.45)', margin: 0, fontStyle: 'italic' }}>
                  {isMe ? 'Your' : `${firstName}'s`} highlight
                  {h.page_image_url && <span style={{ marginLeft: 6 }}>· photo attached</span>}
                </p>
              )}
              {h.moods && h.moods.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {h.moods.map(mood => {
                    const Icon = MOOD_ICON[mood]
                    return (
                      <span key={mood} style={{
                        fontSize: 11, padding: '3px 8px', borderRadius: 999,
                        backgroundColor: 'rgba(26,26,26,0.1)',
                        border: '1px solid rgba(26,26,26,0.2)',
                        color: 'var(--color-ink)', fontWeight: 700,
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}>
                        {Icon && <Icon style={{ width: 10, height: 10, flexShrink: 0 }} />}
                        {mood}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
