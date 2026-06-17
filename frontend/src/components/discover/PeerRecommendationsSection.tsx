'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { apiClient } from '@book-app/shared'
import type { PeerRecommendation } from '@book-app/shared'

export function PeerRecommendationsSection() {
  const [recs, setRecs]       = useState<PeerRecommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    apiClient.getPeerRecommendations()
      .then(data => { if (!cancelled) setRecs(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const dismiss = useCallback(async (rec: PeerRecommendation) => {
    // Optimistic removal
    setRecs(prev => prev.filter(r => r.id !== rec.id))
    try {
      await apiClient.dismissRecommendation(rec.id)
    } catch {
      // Revert on failure
      setRecs(prev => [...prev, rec].sort((a, b) => b.score - a.score))
    }
  }, [])

  return (
    <section style={{ marginBottom: 80 }}>
      {/* Header */}
      <div className="flex items-baseline gap-4 flex-wrap" style={{ marginBottom: 24 }}>
        <div className="flex items-center gap-2.5">
          <div style={{ width: 22, height: 2, backgroundColor: 'var(--color-accent)', flexShrink: 0, marginBottom: 2 }} />
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.22em',
            color: 'var(--color-accent)', textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>
            Readers Like You
          </span>
        </div>
        <h2 className="font-serif font-black" style={{
          fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
          color: 'var(--color-ink)', lineHeight: 1.05,
        }}>
          Books your{' '}
          <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>reading twins</em>
          {' '}love
        </h2>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="animate-pulse" style={{
              flexShrink: 0, width: 140, height: 220,
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--color-rim)',
              borderRadius: 8,
            }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && recs.length === 0 && (
        <p style={{
          fontSize: 14, color: 'var(--color-ink-3)',
          fontStyle: 'italic', paddingTop: 8,
        }}>
          As more readers join, we&rsquo;ll surface books your reading twins love.
        </p>
      )}

      {/* Book cards */}
      {!loading && recs.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          <AnimatePresence initial={false}>
            {recs.map(rec => (
              <motion.div
                key={rec.id}
                layout
                initial={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
                style={{ flexShrink: 0, width: 140, position: 'relative' }}
              >
                {/* Dismiss button */}
                <button
                  onClick={() => dismiss(rec)}
                  aria-label="Dismiss recommendation"
                  style={{
                    position: 'absolute', top: 6, right: 6, zIndex: 2,
                    width: 22, height: 22, borderRadius: '50%',
                    backgroundColor: 'var(--color-ink)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0.7,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
                >
                  <X size={12} color="var(--color-lit)" />
                </button>

                {/* Book cover */}
                <div style={{
                  width: 140, height: 200, borderRadius: 4,
                  backgroundColor: 'var(--color-surface)',
                  border: '2px solid var(--color-ink)',
                  boxShadow: '4px 4px 0px var(--color-ink)',
                  overflow: 'hidden', marginBottom: 8,
                }}>
                  {rec.book.cover_image_url ? (
                    <img
                      src={rec.book.cover_image_url}
                      alt={rec.book.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%', padding: 10,
                      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                    }}>
                      <p className="font-serif font-bold" style={{
                        fontSize: 12, color: 'var(--color-ink)', lineHeight: 1.2,
                      }}>
                        {rec.book.title}
                      </p>
                    </div>
                  )}
                </div>

                {/* Title + author */}
                <p className="font-serif font-bold" style={{
                  fontSize: 12, color: 'var(--color-ink)',
                  lineHeight: 1.3, marginBottom: 2,
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {rec.book.title}
                </p>
                <p style={{ fontSize: 11, color: 'var(--color-ink-3)', marginBottom: 4 }}>
                  {rec.book.author_name}
                </p>
                <p style={{ fontSize: 10, color: 'var(--color-ink-3)', fontStyle: 'italic' }}>
                  {rec.reason}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  )
}
