import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_BOOKS_BASE = 'https://www.googleapis.com/books/v1'
const OPEN_LIBRARY_BASE = 'https://openlibrary.org'
const RAILS_API         = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

type Work = { key: string; title: string; year: number | null; cover_url: string | null; author_name?: string; ratings_average: number | null; readinglog_count: number }

/** Write fetched author works to book_catalog so show_by_google can resolve them. */
function writeToCatalog(works: Work[], author: string): void {
  const books = works
    .filter(w => w.key && w.title && w.cover_url)
    .map(w => ({
      google_books_id: w.key,
      title:           w.title,
      author_name:     author,
      cover_image_url: w.cover_url,
      published_date:  w.year ? String(w.year) : null,
    }))

  if (books.length === 0) return

  fetch(`${RAILS_API}/books/catalog_bulk_upsert`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ books, source: 'google_books' }),
  }).catch(err => console.warn('[author-works catalog write]', err))
}

// ── Primary: Google Books ─────────────────────────────────────────────────────

async function fetchFromGoogleBooks(author: string, excludeTitle: string) {
  const query = `inauthor:"${author}"`
  const url   = `${GOOGLE_BOOKS_BASE}/volumes?q=${encodeURIComponent(query)}&maxResults=40&orderBy=relevance&printType=books&fields=${encodeURIComponent('items/id,items/volumeInfo/title,items/volumeInfo/publishedDate,items/volumeInfo/imageLinks,items/volumeInfo/averageRating,items/volumeInfo/ratingsCount')}`

  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Google Books responded with ${res.status}`)

  const data       = await res.json()
  const items: any[] = data.items || []

  return items
    .filter(item => item.volumeInfo?.title?.toLowerCase() !== excludeTitle)
    .filter(item => item.volumeInfo?.imageLinks?.thumbnail)   // require cover
    .slice(0, 20)
    .map(item => ({
      key:             item.id,                                // Google Books volume ID
      title:           item.volumeInfo.title,
      year:            item.volumeInfo.publishedDate
                         ? parseInt(item.volumeInfo.publishedDate, 10) || null
                         : null,
      cover_url:       item.volumeInfo.imageLinks?.thumbnail ?? null,
      ratings_average: item.volumeInfo.averageRating
                         ? Math.round(item.volumeInfo.averageRating * 10) / 10
                         : null,
      readinglog_count: 0,
    }))
}

// ── Fallback: Open Library ────────────────────────────────────────────────────
// Kicks in only when Google Books is unreachable.

async function fetchFromOpenLibrary(author: string, excludeTitle: string) {
  const fields = 'title,first_publish_year,cover_i,ratings_average,ratings_count,readinglog_count,key'
  const url    = `${OPEN_LIBRARY_BASE}/search.json?author=${encodeURIComponent(author)}&fields=${encodeURIComponent(fields)}&limit=40`

  const res = await fetch(url, { headers: { 'Accept': 'application/json' }, next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Open Library responded with ${res.status}`)

  const data: any[]  = (await res.json()).docs || []

  return data
    .filter(doc => doc.title?.toLowerCase() !== excludeTitle)
    .filter(doc => doc.cover_i)
    .sort((a, b) => ((b.readinglog_count || 0) + (b.ratings_count || 0)) - ((a.readinglog_count || 0) + (a.ratings_count || 0)))
    .slice(0, 20)
    .map(doc => ({
      // Normalize OL work key "/works/OL12345W" → "ol_12345W" for clean URLs.
      key:              `ol_${(doc.key as string).replace('/works/OL', '')}`,
      title:            doc.title,
      year:             doc.first_publish_year || null,
      cover_url:        `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`,
      ratings_average:  doc.ratings_average ? Math.round(doc.ratings_average * 10) / 10 : null,
      readinglog_count: doc.readinglog_count || 0,
    }))
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const author       = searchParams.get('author')?.trim()
  const excludeTitle = searchParams.get('exclude')?.trim().toLowerCase() || ''

  if (!author) return NextResponse.json({ works: [] })

  try {
    const works = await fetchFromGoogleBooks(author, excludeTitle)
    writeToCatalog(works, author)
    return NextResponse.json({ works, _source: 'google_books' })
  } catch (err) {
    console.warn('[author-works] Google Books failed, falling back to Open Library:', err)
  }

  try {
    const works = await fetchFromOpenLibrary(author, excludeTitle)
    writeToCatalog(works, author)
    return NextResponse.json({ works, _source: 'open_library' })
  } catch (err) {
    console.error('[author-works] Both sources failed:', err)
    return NextResponse.json({ works: [] }, { status: 502 })
  }
}
