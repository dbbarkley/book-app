'use client'

// Navigation Component - Mobile-friendly top navigation
// Responsive design with mobile menu

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@book-app/shared'

export default function Navigation() {
  const pathname = usePathname()
  const { isAuthenticated, user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: '/feed', label: 'Feed' },
    { href: '/books', label: 'Library' },
    { href: '/events', label: 'Events' },
    { href: '/authors', label: 'Authors' },
    { href: '/search', label: 'Search' },
    { href: '/testing', label: 'Testing' },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <nav className="sticky top-0 z-50 bg-background-app border-b border-border-default shadow-sm">
      <div className="container-mobile">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-brand-indigo">📚</span>
            <span className="hidden sm:inline-block text-xl font-semibold text-text-primary">
              Book Social
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                      ? 'bg-brand-indigo/10 text-brand-indigo'
                      : 'text-text-secondary hover:bg-background-muted hover:text-text-primary'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
            <Link
              href={`/users/${user?.id}`}
              className="text-sm text-text-secondary hover:text-text-primary"
            >
                  {user?.username || 'Profile'}
                </Link>
                <button
                  onClick={logout}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
            >
                  Login
                </Link>
                <Link
                  href="/signup"
              className="px-4 py-2 text-sm font-medium text-white bg-brand-indigo rounded-lg hover:bg-brand-indigo-dark"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-text-secondary hover:bg-background-muted"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border-default">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    isActive(link.href)
                      ? 'bg-brand-indigo/10 text-brand-indigo'
                      : 'text-text-secondary hover:bg-background-muted'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-slate-200">
                {isAuthenticated ? (
                  <>
                    <Link
                      href={`/users/${user?.id}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-text-secondary hover:bg-background-muted rounded-lg"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-background-muted rounded-lg"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm font-medium text-text-secondary hover:bg-background-muted rounded-lg"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm font-medium text-white bg-brand-indigo rounded-lg hover:bg-brand-indigo-dark mt-2"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

