'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth, useFeed } from '@book-app/shared'
import Avatar from './Avatar'
import {
  Home,
  BookOpen,
  Search,
  User,
  Menu,
  X,
  Settings,
  Rss,
} from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { unreadCount, fetchUnreadCount } = useFeed()

  // Poll unread count every 60s when authenticated
  useEffect(() => {
    if (!isAuthenticated) return
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 60_000)
    return () => clearInterval(interval)
  }, [isAuthenticated, fetchUnreadCount])

  const navLinks = isAuthenticated ? [
    { href: '/dashboard',         label: 'Home',     icon: Home     },
    { href: '/library',           label: 'Library',  icon: BookOpen },
    { href: '/search',            label: 'Discover', icon: Search   },
    { href: '/feed',              label: 'Activity', icon: Rss, badge: unreadCount > 0 ? Math.min(unreadCount, 99) : null },
    { href: `/users/${user?.id}`, label: 'Profile',  icon: User     },
  ] : [
    { href: '/search', label: 'Discover', icon: Search },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const close = () => setMobileMenuOpen(false)

  return (
    <>
      <nav
        className="sticky top-0 z-50 backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(12, 23, 14, 0.85)',
          borderBottom: '1px solid rgba(237, 224, 196, 0.07)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.5)',
        }}
      >
        <div className="container-mobile">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0 transition-opacity hover:opacity-75">
              <div className="relative h-10 w-36">
                <Image
                  src="/logo.png"
                  alt="Libraio"
                  fill
                  className="object-contain object-left"
                  style={{ filter: 'brightness(0) invert(1) sepia(1) saturate(2) hue-rotate(5deg)' }}
                  priority
                />
              </div>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
              {navLinks.map((link) => {
                const Icon = link.icon
                const active = isActive(link.href)
                const badge = 'badge' in link ? link.badge : null
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-150 ${
                      active ? 'text-accent-on' : 'text-lit hover:text-lit hover:bg-grove'
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-xl"
                        style={{ backgroundColor: 'var(--color-accent)' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <span className="relative">
                        <Icon size={16} />
                        {badge != null && (
                          <span
                            className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[9px] font-bold px-0.5"
                            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
                          >
                            {badge}
                          </span>
                        )}
                      </span>
                      <span>{link.label}</span>
                    </span>
                  </Link>
                )
              })}
            </div>

            {/* Right section */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isAuthenticated ? (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-semibold text-lit hover:text-lit transition-colors rounded-xl hover:bg-grove"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 text-sm font-semibold rounded-xl transition-all"
                    style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Link
                    href="/settings"
                    className="p-2 rounded-xl text-lit-2 hover:text-lit hover:bg-grove transition-colors hidden sm:flex"
                    aria-label="Settings"
                  >
                    <Settings size={18} />
                  </Link>
                  <div className="hidden sm:block w-px h-6 mx-1" style={{ backgroundColor: 'var(--color-rim)' }} />
                  <Link
                    href={`/users/${user?.id}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-grove transition-colors"
                  >
                    <Avatar
                      src={user?.avatar_url}
                      name={user?.display_name || user?.username}
                      size="sm"
                    />
                    <span className="hidden lg:block text-sm font-semibold text-lit">
                      {user?.display_name || user?.username}
                    </span>
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-xl text-lit hover:bg-grove transition-colors"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer — rendered outside nav so it's truly full-screen ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] md:hidden"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
              onClick={close}
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-72 z-[70] md:hidden flex flex-col"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderLeft: '1px solid var(--color-rim)',
                boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
              }}
            >
              {/* Drawer header */}
              <div
                className="flex items-center justify-between px-4 h-16 flex-shrink-0"
                style={{ borderBottom: '1px solid var(--color-rim)' }}
              >
                <span className="text-sm font-semibold" style={{ color: 'var(--color-lit-2)' }}>Menu</span>
                <button
                  onClick={close}
                  className="p-2 rounded-xl transition-colors"
                  style={{ color: 'var(--color-lit)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-grove)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User info strip */}
              {isAuthenticated && user && (
                <div
                  className="flex items-center gap-3 mx-3 mt-4 mb-2 px-3 py-3 rounded-2xl flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}
                >
                  <Avatar src={user.avatar_url} name={user.display_name || user.username} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--color-lit)' }}>
                      {user.display_name || user.username}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--color-lit-2)' }}>
                      @{user.username}
                    </p>
                  </div>
                </div>
              )}

              {/* Nav links */}
              <div className="flex flex-col gap-0.5 px-3 py-3 flex-1">
                {navLinks.map((link) => {
                  const Icon = link.icon
                  const active = isActive(link.href)
                  const badge = 'badge' in link ? link.badge : null
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={close}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                      style={
                        active
                          ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }
                          : { color: 'var(--color-lit)' }
                      }
                      onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'var(--color-grove)' }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <span className="relative flex-shrink-0">
                        <Icon size={18} />
                        {badge != null && (
                          <span
                            className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[9px] font-bold px-0.5"
                            style={{ backgroundColor: active ? 'white' : 'var(--color-accent)', color: active ? 'var(--color-accent)' : 'var(--color-accent-on)' }}
                          >
                            {badge}
                          </span>
                        )}
                      </span>
                      <span className="flex-1">{link.label}</span>
                    </Link>
                  )
                })}
              </div>

              {/* Bottom actions */}
              <div
                className="flex flex-col gap-2 px-3 py-4 flex-shrink-0"
                style={{ borderTop: '1px solid var(--color-rim)' }}
              >
                {isAuthenticated ? (
                  <Link
                    href="/settings"
                    onClick={close}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{ color: 'var(--color-lit-2)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-grove)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Settings size={18} />
                    <span>Settings</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={close}
                      className="flex justify-center px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
                      style={{ color: 'var(--color-lit-2)' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-grove)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      onClick={close}
                      className="flex justify-center px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                      style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
