import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search Books',
  description: 'Search millions of books by title, author, or ISBN on WellRead.',
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
