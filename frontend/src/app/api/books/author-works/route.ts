import { NextRequest, NextResponse } from 'next/server'

const RAILS_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const author  = searchParams.get('author')?.trim()
  const exclude = searchParams.get('exclude')?.trim()

  if (!author) return NextResponse.json({ works: [] })

  try {
    const params = new URLSearchParams({ author })
    if (exclude) params.set('exclude', exclude)

    const res = await fetch(`${RAILS_API}/books/author_works?${params}`, {
      next: { revalidate: 3600 },
    })

    if (!res.ok) return NextResponse.json({ works: [] }, { status: res.status })

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[author-works proxy]', err)
    return NextResponse.json({ works: [] }, { status: 502 })
  }
}
