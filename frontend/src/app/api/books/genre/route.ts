import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_BOOKS_BASE  = 'https://www.googleapis.com/books/v1'
const NYT_BASE           = 'https://api.nytimes.com/svc/books/v3'
const OPEN_LIBRARY_BASE  = 'https://openlibrary.org'

// ── Genre routing ─────────────────────────────────────────────────────────────

/**
 * Genres that map directly to a NYT bestseller list.
 * These return current popular books — the gold standard for browsable genres.
 */
const NYT_LIST_MAP: Record<string, string> = {
  'fiction':     'combined-print-and-e-book-fiction',
  'non-fiction': 'combined-print-and-e-book-nonfiction',
  'mystery':     'mysteries-thrillers',
  'thriller':    'mysteries-thrillers',
  'self-help':   'advice-how-to-and-miscellaneous',
  'business':    'business-books',
  'young-adult': 'young-adult',
  'children':    'childrens-middle-grade',
  'graphic-novel': 'graphic-books-and-manga',
}

/**
 * Genres without a NYT list fall back to Open Library subjects.
 * Subject slugs must match OL's canonical subject names.
 */
const OL_SUBJECT_MAP: Record<string, string> = {
  'romance':    'romance',
  'sci-fi':     'science_fiction',
  'fantasy':    'fantasy',
  'horror':     'horror',
  'historical': 'historical_fiction',
  'biography':  'biography',
  'memoir':     'autobiography',
  'philosophy': 'philosophy',
  'poetry':     'poetry',
}

// ── Google Books ISBN lookup ──────────────────────────────────────────────────

/**
 * Resolve an ISBN to a Google Books volume ID.
 * Cached for 7 days — ISBNs don't change.
 */
async function resolveGoogleBooksId(isbn: string): Promise<string | null> {
  try {
    const url = `${GOOGLE_BOOKS_BASE}/volumes?q=isbn:${isbn}&maxResults=1&fields=items/id`
    const res = await fetch(url, { next: { revalidate: 604800 } })
    if (!res.ok) return null
    const data = await res.json()
    return data.items?.[0]?.id ?? null
  } catch {
    return null
  }
}

// ── NYT source ────────────────────────────────────────────────────────────────

async function fetchFromNYT(listName: string): Promise<any[]> {
  const apiKey = process.env.NEW_YORK_TIMES_API_KEY
  if (!apiKey) throw new Error('NYT API key not configured')

  const url = `${NYT_BASE}/lists/current/${listName}.json?api-key=${apiKey}`
  const res = await fetch(url, { next: { revalidate: 86400 } }) // 24h cache — list updates weekly
  if (!res.ok) throw new Error(`NYT responded with ${res.status}`)

  const data = await res.json()
  const books: any[] = data.results?.books ?? []

  // Resolve Google Books IDs in parallel from ISBNs so BookCard can navigate properly
  const resolved = await Promise.all(
    books.map(async (b) => {
      const isbn = b.primary_isbn13 || b.primary_isbn10
      const googleBooksId = isbn ? await resolveGoogleBooksId(isbn) : null
      return {
        id: null,
        title: b.title,
        author_name: b.author,
        cover_image_url: b.book_image || undefined,
        description: b.description || undefined,
        isbn: b.primary_isbn13 || b.primary_isbn10 || undefined,
        google_books_id: googleBooksId ?? undefined,
        release_date: '',
        _source: 'nyt',
        _rank: b.rank,
        _weeks_on_list: b.weeks_on_list,
      }
    })
  )

  // Only return books we successfully resolved a Google Books ID for
  // (so navigation always works). Fall back to ISBN as key if needed.
  return resolved.filter(b => b.google_books_id || b.isbn)
}

// ── Open Library source ───────────────────────────────────────────────────────

async function fetchFromOpenLibrary(subject: string): Promise<any[]> {
  const url = `${OPEN_LIBRARY_BASE}/subjects/${subject}.json?limit=24`
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 86400 },
  })
  if (!res.ok) throw new Error(`Open Library responded with ${res.status}`)

  const data = await res.json()
  const works: any[] = data.works ?? []

  return works
    .filter(w => w.cover_id)   // require cover
    .map(w => ({
      id: null,
      title: w.title,
      author_name: w.authors?.[0]?.name ?? 'Unknown Author',
      cover_image_url: `https://covers.openlibrary.org/b/id/${w.cover_id}-M.jpg`,
      description: undefined,
      isbn: undefined,
      google_books_id: `ol_${w.key?.replace('/works/', '')}`,
      release_date: w.first_publish_year ? String(w.first_publish_year) : '',
      _source: 'open_library',
    }))
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const genreId = searchParams.get('id')?.toLowerCase().trim()

  if (!genreId) {
    return NextResponse.json({ books: [], _source: null })
  }

  // ── NYT path ─────────────────────────────────────────────────────────────
  const nytList = NYT_LIST_MAP[genreId]
  if (nytList) {
    try {
      const books = await fetchFromNYT(nytList)
      return NextResponse.json({ books, _source: 'nyt' })
    } catch (err) {
      console.warn(`[genre] NYT failed for "${genreId}", falling back to OL:`, err)
      // Fall through to OL below
    }
  }

  // ── Open Library path (primary for non-NYT genres, fallback for NYT failures) ──
  const olSubject = OL_SUBJECT_MAP[genreId] ?? genreId.replace(/\s+/g, '_').toLowerCase()
  try {
    const books = await fetchFromOpenLibrary(olSubject)
    return NextResponse.json({ books, _source: 'open_library' })
  } catch (err) {
    console.error(`[genre] All sources failed for "${genreId}":`, err)
    return NextResponse.json({ books: [], _source: null }, { status: 502 })
  }
}
