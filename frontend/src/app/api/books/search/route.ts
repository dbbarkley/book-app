import { NextRequest, NextResponse } from 'next/server'

const RAILS_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

/** Query the local book_catalog via Rails. Returns items in volumeInfo envelope shape. */
async function searchCatalog(q: string, limit: number): Promise<any[]> {
  try {
    const url = `${RAILS_API}/books/catalog_search?q=${encodeURIComponent(q)}&limit=${limit}`
    const res = await fetch(url, { next: { revalidate: 30 } })
    if (!res.ok) return []
    const data = await res.json()
    const books: any[] = data.books || []
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

/**
 * Proxy all external book searches through Rails so the API key stays
 * server-side and rate limits are shared across one authenticated client.
 */
async function searchExternal(q: string, limit: number, type: string): Promise<{ items: any[]; source: string }> {
  try {
    const params = new URLSearchParams({ q, limit: String(limit), type })
    const res = await fetch(`${RAILS_API}/books/external_search?${params}`, { next: { revalidate: 60 } })
    if (!res.ok) return { items: [], source: 'error' }
    const data = await res.json()
    return { items: data.items || [], source: data._source || 'external' }
  } catch {
    return { items: [], source: 'error' }
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
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_API_SECRET || '',
    },
    body:    JSON.stringify({ books, source: 'google_books' }),
  }).catch((err) => console.warn('[catalog write-through]', err))
}

// ─── ISBN fast-path ───────────────────────────────────────────────────────────

async function handleIsbnSearch(isbn: string): Promise<NextResponse> {
  try {
    const res = await fetch(`${RAILS_API}/books/isbn_search?isbn=${encodeURIComponent(isbn)}`, {
      next: { revalidate: 3600 },
    })
    if (res.ok) {
      const data = await res.json()
      if ((data.items || []).length > 0) {
        return NextResponse.json(data)
      }
    }
  } catch (err) {
    console.warn('[isbn] Rails isbn_search failed:', err)
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

  // ── ISBN fast-path — direct lookup, no dedup/quality filters needed ───────
  const isbnMatch = q.match(/^isbn:(\d[\d\-]+\d)$/i)
  if (isbnMatch) return handleIsbnSearch(isbnMatch[1])

  // ── Catalog-first (books only) ────────────────────────────────────────────
  let catalogItems: any[] = []
  if (type === 'books') {
    catalogItems = await searchCatalog(q, maxResults)
    if (catalogItems.length >= maxResults) {
      return NextResponse.json({ items: catalogItems, _source: 'catalog' })
    }
  }

  // ── External search via Rails (Google Books → Open Library fallback) ──────
  const { items: rawItems, source: extSource } = await searchExternal(q, maxResults, type)

  let items = rawItems
  if (type === 'books') {
    items = filterQuality(items)
    items = deduplicateItems(items).slice(0, maxResults)
    items = items.map(item => {
      const v = item.volumeInfo
      return v ? { ...item, volumeInfo: { ...v, description: stripHtml(v.description) } } : item
    })

    writeToCatalog(items)

    if (catalogItems.length > 0) {
      const combined = deduplicateItems([...catalogItems, ...items]).slice(0, maxResults)
      return NextResponse.json({ items: combined, _source: 'merged' })
    }
  }

  if (items.length === 0) {
    return NextResponse.json({ error: 'Search unavailable', items: [] }, { status: 502 })
  }

  return NextResponse.json({ items, _source: extSource })
}
