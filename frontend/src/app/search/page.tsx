'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  useAuth,
  useUserSearch,
  useBookSearch,
  useBooksStore,
} from '@book-app/shared'

import Avatar from '@/components/Avatar'
import Link from 'next/link'
import {
  Search, Users, BookOpen, X, AlertCircle,
  ScanLine, ArrowRight,
} from 'lucide-react'
import BarcodeScannerModal from '@/components/BarcodeScannerModal'

type SearchType = 'books' | 'people'

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialType  = searchParams.get('type')
  const initialTab: SearchType = initialType === 'people' ? 'people' : 'books'

  const { user: currentUser } = useAuth()
  const { cacheSearchResults } = useBooksStore()

  const [activeTab, setActiveTab]   = useState<SearchType>(initialTab)
  const [searchInput, setSearchInput] = useState(initialQuery)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [scannerOpen, setScannerOpen] = useState(false)

  const isSearching = searchInput.trim().length > 0

  const {
    books,
    loading: booksLoading,
    error: booksError,
    setQuery: setBookQuery,
    loadMore: loadMoreBooks,
    hasMore: hasMoreBooks,
  } = useBookSearch({
    debounceMs: 350,
    initialQuery: activeTab === 'books' ? initialQuery : '',
    perPage: 20,
  })

  const {
    users,
    loading: usersLoading,
    search: searchUsers,
    loadMore: loadMoreUsers,
    hasMore: hasMoreUsers,
  } = useUserSearch({
    debounceMs: 350,
    initialQuery: activeTab === 'people' ? initialQuery : '',
    pageSize: 20,
  })

  const filteredUsers = users.filter(u => u.id !== currentUser?.id)

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (activeTab === 'books')  setBookQuery(value)
    if (activeTab === 'people') searchUsers(value)

    const params = new URLSearchParams()
    params.set('type', activeTab)
    if (value.trim()) params.set('q', value)
    router.replace(`/search?${params.toString()}`, { scroll: false })
  }

  const handleTabChange = (tab: SearchType) => {
    setActiveTab(tab)
    const params = new URLSearchParams()
    params.set('type', tab)
    if (searchInput.trim()) params.set('q', searchInput)
    router.replace(`/search?${params.toString()}`, { scroll: false })

    if (searchInput.trim()) {
      if (tab === 'books')  setBookQuery(searchInput)
      if (tab === 'people') searchUsers(searchInput)
    }
  }

  const isRateLimited = booksError?.includes('429') || booksError?.includes('Too Many')

  const tabs: { id: SearchType; label: string; icon: React.ElementType }[] = [
    { id: 'books',  label: 'Books',  icon: BookOpen },
    { id: 'people', label: 'People', icon: Users    },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-canvas)' }}>
      <div className="container-mobile py-8 sm:py-12">
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          {/* Page eyebrow */}
          <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
            <div style={{ width: 22, height: 2, backgroundColor: 'var(--color-accent)' }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.22em', color: 'var(--color-accent)', textTransform: 'uppercase' }}>
              Search
            </span>
          </div>

          {/* Search input */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search
              size={18}
              style={{
                position: 'absolute', left: 18, top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-ink-3)', pointerEvents: 'none',
              }}
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder={activeTab === 'books' ? 'Search titles, authors, ISBN…' : 'Search readers by name or username…'}
              style={{
                width: '100%',
                height: 52,
                paddingLeft: 48,
                paddingRight: searchInput ? 80 : activeTab === 'books' ? 52 : 18,
                borderRadius: 999,
                border: '2px solid var(--color-ink)',
                backgroundColor: 'var(--color-canvas)',
                color: 'var(--color-ink)',
                fontSize: 15,
                fontWeight: 500,
                outline: 'none',
                boxShadow: '3px 3px 0px var(--color-ink)',
                transition: 'box-shadow 0.12s',
              }}
              onFocus={e  => (e.currentTarget.style.boxShadow = '4px 4px 0px var(--color-accent)')}
              onBlur={e   => (e.currentTarget.style.boxShadow = '3px 3px 0px var(--color-ink)')}
            />
            {searchInput ? (
              <button
                onClick={() => handleSearchChange('')}
                style={{
                  position: 'absolute', right: activeTab === 'books' ? 48 : 14,
                  top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--color-ink-3)', padding: 6,
                }}
              >
                <X size={15} />
              </button>
            ) : null}
            {activeTab === 'books' && (
              <button
                onClick={() => setScannerOpen(true)}
                title="Scan book barcode"
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  width: 34, height: 34, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'var(--color-accent)',
                  color: '#FAF6EB',
                  border: '2px solid var(--color-ink)',
                  cursor: 'pointer',
                }}
                onMouseDown={e => { e.currentTarget.style.opacity = '0.8' }}
                onMouseUp={e => { e.currentTarget.style.opacity = '1' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >
                <ScanLine size={15} />
              </button>
            )}
          </div>

          {/* Tab toggle */}
          <div
            style={{
              display: 'flex',
              border: '2px solid var(--color-ink)',
              borderRadius: 999,
              overflow: 'hidden',
              marginBottom: 36,
            }}
          >
            {tabs.map((tab, i) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderLeft: i > 0 ? '2px solid var(--color-ink)' : 'none',
                    backgroundColor: active ? 'var(--color-ink)' : 'transparent',
                    color: active ? 'var(--color-canvas)' : 'var(--color-ink)',
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    transition: 'background-color 0.12s, color 0.12s',
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* ── Empty state ── */}
          {!isSearching && (
            <div style={{ textAlign: 'center', paddingTop: 48 }}>
              <div
                style={{
                  width: 56, height: 56, borderRadius: 16,
                  border: '2px solid var(--color-ink)',
                  boxShadow: '3px 3px 0px var(--color-ink)',
                  backgroundColor: 'var(--color-cave)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Search size={22} style={{ color: 'var(--color-ink-2)' }} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                Start typing to search
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-ink-3)', marginTop: 4 }}>
                {activeTab === 'books' ? 'Search by title, author, or ISBN' : 'Search readers by name or username'}
              </p>
            </div>
          )}

          {/* ── Results ── */}
          {isSearching && (
            <div>

              {/* Rate limit warning */}
              {isRateLimited && (
                <div
                  className="flex items-start gap-3"
                  style={{
                    padding: '12px 16px', borderRadius: 12, marginBottom: 20,
                    backgroundColor: 'var(--color-cave)',
                    border: '1.5px solid var(--color-rim-accent)',
                  }}
                >
                  <AlertCircle size={16} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 13, color: 'var(--color-ink-2)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-ink)' }}>Search temporarily unavailable.</span>
                    {' '}Google Books rate limit reached — try again in a few minutes.
                  </p>
                </div>
              )}

              {/* Books */}
              {activeTab === 'books' && (
                <section>
                  <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                    <div className="flex items-center gap-3">
                      <div style={{ width: 22, height: 2, backgroundColor: 'var(--color-accent)' }} />
                      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.22em', color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                        Books
                      </span>
                    </div>
                    {!booksLoading && books.length > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-3)' }}>
                        {books.length} results
                      </span>
                    )}
                  </div>

                  {booksLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {[1,2,3,4,5,6,7,8].map(i => (
                        <div key={i} className="animate-pulse" style={{
                          border: '2px solid var(--color-rim)', borderRadius: 8,
                          backgroundColor: 'var(--color-surface)', overflow: 'hidden',
                        }}>
                          <div style={{ width: '100%', height: 220, backgroundColor: 'var(--color-cave)' }} />
                          <div style={{ padding: '10px 12px', borderTop: '2px solid var(--color-rim)' }}>
                            <div style={{ height: 13, width: '80%', borderRadius: 3, backgroundColor: 'var(--color-cave)', marginBottom: 6 }} />
                            <div style={{ height: 11, width: '55%', borderRadius: 3, backgroundColor: 'var(--color-cave)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : books.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {books.map((book, i) => (
                          <button
                            key={book.google_books_id || book.id || i}
                            onClick={() => { cacheSearchResults([book]); router.push(`/books/${book.google_books_id ?? book.id}`) }}
                            className="flex flex-col text-left"
                            style={{
                              border: '2px solid var(--color-ink)',
                              borderRadius: 8,
                              boxShadow: '4px 4px 0px var(--color-ink)',
                              backgroundColor: 'var(--color-canvas)',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              transition: 'box-shadow 0.1s, border-color 0.1s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.boxShadow = '5px 5px 0px var(--color-accent)'
                              e.currentTarget.style.borderColor = 'var(--color-accent)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.boxShadow = '4px 4px 0px var(--color-ink)'
                              e.currentTarget.style.borderColor = 'var(--color-ink)'
                            }}
                          >
                            {/* Cover — fills container height, natural width */}
                            <div style={{
                              position: 'relative', width: '100%', height: 220,
                              backgroundColor: 'var(--color-cave)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              overflow: 'hidden',
                            }}>
                              {book.cover_image_url ? (
                                <img
                                  src={book.cover_image_url}
                                  alt={book.title}
                                  style={{ height: '100%', width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
                                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                                />
                              ) : null}
                              {/* Rank badge */}
                              <span style={{
                                position: 'absolute', top: 8, left: 8,
                                fontSize: 10, fontWeight: 900, letterSpacing: '0.1em',
                                color: 'var(--color-canvas)', backgroundColor: 'var(--color-ink)',
                                border: '1.5px solid var(--color-canvas)',
                                borderRadius: 4, padding: '3px 6px', lineHeight: 1.3,
                              }}>
                                {String(i + 1).padStart(2, '0')}
                              </span>
                            </div>
                            {/* Info */}
                            <div style={{ padding: '10px 12px', flex: 1, borderTop: '2px solid var(--color-ink)' }}>
                              <p className="font-serif" style={{
                                fontSize: 13, fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1.25,
                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                              }}>
                                {book.title}
                              </p>
                              {book.author_name && (
                                <p className="truncate" style={{ fontSize: 11, color: 'var(--color-ink-3)', marginTop: 3 }}>
                                  {book.author_name}
                                </p>
                              )}
                              {book.release_date && (
                                <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.14em', color: 'var(--color-accent)', textTransform: 'uppercase', display: 'block', marginTop: 5 }}>
                                  {String(book.release_date).slice(0, 4)}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                      {hasMoreBooks && !isRateLimited && (
                        <button
                          onClick={loadMoreBooks}
                          className="w-full font-bold transition-opacity hover:opacity-70"
                          style={{ marginTop: 16, padding: '12px 0', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-accent)', borderTop: '1.5px dashed var(--color-rim)' }}
                        >
                          Load more results
                        </button>
                      )}
                    </>
                  ) : !isRateLimited ? (
                    <div style={{ padding: '48px 24px', textAlign: 'center', border: '1.5px dashed var(--color-rim)', borderRadius: 14 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink-2)', fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                        No books found for &ldquo;{searchInput}&rdquo;
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--color-ink-3)', marginTop: 4 }}>
                        Try checking the spelling or searching by author name.
                      </p>
                    </div>
                  ) : null}
                </section>
              )}

              {/* People */}
              {activeTab === 'people' && (
                <section>
                  <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                    <div className="flex items-center gap-3">
                      <div style={{ width: 22, height: 2, backgroundColor: 'var(--color-accent)' }} />
                      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.22em', color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                        Readers
                      </span>
                    </div>
                    {!usersLoading && filteredUsers.length > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-3)' }}>
                        {filteredUsers.length} results
                      </span>
                    )}
                  </div>

                  {usersLoading ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="flex items-center animate-pulse" style={{
                          gap: 12, padding: '14px 16px',
                          border: '2px solid var(--color-rim)', borderRadius: 14,
                          backgroundColor: 'var(--color-surface)',
                        }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--color-cave)', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ height: 13, width: '70%', borderRadius: 4, backgroundColor: 'var(--color-cave)', marginBottom: 6 }} />
                            <div style={{ height: 11, width: '50%', borderRadius: 4, backgroundColor: 'var(--color-cave)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredUsers.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        {filteredUsers.map((user) => (
                          <Link
                            key={user.id}
                            href={`/users/${user.id}`}
                            className="flex items-center"
                            style={{
                              gap: 12, padding: '14px 16px',
                              border: '2px solid var(--color-ink)',
                              borderRadius: 14,
                              boxShadow: '3px 3px 0px var(--color-ink)',
                              backgroundColor: 'var(--color-canvas)',
                              transition: 'box-shadow 0.1s, border-color 0.1s',
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0px var(--color-accent)'
                              ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--color-accent)'
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.boxShadow = '3px 3px 0px var(--color-ink)'
                              ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--color-ink)'
                            }}
                          >
                            <Avatar src={user.avatar_url} name={user.display_name || user.username} size="md" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p className="truncate" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>
                                {user.display_name || user.username}
                              </p>
                              <p className="truncate" style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>@{user.username}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                      {hasMoreUsers && (
                        <button
                          onClick={loadMoreUsers}
                          className="w-full font-bold transition-opacity hover:opacity-70"
                          style={{ marginTop: 16, padding: '12px 0', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-accent)', borderTop: '1.5px dashed var(--color-rim)' }}
                        >
                          Load more results
                        </button>
                      )}
                    </>
                  ) : (
                    <div style={{ padding: '48px 24px', textAlign: 'center', border: '1.5px dashed var(--color-rim)', borderRadius: 14 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink-2)', fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                        No readers found for &ldquo;{searchInput}&rdquo;
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--color-ink-3)', marginTop: 4 }}>
                        Try searching by username or display name.
                      </p>
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      <BarcodeScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-canvas)' }}>
        <div className="container-mobile py-8 animate-pulse" style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ height: 52, borderRadius: 999, backgroundColor: 'var(--color-cave)', marginBottom: 12 }} />
          <div style={{ height: 44, borderRadius: 999, backgroundColor: 'var(--color-cave)', marginBottom: 36 }} />
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
