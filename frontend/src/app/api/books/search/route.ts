import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_BOOKS_BASE = 'https://www.googleapis.com/books/v1'
const OPEN_LIBRARY_BASE = 'https://openlibrary.org'
const MAX_RETRIES       = 3
const RETRY_DELAY_MS    = 400

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  const res = await fetch(url, { next: { revalidate: 60 } })
  if ((res.status === 503 || res.status === 429) && retries > 0) {
    await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (MAX_RETRIES - retries + 1)))
    return fetchWithRetry(url, retries - 1)
  }
  return res
}

const RAILS_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

/** Query the local book_catalog via Rails. Returns items in volumeInfo envelope shape. */
async function searchCatalog(q: string, limit: number): Promise<any[]> {
  try {
    const url = `${RAILS_API}/books/catalog_search?q=${encodeURIComponent(q)}&limit=${limit}`
    const res = await fetch(url, { next: { revalidate: 30 } })
    if (!res.ok) return []
    const data = await res.json()
    const books: any[] = data.books || []
    // Wrap catalog records back into the volumeInfo envelope so transformBook() in
    // googleBooksService.ts handles them identically to live Google Books results.
    return books.map((b: any) => ({
      id: b.google_books_id,
      volumeInfo: {
        title:       b.title,
        authors:     b.author_name ? [b.author_name] : [],
        publishedDate: b.release_date,
        pageCount:   b.page_count,
        description: b.description,
        imageLinks:  b.cover_image_url
          ? { thumbnail: b.cover_image_url, smallThumbnail: b.cover_image_url }
          : undefined,
        industryIdentifiers: b.isbn
          ? [{ type: 'ISBN_13', identifier: b.isbn }]
          : [],
        categories:       b.categories || [],
        averageRating:    b.average_rating,
        ratingsCount:     b.ratings_count,
      },
      _source: 'catalog',
    }))
  } catch {
    return []
  }
}

/** Write Google Books items to the catalog (fire-and-forget — never awaited). */
function writeToCatalog(items: any[]): void {
  const books = items
    .filter((item: any) => item.id && item.volumeInfo?.title)
    .map((item: any) => {
      const v = item.volumeInfo || {}
      const isbn =
        v.industryIdentifiers?.find((x: any) => x.type === 'ISBN_13')?.identifier ||
        v.industryIdentifiers?.find((x: any) => x.type === 'ISBN_10')?.identifier ||
        null
      return {
        google_books_id: item.id,
        isbn,
        title:           v.title,
        author_name:     (v.authors || [])[0] || null,
        cover_image_url: v.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
        description:     v.description || null,
        published_date:  v.publishedDate || null,
        page_count:      v.pageCount || null,
        average_rating:  v.averageRating || null,
        ratings_count:   v.ratingsCount || 0,
        categories:      v.categories || [],
      }
    })

  if (books.length === 0) return

  fetch(`${RAILS_API}/books/catalog_bulk_upsert`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ books, source: 'google_books' }),
  }).catch((err) => console.warn('[catalog write-through]', err))
}

function stripHtml(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .trim() || undefined
}

function normalizeForDedup(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Deduplicate by (title, primary author) — keeps the "richest" edition.
 * Score: cover (4pts) + description (2pts) + pageCount (1pt)
 */
function deduplicateItems(items: any[]): any[] {
  const best = new Map<string, { item: any; score: number }>()
  for (const item of items) {
    const v     = item.volumeInfo || {}
    const key   = `${normalizeForDedup(v.title || '')}::${normalizeForDedup((v.authors || [])[0] || '')}`
    const score = (v.imageLinks?.thumbnail ? 4 : 0) + (v.description ? 2 : 0) + (v.pageCount ? 1 : 0)
    const existing = best.get(key)
    if (!existing || score > existing.score) best.set(key, { item, score })
  }
  return Array.from(best.values()).map(e => e.item)
}

/**
 * Drop results with no cover image — a reliable signal that a book is too
 * obscure, out-of-print, or incomplete to be useful in search results.
 */
function filterQuality(items: any[]): any[] {
  return items.filter(item => item.volumeInfo?.imageLinks?.thumbnail)
}

// ─── Open Library fallback ────────────────────────────────────────────────────

const OL_FIELDS = 'key,title,author_name,cover_i,isbn,first_publish_year,number_of_pages_median'

/**
 * Transform an Open Library doc into the Google Books volumeInfo shape so the
 * rest of the app works identically regardless of which source was used.
 */
function olDocToItem(doc: any, idx: number) {
  return {
    id: `ol_${doc.key?.replace('/works/', '') || idx}`,
    volumeInfo: {
      title:       doc.title || 'Unknown Title',
      authors:     doc.author_name || [],
      publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : undefined,
      pageCount:   doc.number_of_pages_median || undefined,
      imageLinks:  doc.cover_i ? {
        thumbnail:      `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`,
        smallThumbnail: `https://covers.openlibrary.org/b/id/${doc.cover_i}-S.jpg`,
      } : undefined,
      industryIdentifiers: doc.isbn?.length
        ? [{ type: 'ISBN_13', identifier: doc.isbn.find((i: string) => i.length === 13) || doc.isbn[0] }]
        : [],
      infoLink: `https://openlibrary.org${doc.key}`,
    },
    _source: 'open_library',
  }
}

async function searchOpenLibrary(q: string, maxResults: number, type: string): Promise<any[]> {
  const param = type === 'authors' ? 'author' : 'q'
  const url   = `${OPEN_LIBRARY_BASE}/search.json?${param}=${encodeURIComponent(q)}&limit=${maxResults * 2}&fields=${OL_FIELDS}&sort=readinglog`

  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`Open Library responded with ${res.status}`)

  const data = await res.json()
  return (data.docs || [])
    .filter((doc: any) => doc.cover_i)   // require cover, same quality bar as Google
    .slice(0, maxResults)
    .map(olDocToItem)
}

// ─── ISBN fast-path ───────────────────────────────────────────────────────────

/**
 * Dedicated handler for isbn: queries (e.g. from the barcode scanner).
 *
 * Why a separate path:
 *  - ISBN searches return exactly one result — no dedup or quality filter needed
 *  - filterQuality() would silently drop valid books with no cover image, causing
 *    false "not found" results for a scan where we know the book exists
 *  - Open Library's /isbn/{isbn}.json is a direct lookup, far faster than search.json
 */
async function handleIsbnSearch(isbn: string): Promise<NextResponse> {
  const cleanIsbn = isbn.replace(/\D/g, '')

  // ── Primary: Google Books isbn: query ───────────────────────────────────
  try {
    const url = `${GOOGLE_BOOKS_BASE}/volumes?q=${encodeURIComponent(`isbn:${cleanIsbn}`)}&maxResults=1&printType=books&fields=${encodeURIComponent('items/id,items/volumeInfo')}`
    const res = await fetchWithRetry(url)

    if (res.ok) {
      const data = await res.json()
      const items: any[] = (data.items || []).map((item: any) => {
        const v = item.volumeInfo
        return v ? { ...item, volumeInfo: { ...v, description: stripHtml(v.description) } } : item
      })
      if (items.length > 0) {
        return NextResponse.json({ items, _source: 'google_books' })
      }
    }
    console.warn(`[isbn] Google Books ${res.status} for ISBN ${cleanIsbn} — trying Open Library`)
  } catch (err) {
    console.warn('[isbn] Google Books unreachable:', err)
  }

  // ── Fallback: Open Library /isbn/{isbn}.json ─────────────────────────────
  // Direct ISBN record lookup — much more reliable than the search API for exact ISBNs.
  try {
    const olRes = await fetch(`${OPEN_LIBRARY_BASE}/isbn/${cleanIsbn}.json`, { next: { revalidate: 3600 } })
    if (olRes.ok) {
      const olData = await olRes.json()
      // OL ISBN endpoint returns a single edition record
      const workKey   = (olData.works?.[0]?.key as string | undefined) || olData.key
      const title     = olData.title as string | undefined
      const coverId   = olData.covers?.[0] as number | undefined
      const authorKey = olData.authors?.[0]?.key as string | undefined

      // Fetch author name if we have a key
      let authorName = ''
      if (authorKey) {
        try {
          const authorRes = await fetch(`${OPEN_LIBRARY_BASE}${authorKey}.json`, { next: { revalidate: 3600 } })
          if (authorRes.ok) {
            const a = await authorRes.json()
            authorName = a.name || ''
          }
        } catch { /* author fetch is best-effort */ }
      }

      if (title) {
        const item = {
          id: `ol_${workKey?.replace('/works/', '') || cleanIsbn}`,
          volumeInfo: {
            title,
            authors:      authorName ? [authorName] : [],
            publishedDate: olData.publish_date,
            pageCount:    olData.number_of_pages || undefined,
            imageLinks:   coverId ? {
              thumbnail:      `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`,
              smallThumbnail: `https://covers.openlibrary.org/b/id/${coverId}-S.jpg`,
            } : undefined,
            industryIdentifiers: [{ type: 'ISBN_13', identifier: cleanIsbn }],
          },
          _source: 'open_library',
        }
        return NextResponse.json({ items: [item], _source: 'open_library' })
      }
    }
    console.warn(`[isbn] Open Library also missed ISBN ${cleanIsbn}`)
  } catch (err) {
    console.warn('[isbn] Open Library failed:', err)
  }

  return NextResponse.json({ items: [] })
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q          = searchParams.get('q')?.trim()
  const maxResults = Math.min(parseInt(searchParams.get('maxResults') || '20', 10), 40)
  const type       = searchParams.get('type') || 'books'

  if (!q) return NextResponse.json({ items: [] })

  // ── ISBN fast-path — skip dedup/quality filters, use direct OL fallback ──
  const isbnMatch = q.match(/^isbn:(\d[\d\-]+\d)$/i)
  if (isbnMatch) return handleIsbnSearch(isbnMatch[1])

  // ── Catalog-first (books only) ────────────────────────────────────────────
  // Check our local Postgres catalog before hitting Google Books.
  // If we have enough results, return them immediately — zero API quota used.
  let catalogItems: any[] = []
  if (type === 'books') {
    catalogItems = await searchCatalog(q, maxResults)
    if (catalogItems.length >= maxResults) {
      return NextResponse.json({ items: catalogItems, _source: 'catalog' })
    }
  }

  // ── Primary: Google Books ─────────────────────────────────────────────────
  // Best-in-class for specific title/author/ISBN searches. Handles typos,
  // partial titles, and has the largest index of any free book API.
  try {
    const searchQuery = type === 'authors' ? `inauthor:"${q}"` : q
    const fetchCount  = type === 'books' ? Math.min(maxResults * 2, 40) : maxResults
    const url = `${GOOGLE_BOOKS_BASE}/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=${fetchCount}&orderBy=relevance&printType=books&fields=${encodeURIComponent('items/id,items/volumeInfo')}`

    const res = await fetchWithRetry(url)

    if (res.ok) {
      const data = await res.json()
      let items: any[] = data.items || []

      if (type === 'books') {
        items = filterQuality(items)
        items = deduplicateItems(items).slice(0, maxResults)
        items = items.map(item => {
          const v = item.volumeInfo
          return v ? { ...item, volumeInfo: { ...v, description: stripHtml(v.description) } } : item
        })

        // Write-through cache — fire-and-forget, never blocks response.
        writeToCatalog(items)

        // Merge: catalog results first (already retrieved above), then all Google Books
        // results. deduplicateItems handles cross-source title+author matching.
        if (catalogItems.length > 0) {
          const combined = deduplicateItems([...catalogItems, ...items]).slice(0, maxResults)
          return NextResponse.json({ items: combined, _source: 'merged' })
        }
      }

      return NextResponse.json({ ...data, items, _source: 'google_books' })
    }

    console.warn(`[search] Google Books ${res.status} for "${q}" — falling back to Open Library`)
  } catch (err) {
    console.warn('[search] Google Books unreachable — falling back to Open Library:', err)
  }

  // ── Fallback: Open Library ────────────────────────────────────────────────
  // Kicks in when Google rate-limits or is unreachable. Uses sort=readinglog
  // so even fallback results are ranked by real reading popularity.
  try {
    const items = await searchOpenLibrary(q, maxResults, type)
    return NextResponse.json({ items, totalItems: items.length, _source: 'open_library' })
  } catch (err) {
    console.error('[search] Both sources failed:', err)
    return NextResponse.json({ error: 'Search unavailable', items: [] }, { status: 502 })
  }
}
