'use client'

// Navigation Component - Mobile-friendly top navigation
// Responsive design with mobile menu

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@book-app/shared'
import Avatar from './Avatar'
import { 
  LayoutDashboard, 
  BookOpen, 
  Search, 
  User, 
  Menu, 
  X,
  MessageSquare,
  Settings
} from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: '/feed', label: 'Feed', icon: LayoutDashboard },
    { href: '/library', label: 'Library', icon: BookOpen },
    { href: '/forums', label: 'Forums', icon: MessageSquare },
    { href: '/search', label: 'Discover', icon: Search },
    ...(isAuthenticated ? [{ href: `/users/${user?.id}`, label: 'Profile', icon: User }] : []),
  ]

  const isActive = (href: string) => pathname === href

  return (
    <nav className="sticky top-0 z-50 bg-background-app/80 backdrop-blur-md border-b border-border-default/50">
      <div className="container-mobile">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center h-full transition-opacity hover:opacity-80">
            <div className="relative h-28 w-[200px]">
              <Image
                src="/logo.png"
                alt="WellRead"
                fill
                className="object-contain object-left"
                style={{ filter: 'brightness(0)' }}
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1" style={{ marginRight: '200px' }}>
            {navLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 ${
                    active
                      ? 'text-white'
                      : 'text-text-secondary hover:bg-background-muted hover:text-text-primary'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-brand-indigo rounded-xl shadow-sm"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon size={18} />
                    <span>{link.label}</span>
                  </span>
                </Link>
              )
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {!isAuthenticated ? (
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-indigo rounded-xl hover:bg-brand-indigo-dark transition-all shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/settings"
                  className="p-2 rounded-xl text-text-secondary hover:bg-background-muted transition-colors hidden sm:block"
                  aria-label="Settings"
                >
                  <Settings size={20} />
                </Link>
                <Link 
                  href={`/users/${user?.id}`}
                  className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-background-muted transition-colors border border-transparent hover:border-border-default"
                >
                  <Avatar 
                    src={user?.avatar_url} 
                    name={user?.display_name || user?.username} 
                    size="sm" 
                  />
                  <span className="hidden lg:block text-sm font-medium text-text-primary">
                    {user?.display_name || user?.username}
                  </span>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-text-secondary hover:bg-background-muted transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border-default/50 animate-in fade-in slide-in-from-top-5 duration-200">
            {isAuthenticated && user && (
              <div className="flex items-center gap-3 px-4 py-4 mb-2 border-b border-border-default/30">
                <Avatar 
                  src={user.avatar_url} 
                  name={user.display_name || user.username} 
                  size="md" 
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate">
                    {user.display_name || user.username}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    @{user.username}
                  </p>
                </div>
                <Link 
                  href="/settings" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-text-secondary hover:text-text-primary"
                >
                  <Settings size={20} />
                </Link>
              </div>
            )}
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive(link.href)
                        ? 'bg-brand-indigo/10 text-brand-indigo'
                        : 'text-text-secondary hover:bg-background-muted'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
              
              {!isAuthenticated && (
                <div className="pt-4 mt-2 border-t border-border-default/50 flex flex-col space-y-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex justify-center px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:bg-background-muted"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex justify-center px-4 py-3 rounded-xl text-sm font-medium text-white bg-brand-indigo hover:bg-brand-indigo-dark shadow-sm"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

