'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Compass, Users, User, Settings } from 'lucide-react'
import { useAuth } from '@book-app/shared'
import Avatar from './Avatar'

// ── Bottom tab bar config ─────────────────────────────────────────────────────
const TABS = [
  { id: 'home',     label: 'Home',     Icon: Home,     href: '/dashboard'     },
  { id: 'library',  label: 'Library',  Icon: BookOpen, href: '/library'       },
  { id: 'discover', label: 'Discover', Icon: Compass,  href: '/discover'      },
  { id: 'buddies',  label: 'Buddies',  Icon: Users,    href: '/reading-buddy' },
  { id: 'you',      label: 'You',      Icon: User,     href: '/users'         },
] as const

export default function Navigation() {
  const pathname = usePathname()
  const { isAuthenticated, user, logout } = useAuth()
  const isOnboarding = pathname === '/onboarding'

  const isActive = (href: string) => {
    if (href === '/users') return pathname.startsWith(`/users/${user?.id}`)
    return pathname === href || pathname.startsWith(href + '/')
  }

  const isLanding = pathname === '/'

  const desktopLinks = isAuthenticated ? [
    { href: '/dashboard',         label: 'Home'     },
    { href: '/library',           label: 'Library'  },
    { href: '/discover',          label: 'Discover' },
    { href: '/reading-buddy',     label: 'Buddies'  },
    { href: `/users/${user?.id}`, label: 'Profile'  },
  ] : []

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50"
        style={{ backgroundColor: 'var(--color-canvas)', borderBottom: '2px solid var(--color-ink)' }}
      >
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-14">
          <div className="flex items-center justify-between" style={{ height: 82 }}>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0 hover:opacity-80 transition-opacity">
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 38, height: 38, borderRadius: 10,
                  backgroundColor: 'var(--color-accent-orange)',
                  border: '2px solid var(--color-ink)',
                  boxShadow: '3px 3px 0px var(--color-ink)',
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-playfair), Georgia, serif',
                  fontSize: 22, fontWeight: 800,
                  color: 'var(--color-accent-on)',
                  lineHeight: 1, letterSpacing: '-0.5px',
                }}>W</span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-playfair), Georgia, serif',
                  fontSize: 20, fontWeight: 700,
                  letterSpacing: '-0.44px', color: 'var(--color-ink)',
                }}
              >WellRead</span>
              <span
                style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--color-accent)',
                  border: '1.5px solid var(--color-accent)',
                  borderRadius: 4,
                  padding: '2px 5px',
                  lineHeight: 1,
                }}
              >Beta</span>
            </Link>

            {/* Desktop nav links — hidden on mobile, during onboarding, and on the landing page */}
            {!isOnboarding && !isLanding && (
              <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
                {desktopLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative text-[13px] font-bold tracking-[0.78px] uppercase transition-colors duration-150"
                    style={{ color: isActive(link.href) ? 'var(--color-accent)' : 'var(--color-ink)' }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Right section */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {isOnboarding ? (
                <div className="hidden md:flex items-center gap-4">
                  <span className="text-[12px] font-bold tracking-[0.18em] uppercase" style={{ color: 'var(--color-ink-3)' }}>
                    Setting Up
                    <span style={{ margin: '0 6px', color: 'var(--color-rim-accent)' }}>·</span>
                    {user?.username}@
                  </span>
                  <button
                    onClick={() => logout()}
                    className="text-[12px] font-black tracking-[0.18em] uppercase transition-opacity hover:opacity-70"
                    style={{ color: 'var(--color-ink)', textDecoration: 'underline', textUnderlineOffset: 3, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Log Out
                  </button>
                </div>
              ) : !isAuthenticated ? (
                <>
                  {/* Desktop auth buttons */}
                  <div className="hidden md:flex items-center gap-3">
                    <Link
                      href="/login"
                      className="text-[13px] font-bold tracking-[0.78px] uppercase transition-opacity hover:opacity-60"
                      style={{ color: 'var(--color-ink)' }}
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="text-[13px] font-extrabold tracking-[0.78px] uppercase px-[18px] py-[10px] transition-opacity hover:opacity-80"
                      style={{ borderRadius: 20, backgroundColor: 'var(--color-ink)', color: 'var(--color-canvas)' }}
                    >
                      Get Started
                    </Link>
                  </div>
                  {/* Mobile auth buttons — inline in top bar */}
                  <div className="flex md:hidden items-center gap-2">
                    <Link
                      href="/login"
                      className="text-[12px] font-bold tracking-[0.06em] uppercase px-3 py-2 transition-opacity hover:opacity-60"
                      style={{ color: 'var(--color-ink)' }}
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="text-[12px] font-extrabold tracking-[0.06em] uppercase px-4 py-2 transition-opacity hover:opacity-80"
                      style={{ borderRadius: 20, backgroundColor: 'var(--color-ink)', color: 'var(--color-canvas)' }}
                    >
                      Join
                    </Link>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/settings"
                    className="hidden md:flex p-2 transition-opacity hover:opacity-60"
                    aria-label="Settings"
                    style={{ color: 'var(--color-ink-2)' }}
                  >
                    <Settings size={18} />
                  </Link>
                  <Link href={`/users/${user?.id}`} className="flex items-center gap-2 transition-opacity hover:opacity-70">
                    <Avatar src={user?.avatar_url} name={user?.display_name || user?.username} size="sm" />
                    <span className="hidden lg:block text-[13px] font-bold tracking-[0.78px] uppercase" style={{ color: 'var(--color-ink)' }}>
                      {user?.display_name || user?.username}
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile bottom tab bar — authenticated only, hidden on md+ ────────── */}
      {isAuthenticated && !isOnboarding && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
          style={{
            backgroundColor: 'var(--color-canvas)',
            borderTop: '2px solid var(--color-ink)',
            paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          }}
        >
          <div className="flex items-stretch">
            {TABS.map((tab) => {
              const href = tab.id === 'you' ? `/users/${user?.id}` : tab.href
              const active = isActive(tab.href)
              const { Icon } = tab
              return (
                <Link
                  key={tab.id}
                  href={href}
                  className="flex flex-col items-center gap-1 flex-1 pt-2 pb-1"
                >
                  <div
                    style={{
                      width: 44, height: 28, borderRadius: 99,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: active ? 'var(--color-accent)' : 'transparent',
                      border: active ? '1.5px solid var(--color-ink)' : '1.5px solid transparent',
                      boxShadow: active ? '2px 2px 0 var(--color-ink)' : 'none',
                      transition: 'all 120ms',
                    }}
                  >
                    <Icon size={16} color={active ? '#fff' : 'var(--color-ink-2)'} />
                  </div>
                  <span
                    className="text-[9px] font-bold uppercase tracking-[0.06em]"
                    style={{ color: active ? 'var(--color-ink)' : 'var(--color-ink-3)' }}
                  >
                    {tab.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
