import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Discover Books',
  description: 'Browse books by genre and find your next great read on WellRead.',
}

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
