import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_PAGES = [
  '/dashboard',
  '/library',
  '/feed',
  '/reading-buddy',
  '/recommendations',
  '/search',
  '/onboarding',
  '/users',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Gate authenticated page routes using the session cookie set by AuthInitializer.
  // This is a soft UX guard — the real security boundary is the Rails API validating
  // the JWT on every data request.
  const isProtectedPage = PROTECTED_PAGES.some(
    p => pathname === p || pathname.startsWith(`${p}/`)
  )
  if (isProtectedPage) {
    const session = request.cookies.get('session')
    if (!session?.value) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Guard the book proxy routes — require a Bearer token to prevent
  // quota abuse by anonymous callers.
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
  matcher: [
    '/api/books/:path*',
    '/dashboard/:path*',
    '/library/:path*',
    '/feed/:path*',
    '/reading-buddy/:path*',
    '/recommendations/:path*',
    '/search/:path*',
    '/onboarding/:path*',
    '/users/:path*',
  ],
}
