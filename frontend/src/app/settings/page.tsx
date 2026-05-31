'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth, apiClient, useUserList } from '@book-app/shared'
import { LogOut, Upload, X, Check, Search, Plus, ChevronUp, ChevronDown, BookOpen, User as UserIcon } from 'lucide-react'
import type { UserBook } from '@book-app/shared'

import ProtectedRoute from '@/components/ProtectedRoute'
import { GoodreadsImportInline } from '@/components/GoodreadsImportInline'
import { mockGenres } from '@/utils/onboardingData'
import type { Author, Genre } from '@book-app/shared'

const SECTIONS = [
  { id: 'stamp',         num: '01', title: 'The Stamp',      sub: 'PUBLIC PROFILE' },
  { id: 'compass',       num: '02', title: 'Compass',         sub: 'GENRES & AUTHORS' },
  { id: 'hall-of-fame',  num: '03', title: 'Hall of Fame',    sub: 'YOUR TOP 10' },
  { id: 'migration',     num: '04', title: 'Migration',       sub: 'BRING YOUR BOOKS' },
  { id: 'ledger',        num: '05', title: 'The Ledger',      sub: 'ACCOUNT & SIGN OUT' },
]

// ── Hero ──────────────────────────────────────────────────────────────────────

function PageHero() {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', backgroundColor: 'var(--color-canvas)', borderBottom: '2px solid var(--color-ink)', paddingTop: 48, paddingBottom: 52 }}>
      <div className="container-mobile">
        <div style={{ maxWidth: '42rem' }}>
          <div style={{ display: 'inline-flex', border: '1.5px solid var(--color-ink)', padding: '5px 11px', borderRadius: 4, transform: 'rotate(-2deg)', marginBottom: 20, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--color-ink)', textTransform: 'uppercase' }}>
            Settings · Maintenance
          </div>
          <h1 className="font-serif font-black" style={{ fontSize: 'clamp(3.2rem, 8.5vw, 7rem)', lineHeight: 1.02, color: 'var(--color-ink)', letterSpacing: '-0.02em', marginBottom: 18 }}>
            Your <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>shelf</em>,<br />your stamp.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--color-ink-2)', lineHeight: 1.65 }}>
            The bits about <strong style={{ color: 'var(--color-ink)', fontWeight: 700 }}>you</strong>: who you are on the page, what you like to read,{' '}
            the ten books on your imaginary mantel, and the door to the ledger.
          </p>
        </div>
      </div>
      <div aria-hidden style={{ position: 'absolute', top: -220, right: -180, width: 680, height: 680, borderRadius: '50%', backgroundColor: 'var(--color-accent)', border: '3px solid var(--color-ink)', pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', top: 52, right: 148, width: 88, height: 88, borderRadius: '50%', backgroundColor: 'var(--color-accent-yellow)', border: '3px solid var(--color-ink)', pointerEvents: 'none' }} />
    </div>
  )
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function FieldLabel({ label, hint, hintAccent, icon }: { label: string; hint?: string; hintAccent?: boolean; icon?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 22, height: 1.5, backgroundColor: 'var(--color-accent)', flexShrink: 0 }} />
        {icon && <span style={{ color: 'var(--color-accent)', display: 'flex' }}>{icon}</span>}
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--color-ink)' }}>{label}</span>
      </div>
      {hint && <span style={{ fontSize: 13, fontWeight: 600, color: hintAccent ? 'var(--color-accent)' : 'var(--color-ink-3)' }}>{hint}</span>}
    </div>
  )
}

function Toast({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        borderRadius: 8, padding: '10px 14px', marginBottom: 16,
        border: `2px solid ${type === 'success' ? 'var(--color-success)' : 'var(--color-accent)'}`,
        backgroundColor: type === 'success' ? 'var(--color-success-light)' : 'var(--color-accent-subtle)',
        color: type === 'success' ? 'var(--color-success)' : 'var(--color-accent)',
        boxShadow: `3px 3px 0px ${type === 'success' ? 'var(--color-success)' : 'var(--color-accent)'}`,
      }}
    >
      {type === 'success' ? <Check size={14} strokeWidth={2.5} /> : <X size={14} strokeWidth={2.5} />}
      <span style={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{message}</span>
    </motion.div>
  )
}

function SaveButton({ label = 'Save Profile', onClick, isLoading }: { label?: string; onClick?: () => void; isLoading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '12px 26px', borderRadius: 9999,
        backgroundColor: 'var(--color-ink)', color: 'var(--color-canvas)',
        border: '2px solid var(--color-ink)',
        boxShadow: '3px 3px 0px var(--color-accent)',
        fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase',
        cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1,
      }}
    >
      {isLoading ? 'Saving…' : `${label} →`}
    </button>
  )
}

interface SectionCardProps {
  id: string; num: string; title: string; subtitle: string
  children: React.ReactNode; footer?: React.ReactNode
  innerRef?: (el: HTMLDivElement | null) => void
  shadowColor?: string
}

function SectionCard({ id, num, title, subtitle, children, footer, innerRef, shadowColor = 'var(--color-accent)' }: SectionCardProps) {
  return (
    <div id={id} ref={innerRef} style={{ border: '2px solid var(--color-ink)', borderRadius: 16, boxShadow: `6px 6px 0px ${shadowColor}`, backgroundColor: 'var(--color-canvas)', overflow: 'hidden', scrollMarginTop: 120 }}>
      <div style={{ padding: '28px 32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <span className="font-serif font-black" style={{ fontSize: '3rem', lineHeight: 1, color: 'var(--color-accent)', flexShrink: 0 }}>{num}</span>
          <div>
            <h2 className="font-serif font-black" style={{ fontSize: '1.75rem', color: 'var(--color-ink)', lineHeight: 1.1 }}>{title}</h2>
            <p style={{ fontSize: 14, color: 'var(--color-ink-3)', marginTop: 4 }}>{subtitle}</p>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1.5px dashed var(--color-rim)', margin: '0 32px' }} />
      <div style={{ padding: '28px 32px' }}>{children}</div>
      {footer && (
        <div style={{ padding: '0 32px 28px', display: 'flex', justifyContent: 'flex-end' }}>{footer}</div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface ProfileFormData { display_name: string; bio: string; avatar_file: File | null }
interface PreferencesFormData { genres: string[]; author_ids: number[] }

function SettingsContent() {
  const router = useRouter()
  const { user, refreshUser, logout } = useAuth()
  const [loading, setLoading] = useState(true)

  const [activeSection, setActiveSection] = useState('stamp')
  const activeSectionRef = useRef('stamp')
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const leftNavRef = useRef<HTMLDivElement>(null)

  // Combined scroll handler: drives both scrollspy and manual sticky.
  // position:sticky is broken by overflow-x:hidden on <body>, so we
  // simulate it with translateY. Heights are cached outside the handler
  // to avoid layout thrashing (read+write on every scroll pixel = jitter).
  useEffect(() => {
    if (loading) return

    const STICK_OFFSET = 100
    const nav = leftNavRef.current
    const grid = nav?.parentElement
    if (!nav || !grid) return

    // Cache heights — only change on resize, not on scroll
    let navH = nav.offsetHeight
    let gridH = grid.offsetHeight

    const ro = new ResizeObserver(() => {
      navH = nav.offsetHeight
      gridH = grid.offsetHeight
    })
    ro.observe(grid)

    const update = () => {
      // — Manual sticky: one getBoundingClientRect read, then write —
      const gridTop = grid.getBoundingClientRect().top
      const scrolled = Math.max(0, STICK_OFFSET - gridTop)
      const maxScroll = Math.max(0, gridH - navH - 32)
      nav.style.transform = `translateY(${Math.round(Math.min(scrolled, maxScroll))}px)`

      // — Scrollspy —
      const nearBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 80
      let current: string
      if (nearBottom) {
        current = SECTIONS[SECTIONS.length - 1].id
      } else {
        const triggerY = window.scrollY + STICK_OFFSET + 60
        current = SECTIONS[0].id
        for (const s of SECTIONS) {
          const el = sectionRefs.current[s.id]
          if (el && el.getBoundingClientRect().top + window.scrollY <= triggerY) {
            current = s.id
          }
        }
      }
      if (current !== activeSectionRef.current) {
        activeSectionRef.current = current
        setActiveSection(current)
      }
    }

    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [loading])

  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const { list: top10List, loading: top10Loading, saving: top10Saving,
    addBook: addToTop10, removeBook: removeFromTop10, reorder: reorderTop10 } =
    useUserList(user?.id, 'top_10')
  const [completedBooks, setCompletedBooks] = useState<UserBook[]>([])
  const [completedLoading, setCompletedLoading] = useState(false)
  const [bookQuery, setBookQuery] = useState('')
  const [top10Toast, setTop10Toast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [profileForm, setProfileForm] = useState<ProfileFormData>({ display_name: '', bio: '', avatar_file: null })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileToast, setProfileToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [prefsForm, setPrefsForm] = useState<PreferencesFormData>({ genres: [], author_ids: [] })
  const [authors, setAuthors] = useState<Author[]>([])
  const [authorsLoading, setAuthorsLoading] = useState(true)
  const [authorSearchLoading, setAuthorSearchLoading] = useState(false)
  const authorSearchId = useRef(0)
  const savedAuthorsRef = useRef<Author[]>([])
  const [genres] = useState<Genre[]>(mockGenres)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [prefsToast, setPrefsToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (user) {
      setProfileForm({ display_name: user.display_name || '', bio: user.bio || '', avatar_file: null })
      fetchPreferencesAndAuthors()
    }
  }, [user])

  const fetchCompletedBooks = useCallback(async () => {
    if (completedBooks.length > 0) return
    setCompletedLoading(true)
    try { const { user_books } = await apiClient.getUserBooks({ shelf: 'read' }); setCompletedBooks(user_books) }
    catch { /* non-fatal */ } finally { setCompletedLoading(false) }
  }, [completedBooks.length])

  useEffect(() => { if (user?.id && !top10Loading) fetchCompletedBooks() }, [user?.id, top10Loading])

  const filteredBooks = bookQuery.trim()
    ? completedBooks.filter(ub => ub.book?.title?.toLowerCase().includes(bookQuery.toLowerCase()) || ub.book?.author_name?.toLowerCase().includes(bookQuery.toLowerCase()))
    : completedBooks

  const handleTop10AddBook = async (userBook: UserBook) => {
    if (!userBook.book) return
    setBookQuery('')
    try { await addToTop10(userBook.book.id); setTop10Toast({ type: 'success', message: `"${userBook.book.title}" added to your Top 10` }); setTimeout(() => setTop10Toast(null), 3000) }
    catch (e: any) { setTop10Toast({ type: 'error', message: e?.response?.data?.error ?? 'Failed to add book' }) }
  }

  const handleTop10Remove = async (itemId: number) => {
    try { await removeFromTop10(itemId) }
    catch (e: any) { setTop10Toast({ type: 'error', message: e?.message ?? 'Failed to remove' }) }
  }

  const handleTop10MoveUp = async (index: number) => {
    const items = top10List?.items ?? []; if (index === 0) return
    const above = items[index - 1]; const current = items[index]
    await reorderTop10([{ id: current.id, position: above.position }, { id: above.id, position: current.position }])
  }

  const handleTop10MoveDown = async (index: number) => {
    const items = top10List?.items ?? []; if (index === items.length - 1) return
    const below = items[index + 1]; const current = items[index]
    await reorderTop10([{ id: current.id, position: below.position }, { id: below.id, position: current.position }])
  }

  const fetchPreferencesAndAuthors = async () => {
    try {
      const prefs = await apiClient.getPreferences()
      const authorIds = prefs.author_ids || []
      setPrefsForm({ genres: prefs.genres || [], author_ids: authorIds })
      await fetchAuthors(authorIds)
    } catch (err) { console.error('Failed to fetch preferences:', err) }
    finally { setLoading(false) }
  }

  const fetchAuthors = async (savedAuthorIds: number[] = []) => {
    setAuthorsLoading(true)
    try {
      const [browseResult, savedResult] = await Promise.all([
        apiClient.getAuthors({ per_page: 100 }),
        savedAuthorIds.length ? apiClient.getAuthorsByIds(savedAuthorIds) : Promise.resolve({ authors: [] as Author[] }),
      ])
      const browse = Array.isArray(browseResult) ? browseResult : browseResult.authors ?? []
      const saved = savedResult.authors ?? []
      savedAuthorsRef.current = saved
      const browseIds = new Set(browse.map((a: Author) => a.id))
      setAuthors([...browse, ...saved.filter((a: Author) => !browseIds.has(a.id))])
    } catch (err) { console.error('Failed to fetch authors:', err) }
    finally { setAuthorsLoading(false) }
  }

  const handleAuthorSearch = useCallback(async (query: string) => {
    const id = ++authorSearchId.current; setAuthorSearchLoading(true)
    try {
      const result = query ? await apiClient.searchAuthors(query, 1, 50) : await apiClient.getAuthors({ per_page: 100 })
      if (id !== authorSearchId.current) return
      const fetched: Author[] = Array.isArray(result) ? result : result.authors || []
      if (query) { setAuthors(fetched) } else {
        const fetchedIds = new Set(fetched.map((a: Author) => a.id))
        setAuthors([...fetched, ...savedAuthorsRef.current.filter((a: Author) => !fetchedIds.has(a.id))])
      }
    } catch (err) { console.error('Author search failed:', err) }
    finally { if (id === authorSearchId.current) setAuthorSearchLoading(false) }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 5 * 1024 * 1024) { setProfileToast({ type: 'error', message: 'Image too large — max 5 MB' }); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setProfileToast({ type: 'error', message: 'Please upload a JPEG, PNG, or WebP image' }); return }
    setProfileForm(prev => ({ ...prev, avatar_file: file }))
    const reader = new FileReader(); reader.onloadend = () => setAvatarPreview(reader.result as string); reader.readAsDataURL(file)
    setProfileToast(null)
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setSavingProfile(true); setProfileToast(null)
    try {
      await apiClient.updateUser(user.id, { display_name: profileForm.display_name || undefined, bio: profileForm.bio || undefined, avatar: profileForm.avatar_file || undefined })
      await refreshUser()
      setProfileForm(prev => ({ ...prev, avatar_file: null })); setAvatarPreview(null)
      setProfileToast({ type: 'success', message: 'Profile updated' })
    } catch (err) { setProfileToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update profile' }) }
    finally { setSavingProfile(false) }
  }

  const handleSavePrefs = async () => {
    setSavingPrefs(true); setPrefsToast(null)
    try { await apiClient.savePreferences({ genres: prefsForm.genres, author_ids: prefsForm.author_ids }); setPrefsToast({ type: 'success', message: 'Preferences saved' }) }
    catch (err) { setPrefsToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to save preferences' }) }
    finally { setSavingPrefs(false) }
  }

  if (loading || !user) {
    return (
      <>
        <PageHero />
        <div className="container-mobile py-8" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[240, 180, 320].map((h, i) => (
            <div key={i} style={{ height: h, borderRadius: 16, backgroundColor: 'var(--color-surface)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      </>
    )
  }

  const avatarSrc = avatarPreview || user.avatar_url
  const avatarInitial = (user.display_name || user.username || '?').charAt(0).toUpperCase()

  return (
    <>
      <PageHero />
      <div className="container-mobile py-8">
        <div className="grid gap-8 md:gap-12 md:grid-cols-[280px_1fr] items-start">

          {/* ── Left nav — hidden on mobile, sticky on md+ ───────────── */}
          <div ref={leftNavRef} className="hidden md:block" style={{ willChange: 'transform' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 22, height: 1.5, backgroundColor: 'var(--color-ink)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-ink)' }}>Sections</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {SECTIONS.map(s => {
                const active = activeSection === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => scrollToSection(s.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderRadius: 10, width: '100%', textAlign: 'left', cursor: 'pointer',
                      border: active ? '2px solid var(--color-ink)' : '2px solid transparent',
                      boxShadow: active ? '3px 3px 0px var(--color-ink)' : 'none',
                      backgroundColor: active ? 'var(--color-canvas)' : 'transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span className="font-serif font-black" style={{ fontSize: '1.1rem', color: active ? 'var(--color-accent)' : 'var(--color-ink-3)', flexShrink: 0, minWidth: 28 }}>
                      {s.num}
                    </span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1.2 }}>{s.title}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-ink-3)', marginTop: 2 }}>{s.sub}</div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Manifesto card */}
            <div style={{ marginTop: 32, border: '2px solid var(--color-ink)', borderRadius: 12, padding: '18px 20px', boxShadow: '4px 4px 0px var(--color-ink)' }}>
              <div style={{ display: 'inline-block', border: '1.5px solid var(--color-accent)', borderRadius: 4, padding: '3px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: 12 }}>
                Manifesto
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-ink-2)', lineHeight: 1.7, fontStyle: 'italic' }}>
                We never sell what you save. Your library is yours, your notes are yours, your DNFs are yours.
              </p>
            </div>
          </div>

          {/* ── Right sections ────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28, paddingBottom: 80 }}>

            {/* 01 — The Stamp */}
            <SectionCard id="stamp" num="01" title="The Stamp" subtitle="Visible to other readers — your face, your name, your bio."
              innerRef={el => { sectionRefs.current['stamp'] = el }}
              footer={<SaveButton onClick={handleSaveProfile} isLoading={savingProfile} />}
            >
              {profileToast && <Toast type={profileToast.type} message={profileToast.message} />}
              <div className="grid gap-6 sm:grid-cols-[180px_1fr] items-start">

                {/* Avatar */}
                <div>
                  <div style={{ width: 180, height: 200, borderRadius: 14, border: '2px solid var(--color-ink)', overflow: 'hidden', position: 'relative', backgroundColor: 'var(--color-accent-yellow)', boxShadow: '4px 4px 0px var(--color-ink)' }}>
                    {avatarSrc
                      ? <img src={avatarSrc} alt="Your avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="font-serif font-black" style={{ fontSize: '6rem', color: 'var(--color-ink)', lineHeight: 1, opacity: 0.85 }}>{avatarInitial}</span>
                        </div>
                    }
                    <div style={{ position: 'absolute', bottom: 10, right: 10, backgroundColor: 'var(--color-canvas)', border: '1.5px solid var(--color-ink)', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--color-ink)', textTransform: 'uppercase' }}>
                      You
                    </div>
                  </div>

                  <label style={{ display: 'block', marginTop: 10, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', borderRadius: 8, backgroundColor: 'var(--color-ink)', color: 'var(--color-canvas)', border: '2px solid var(--color-ink)', boxShadow: '3px 3px 0px var(--color-accent)', fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                      <Upload size={12} /> Change
                    </div>
                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
                  </label>

                  {avatarPreview && (
                    <button type="button" onClick={() => { setAvatarPreview(null); setProfileForm(prev => ({ ...prev, avatar_file: null })) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 12, color: 'var(--color-ink-3)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
                      <X size={11} /> Remove
                    </button>
                  )}
                  <p style={{ fontSize: 11, color: 'var(--color-ink-3)', marginTop: 8, lineHeight: 1.6 }}>JPG, PNG or WebP<br />max 5 MB</p>
                </div>

                {/* Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <FieldLabel label="Display Name" hint="How you want to be known on the page" />
                    <input
                      type="text"
                      value={profileForm.display_name}
                      onChange={e => setProfileForm(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="Your name here"
                      style={{ width: '100%', padding: '12px 16px', border: '2px solid var(--color-ink)', borderRadius: 10, fontSize: 15, color: 'var(--color-ink)', backgroundColor: 'var(--color-canvas)', outline: 'none', boxSizing: 'border-box', transition: 'box-shadow 0.15s' }}
                      onFocus={e => (e.currentTarget.style.boxShadow = '3px 3px 0px var(--color-accent)')}
                      onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Bio" hint={`${profileForm.bio.length} / 500 characters`} />
                    <textarea
                      value={profileForm.bio}
                      onChange={e => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell other readers about yourself…"
                      rows={5} maxLength={500}
                      style={{ width: '100%', padding: '12px 16px', border: '2px solid var(--color-ink)', borderRadius: 10, fontSize: 15, color: 'var(--color-ink)', backgroundColor: 'var(--color-canvas)', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.65, boxSizing: 'border-box', fontStyle: profileForm.bio ? 'italic' : 'normal', transition: 'box-shadow 0.15s' }}
                      onFocus={e => (e.currentTarget.style.boxShadow = '3px 3px 0px var(--color-accent)')}
                      onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* 02 — The Compass */}
            <SectionCard id="compass" num="02" title="The Compass"
              subtitle="What we use to point you toward next reads. Pick liberally — change any time."
              shadowColor="var(--color-accent-teal)"
              innerRef={el => { sectionRefs.current['compass'] = el }}
              footer={<SaveButton label="Save Preferences" onClick={handleSavePrefs} isLoading={savingPrefs} />}
            >
              {prefsToast && <Toast type={prefsToast.type} message={prefsToast.message} />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

                {/* Genres */}
                <div>
                  <FieldLabel
                    label="Favourite Genres"
                    icon={<BookOpen size={12} />}
                    hint={prefsForm.genres.length > 0 ? `${prefsForm.genres.length} selected` : undefined}
                    hintAccent
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                    {genres.map(genre => {
                      const selected = prefsForm.genres.includes(genre.id)
                      return (
                        <button
                          key={genre.id}
                          onClick={() => setPrefsForm(prev => ({
                            ...prev,
                            genres: prev.genres.includes(genre.id)
                              ? prev.genres.filter(g => g !== genre.id)
                              : [...prev.genres, genre.id],
                          }))}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '9px 18px', borderRadius: 9999,
                            border: '2px solid var(--color-ink)',
                            backgroundColor: selected ? 'var(--color-ink)' : 'transparent',
                            color: selected ? 'var(--color-canvas)' : 'var(--color-ink)',
                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            boxShadow: selected ? '3px 3px 0px var(--color-accent)' : 'none',
                            transition: 'background-color 0.12s, color 0.12s, box-shadow 0.12s',
                          }}
                        >
                          {selected && <Check size={13} strokeWidth={3} />}
                          {genre.name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Authors */}
                <div>
                  <FieldLabel
                    label="Favourite Authors"
                    icon={<UserIcon size={12} />}
                    hint={prefsForm.author_ids.length > 0 ? `${prefsForm.author_ids.length} selected` : undefined}
                    hintAccent
                  />

                  {/* Search */}
                  <div style={{ position: 'relative', marginTop: 14, marginBottom: 14 }}>
                    <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-3)', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      placeholder="Search for an author..."
                      onChange={e => handleAuthorSearch(e.target.value)}
                      style={{
                        width: '100%', padding: '14px 16px 14px 44px',
                        border: '2px solid var(--color-ink)', borderRadius: 12,
                        fontSize: 15, color: 'var(--color-ink)', backgroundColor: 'var(--color-canvas)',
                        outline: 'none', boxSizing: 'border-box',
                      }}
                      onFocus={e => (e.currentTarget.style.boxShadow = '3px 3px 0px var(--color-accent-teal)')}
                      onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
                    />
                  </div>

                  {/* Author grid */}
                  {authorsLoading
                    ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 60, borderRadius: 10, backgroundColor: 'var(--color-surface)' }} />)}
                      </div>
                    : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
                        {authors.map(author => {
                          const selected = prefsForm.author_ids.includes(author.id)
                          const initial = (author.name || '?').charAt(0).toUpperCase()
                          return (
                            <button
                              key={author.id}
                              onClick={() => setPrefsForm(prev => ({
                                ...prev,
                                author_ids: prev.author_ids.includes(author.id)
                                  ? prev.author_ids.filter(a => a !== author.id)
                                  : [...prev.author_ids, author.id],
                              }))}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 12px', borderRadius: 10, textAlign: 'left',
                                border: '2px solid var(--color-ink)',
                                backgroundColor: selected ? 'var(--color-accent)' : 'var(--color-canvas)',
                                color: selected ? 'var(--color-canvas)' : 'var(--color-ink)',
                                cursor: 'pointer', width: '100%',
                                boxShadow: selected ? '3px 3px 0px var(--color-ink)' : 'none',
                                transition: 'background-color 0.12s, color 0.12s, box-shadow 0.12s',
                              }}
                            >
                              <div style={{
                                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                                backgroundColor: 'var(--color-accent-yellow)',
                                border: '2px solid var(--color-ink)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-ink)' }}>{initial}</span>
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {author.name}
                              </span>
                              {selected && <Check size={14} strokeWidth={2.5} style={{ flexShrink: 0 }} />}
                            </button>
                          )
                        })}
                      </div>
                  }
                </div>

              </div>
            </SectionCard>

            {/* 03 — The Hall of Fame */}
            <SectionCard id="hall-of-fame" num="03" title="The Hall of Fame"
              subtitle="Your all-time top ten — shown on your profile, in this exact order."
              shadowColor="var(--color-accent-yellow)"
              innerRef={el => { sectionRefs.current['hall-of-fame'] = el }}
            >
              {top10Toast && <Toast type={top10Toast.type} message={top10Toast.message} />}
              {top10Loading
                ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1,2,3].map(i => <div key={i} style={{ height: 72, borderRadius: 12, backgroundColor: 'var(--color-surface)' }} />)}</div>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Mantel header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 22, height: 1.5, backgroundColor: 'var(--color-ink)' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-ink)' }}>The Mantel</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span className="font-serif font-black" style={{ fontSize: '1.4rem', color: 'var(--color-accent)', lineHeight: 1 }}>
                          {top10List?.items?.length ?? 0}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--color-ink-3)' }}>/ 10 books pinned</span>
                      </div>
                    </div>

                    {/* Mantel list */}
                    {(top10List?.items?.length ?? 0) > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(top10List?.items ?? []).map((item: any, index: number) => {
                          const isFirst = index === 0
                          const isLast = index === (top10List?.items?.length ?? 0) - 1
                          const rating = completedBooks.find(ub => ub.book?.id === item.book.id)?.rating ?? null
                          return (
                            <div
                              key={item.id}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 14,
                                padding: '14px 16px',
                                border: '2px solid var(--color-ink)', borderRadius: 12,
                                backgroundColor: isFirst ? 'var(--color-accent-yellow)' : 'var(--color-canvas)',
                              }}
                            >
                              {/* Rank badge */}
                              <div style={{
                                width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                                border: '2px solid var(--color-ink)',
                                backgroundColor: isFirst ? 'var(--color-ink)' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <span className="font-serif font-black" style={{ fontSize: 17, color: isFirst ? 'var(--color-canvas)' : 'var(--color-ink)' }}>
                                  {item.position}
                                </span>
                              </div>

                              {/* Cover */}
                              {item.book.cover_image_url
                                ? <img src={item.book.cover_image_url} alt={item.book.title} style={{ width: 44, height: 58, borderRadius: 5, objectFit: 'cover', flexShrink: 0, border: '1.5px solid rgba(0,0,0,0.18)' }} />
                                : <div style={{ width: 44, height: 58, borderRadius: 5, flexShrink: 0, backgroundColor: 'var(--color-surface)', border: '1.5px solid rgba(0,0,0,0.1)' }} />
                              }

                              {/* Info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                                  {item.book.title}
                                </p>
                                <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--color-accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: rating ? 3 : 0 }}>
                                  by {item.book.author_name}
                                </p>
                                {rating && (
                                  <span style={{ fontSize: 12, color: 'var(--color-accent)', letterSpacing: 1 }}>
                                    {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
                                  </span>
                                )}
                              </div>

                              {/* Controls */}
                              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                <button onClick={() => handleTop10MoveUp(index)} disabled={isFirst || top10Saving}
                                  style={{ width: 32, height: 32, borderRadius: 6, border: '2px solid var(--color-ink)', backgroundColor: 'var(--color-canvas)', cursor: isFirst ? 'default' : 'pointer', opacity: isFirst ? 0.25 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isFirst ? 'none' : '2px 2px 0px var(--color-ink)' }}>
                                  <ChevronUp size={14} />
                                </button>
                                <button onClick={() => handleTop10MoveDown(index)} disabled={isLast || top10Saving}
                                  style={{ width: 32, height: 32, borderRadius: 6, border: '2px solid var(--color-ink)', backgroundColor: 'var(--color-canvas)', cursor: isLast ? 'default' : 'pointer', opacity: isLast ? 0.25 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isLast ? 'none' : '2px 2px 0px var(--color-ink)' }}>
                                  <ChevronDown size={14} />
                                </button>
                                <button onClick={() => handleTop10Remove(item.id)} disabled={top10Saving}
                                  style={{ width: 32, height: 32, borderRadius: 6, border: '2px solid var(--color-accent)', backgroundColor: 'var(--color-canvas)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 0px var(--color-accent)' }}>
                                  <X size={14} style={{ color: 'var(--color-accent)' }} />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Add from library */}
                    {(top10List?.items?.length ?? 0) < 10 && (
                      <div style={{ border: '1.5px dashed var(--color-ink)', borderRadius: 12, padding: '20px', opacity: 0.9 }}>
                        {/* Label */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                          <div style={{ width: 22, height: 1.5, backgroundColor: 'var(--color-ink)' }} />
                          <Plus size={12} style={{ color: 'var(--color-ink)' }} />
                          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-ink)' }}>
                            Add from your finished books
                          </span>
                        </div>

                        {/* Search */}
                        <div style={{ position: 'relative', marginBottom: 14 }}>
                          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-3)', pointerEvents: 'none' }} />
                          <input type="text" placeholder="Filter by title or author…" value={bookQuery} onChange={e => setBookQuery(e.target.value)}
                            style={{ width: '100%', padding: '12px 14px 12px 40px', border: '2px solid var(--color-ink)', borderRadius: 10, fontSize: 14, color: 'var(--color-ink)', backgroundColor: 'var(--color-canvas)', outline: 'none', boxSizing: 'border-box' }}
                            onFocus={e => (e.currentTarget.style.boxShadow = '3px 3px 0px var(--color-accent-yellow)')}
                            onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
                          />
                          {bookQuery && (
                            <button onClick={() => setBookQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4 }}>
                              <X size={13} />
                            </button>
                          )}
                        </div>

                        {/* Book list */}
                        {completedLoading
                          ? <p style={{ fontSize: 13, color: 'var(--color-ink-3)', textAlign: 'center', padding: '16px 0' }}>Loading your read books…</p>
                          : completedBooks.length === 0
                            ? <p style={{ fontSize: 13, color: 'var(--color-ink-3)', textAlign: 'center', padding: '16px 0' }}>No completed books yet — mark some as Read in your library first!</p>
                            : filteredBooks.length === 0
                              ? <p style={{ fontSize: 13, color: 'var(--color-ink-3)', textAlign: 'center', padding: '16px 0' }}>No books match &ldquo;{bookQuery}&rdquo;</p>
                              : (
                                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                                  {filteredBooks.map((ub, i) => {
                                    const book = ub.book; if (!book) return null
                                    const alreadyAdded = top10List?.items?.some((it: any) => it.book.id === book.id) ?? false
                                    return (
                                      <div key={ub.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 4px', borderBottom: i < filteredBooks.length - 1 ? '1px dashed rgba(26,26,26,0.15)' : 'none' }}>
                                        {book.cover_image_url
                                          ? <img src={book.cover_image_url} alt={book.title} style={{ width: 40, height: 54, borderRadius: 4, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(0,0,0,0.15)' }} />
                                          : <div style={{ width: 40, height: 54, borderRadius: 4, flexShrink: 0, backgroundColor: 'var(--color-surface)', border: '1px solid rgba(0,0,0,0.1)' }} />
                                        }
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <p style={{ fontSize: 14, fontWeight: 600, color: alreadyAdded ? 'var(--color-ink-3)' : 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {book.title}
                                          </p>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                            <span style={{ fontSize: 12, color: 'var(--color-ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.author_name}</span>
                                            {ub.rating && <span style={{ fontSize: 11, color: 'var(--color-accent)', letterSpacing: 0.5, flexShrink: 0 }}>{'★'.repeat(Math.round(ub.rating))}{'☆'.repeat(5 - Math.round(ub.rating))}</span>}
                                          </div>
                                        </div>
                                        {alreadyAdded
                                          ? <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-ink-3)', flexShrink: 0 }}>In list</span>
                                          : (
                                            <button onClick={() => handleTop10AddBook(ub)} disabled={top10Saving}
                                              style={{ width: 34, height: 34, borderRadius: 7, backgroundColor: 'var(--color-accent)', border: '2px solid var(--color-ink)', boxShadow: '2px 2px 0px var(--color-ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                              <Plus size={16} style={{ color: 'var(--color-canvas)' }} />
                                            </button>
                                          )
                                        }
                                      </div>
                                    )
                                  })}
                                </div>
                              )
                        }
                      </div>
                    )}

                  </div>
                )
              }
            </SectionCard>

            {/* 04 — Migration */}
            <SectionCard id="migration" num="04" title="Migration" subtitle="Bring your reading history over from other platforms."
              innerRef={el => { sectionRefs.current['migration'] = el }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Goodreads — inline import */}
                <GoodreadsImportInline />

                {/* StoryGraph — coming soon */}
                <div style={{ border: '1.5px dashed var(--color-rim)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, backgroundColor: 'var(--color-surface)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: 'var(--color-grove)', border: '2px solid var(--color-rim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-ink-3)' }}>SG</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink-2)', marginBottom: 4 }}>StoryGraph</p>
                    <p style={{ fontSize: 13, color: 'var(--color-ink-3)' }}>Import your reading data from StoryGraph.</p>
                  </div>
                  <div style={{ flexShrink: 0, border: '1.5px solid var(--color-rim)', borderRadius: 5, padding: '4px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-ink-3)' }}>
                    Coming Soon
                  </div>
                </div>

              </div>
            </SectionCard>

            {/* 05 — The Ledger */}
            <SectionCard id="ledger" num="05" title="The Ledger" subtitle="Account details and the door out."
              innerRef={el => { sectionRefs.current['ledger'] = el }}
            >
              <div>
                {[
                  { label: 'Username', value: `@${user.username}` },
                  { label: 'Email', value: user.email || '—' },
                  { label: 'Member since', value: user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1.5px dashed var(--color-rim)' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-ink-3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>{value}</span>
                  </div>
                ))}
                <div style={{ marginTop: 28 }}>
                  <button
                    onClick={() => { logout(); router.push('/login') }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 9999, border: '2px solid var(--color-ink)', backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)', fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '3px 3px 0px var(--color-ink)', transition: 'box-shadow 0.12s, background-color 0.12s, color 0.12s' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-ink)'; e.currentTarget.style.color = 'var(--color-canvas)'; e.currentTarget.style.boxShadow = '3px 3px 0px var(--color-accent)' }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-canvas)'; e.currentTarget.style.color = 'var(--color-ink)'; e.currentTarget.style.boxShadow = '3px 3px 0px var(--color-ink)' }}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </div>
            </SectionCard>

          </div>
        </div>
      </div>
    </>
  )
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  )
}
