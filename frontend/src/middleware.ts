import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware to protect internal Next.js API proxy routes.
 *
 * /api/books/* routes proxy to Google Books, Open Library, and NYT APIs.
 * They don't need a valid JWT (the Rails backend handles that separately),
 * but they should only be callable by authenticated users to prevent
 * quota abuse and anonymous scraping.
 *
 * Strategy: require an "Authorization: Bearer <token>" header — the same
 * token the client already holds for Rails API calls. We don't re-validate
 * the JWT here (that's the Rails backend's job); we just verify that a
 * token is present, which is a strong signal the caller is a logged-in user.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only guard the book proxy routes
  if (pathname.startsWith('/api/books/')) {
    const authorization = request.headers.get('Authorization')
    const hasToken =
      authorization?.startsWith('Bearer ') && authorization.length > 10

    if (!hasToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/books/:path*'],
}
