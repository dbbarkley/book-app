'use client'

import React, { useMemo, useEffect } from 'react'
import { 
  useAuth, 
  useUserLibrary, 
  useFollows, 
  useEvents, 
  useVenues, 
  useRecommendedBooks, 
  useRecommendedAuthors,
  useMilestones
} from '@book-app/shared'
import { BookPlus, UserPlus, MapPin, Target } from 'lucide-react'
import DashboardHero from '@/components/dashboard/DashboardHero'
import DashboardQuests from '@/components/dashboard/DashboardQuests'
import DashboardLocalPulse from '@/components/dashboard/DashboardLocalPulse'
import DashboardRecommendations from '@/components/dashboard/DashboardRecommendations'

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth()
  
  // 1. Get Library Data
  const { 
    groupedLibrary, 
    loading: libraryLoading,
    refresh: refreshLibrary
  } = useUserLibrary(user?.id)
  
  const readingBooks = groupedLibrary?.reading || []
  const hasBooksInLibrary = (groupedLibrary?.reading?.length || 0) + 
                           (groupedLibrary?.to_read?.length || 0) + 
                           (groupedLibrary?.read?.length || 0) > 0

  // 2. Get Follows Data
  const { follows, loading: followsLoading, fetchFollows } = useFollows()
  const followedAuthors = follows.filter(f => f.followable_type === 'Author')
  const hasFollows = followedAuthors.length > 0

  // 3. Get Recommendations
  const { books: recommendedBooks, loading: recsLoading } = useRecommendedBooks()
  const { authors: recommendedAuthors, loading: authorRecsLoading } = useRecommendedAuthors()

  // 4. Get Local Info
  const eventParams = useMemo(() => ({
    zipcode: user?.zipcode || undefined,
    radius: 50,
    per_page: 2
  }), [user?.zipcode])

  const { events, isLoading: eventsLoading } = useEvents(eventParams)
  const { venues, isLoading: venuesLoading } = useVenues({ 
    zipcode: user?.zipcode || undefined 
  })
  const bookstores = venues.filter(v => v.venue_type === 'bookstore')

  const { hasViewedMilestone } = useMilestones()

  // Calculate Quests
  const quests = useMemo(() => [
    {
      id: 'shelf-first',
      title: 'Shelf your first book',
      description: 'Find a book you love and add it to your collection.',
      icon: <BookPlus size={24} />,
      href: '/search?type=books',
      isCompleted: hasBooksInLibrary
    },
    {
      id: 'follow-author',
      title: 'Follow your favorite author',
      description: 'Stay updated with new releases and events.',
      icon: <UserPlus size={24} />,
      href: '/search?type=people',
      isCompleted: hasFollows
    },
    {
      id: 'update-location',
      title: 'Add your location',
      description: 'Help us find author events and bookstores near you.',
      icon: <MapPin size={24} />,
      href: '/settings',
      isCompleted: !!user?.zipcode
    },
    {
      id: 'reading-goal',
      title: 'Set a reading goal',
      description: 'Commit to a number of books to read this year.',
      icon: <Target size={24} />,
      href: '/library',
      isCompleted: hasViewedMilestone('goal_set')
    }
  ], [hasBooksInLibrary, hasFollows, user?.zipcode, hasViewedMilestone])

  // Fetch missing data
  useEffect(() => {
    if (isAuthenticated) {
      fetchFollows()
    }
  }, [isAuthenticated, fetchFollows])

  return (
    <div className="min-h-screen bg-background-app pb-20">
      <div className="container-mobile py-8 space-y-12">
        {/* 1. Hero Section */}
        <DashboardHero 
          readingBooks={readingBooks} 
          onUpdate={refreshLibrary} 
          userName={user?.display_name || user?.username}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12">
          {/* 2. Main Column (Recommendations) */}
          <div className="lg:col-span-8 space-y-12">
            <DashboardRecommendations 
              books={recommendedBooks} 
              authors={recommendedAuthors}
              loading={recsLoading || authorRecsLoading}
            />
          </div>

          {/* 3. Sidebar (Quests & Local Pulse) */}
          <div className="lg:col-span-4 space-y-8">
            <DashboardQuests quests={quests} />
            <DashboardLocalPulse 
              events={events} 
              bookstores={bookstores} 
              zipcode={user?.zipcode}
              loading={eventsLoading || venuesLoading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

