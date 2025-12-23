'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Book as BookIcon, CheckCircle, XCircle, Lock } from 'lucide-react'
import { useAuth, usePrivateLibrary, useUserLibrary } from '@book-app/shared'
import Button from '@/components/Button'
import Shelf from '@/components/Shelf'
import ReadingHero from '@/components/ReadingHero'
import LibraryStats from '@/components/LibraryStats'

/**
 * Modernized Books Library Page
 * 
 * Features:
 * - Stats overview dashboard
 * - Featured "Currently Reading" hero section
 * - Horizontal scrolling "Shelves" for other sections
 * - Sticky navigation for quick shelf access
 * - Improved empty and loading states
 */
export default function BooksLibraryPage() {
  const { user, isAuthenticated } = useAuth()
  const {
    groupedLibrary,
    loading: libraryLoading,
    error: libraryError,
  } = useUserLibrary(user?.id)

  const { privateBooks, loading: privateLoading, error: privateError } =
    usePrivateLibrary()

  const [activeTab, setActiveTab] = useState('reading')

  // Grouped books from library
  const readingBooks = groupedLibrary?.reading || []
  const toReadBooks = groupedLibrary?.to_read || []
  const readBooks = groupedLibrary?.read || []
  const dnfBooks = groupedLibrary?.dnf || []

  const totalPublicBooks =
    (readingBooks?.length || 0) + 
    (toReadBooks?.length || 0) + 
    (readBooks?.length || 0) + 
    (dnfBooks?.length || 0)

  const stats = {
    reading: readingBooks.length,
    toRead: toReadBooks.length,
    read: readBooks.length,
    dnf: dnfBooks.length,
    private: privateBooks.length
  }

  // Handle sticky nav scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['reading', 'to-read', 'read', 'dnf', 'private']
      const offset = 160 // Updated offset for h-20 navbar
      
      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          // If the top of the section is near the bottom of our sticky header
          if (rect.top <= offset && rect.bottom > offset) {
            setActiveTab(section)
            break
          }
        }
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!isAuthenticated) {
    return (
      <div className="container-mobile py-24">
        <div className="text-center max-w-md mx-auto">
          <div className="flex justify-center mb-6">
            <div className="bg-primary-50 p-6 rounded-full animate-bounce">
              <BookIcon className="w-16 h-16 text-primary-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Your Library Awaits</h1>
          <p className="text-slate-600 mb-8 text-lg">
            Sign in to see your personal book collection and track your reading progress.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button variant="primary" size="lg" className="px-8">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" size="lg" className="px-8">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Sticky Sub-navigation - Stays below main navbar (top-20) */}
      <div className="sticky top-20 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="container-mobile max-w-6xl">
          <div className="flex items-center overflow-x-auto scrollbar-hide py-1">
            {[
              { id: 'reading', label: 'Reading', icon: BookOpen },
              { id: 'to-read', label: 'To Read', icon: BookIcon },
              { id: 'read', label: 'Read', icon: CheckCircle },
              { id: 'dnf', label: 'DNF', icon: XCircle },
              { id: 'private', label: 'Private', icon: Lock },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  const element = document.getElementById(tab.id)
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}
                className={`flex-none px-4 py-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-mobile py-8 sm:py-12 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">My Library</h1>
            <p className="text-slate-600 text-lg">
              {totalPublicBooks === 0
                ? 'Start building your reading collection today'
                : `You have ${totalPublicBooks} books in your public collection.`}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/recommendations">
              <Button variant="outline" size="md" className="bg-white">
                Recommendations
              </Button>
            </Link>
            <Link href="/books/search">
              <Button variant="primary" size="md" className="shadow-md">
                + Add Books
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Dashboard */}
        <LibraryStats stats={stats} />

        {/* Error Message */}
        {libraryError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-8 flex items-center gap-3 text-red-800">
            <span className="text-xl">⚠️</span>
            <p className="text-sm font-medium">{libraryError}</p>
          </div>
        )}

        {/* Loading State */}
        {libraryLoading && totalPublicBooks === 0 && (
          <div className="text-center py-24">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent mb-4"></div>
            <p className="text-slate-600 font-medium">Arranging your bookshelves...</p>
          </div>
        )}

        {/* Empty State */}
        {!libraryLoading && totalPublicBooks === 0 && privateBooks.length === 0 && (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm mb-12">
            <div className="flex justify-center mb-6">
              <div className="bg-slate-50 p-6 rounded-full">
                <BookIcon className="w-16 h-16 text-slate-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Your library is empty</h2>
            <p className="text-slate-600 mb-8 max-w-sm mx-auto">
              Start adding books to track your reading journey, set goals, and organize your collection.
            </p>
            <Link href="/books/search">
              <Button variant="primary" size="lg" className="px-10 shadow-lg">
                Search for Books
              </Button>
            </Link>
          </div>
        )}

        {/* Currently Reading - Hero Section */}
        <ReadingHero books={readingBooks} />

        {/* To Read Shelf */}
        <Shelf 
          shelfId="to-read"
          title="To Read" 
          icon={<BookIcon className="w-6 h-6 text-amber-600" />} 
          books={toReadBooks} 
          subtitle="Your future adventures"
        />

        {/* Read Shelf */}
        <Shelf 
          shelfId="read"
          title="Completed" 
          icon={<CheckCircle className="w-6 h-6 text-green-600" />} 
          books={readBooks} 
          subtitle="Books you've finished"
        />

        {/* DNF Shelf */}
        <Shelf 
          shelfId="dnf"
          title="Did Not Finish" 
          icon={<XCircle className="w-6 h-6 text-rose-600" />} 
          books={dnfBooks} 
          subtitle="On hold or stopped"
        />

        {/* Private Section */}
        <section id="private" className="mt-12 pt-12 border-t border-slate-200 scroll-mt-40">
          <Shelf 
            shelfId="private-books"
            title="Private Collection" 
            icon={<Lock className="w-6 h-6 text-slate-600" />} 
            books={privateBooks} 
            subtitle="Only visible to you"
          />
          
          {privateBooks.length === 0 && !privateLoading && (
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-10 text-center text-slate-500">
              <div className="flex justify-center mb-3">
                <Lock className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-medium">No private books yet</p>
              <p className="text-sm text-slate-400 mt-1">Books you mark as private will appear here.</p>
            </div>
          )}
          
          {privateError && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-4 text-sm text-amber-800">
              {privateError}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
