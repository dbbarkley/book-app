import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_BOOKS_BASE = 'https://www.googleapis.com/books/v1'
const OPEN_LIBRARY_BASE = 'https://openlibrary.org'

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
    .sort((a, b) => ((b.readinglog_count || 0) + (b.ratings_count || 0)) - ((a.readinglog_count || 0) + (a.ratings_count || 0)))
    .slice(0, 20)
    .map(doc => ({
      key:              doc.key,
      title:            doc.title,
      year:             doc.first_publish_year || null,
      cover_url:        doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
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
    return NextResponse.json({ works, _source: 'google_books' })
  } catch (err) {
    console.warn('[author-works] Google Books failed, falling back to Open Library:', err)
  }

  try {
    const works = await fetchFromOpenLibrary(author, excludeTitle)
    return NextResponse.json({ works, _source: 'open_library' })
  } catch (err) {
    console.error('[author-works] Both sources failed:', err)
    return NextResponse.json({ works: [] }, { status: 502 })
  }
}
