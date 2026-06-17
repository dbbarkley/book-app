// frontend/src/app/discover/genre/[slug]/layout.tsx
import type { Metadata } from 'next'
import { getGenreBySlug } from '@/app/discover/genreConfig'
import JsonLd from '@/components/JsonLd'

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const genre = getGenreBySlug(params.slug)
  const name = genre?.name ?? params.slug.replace(/-/g, ' ')
  return {
    title: { absolute: `${name} Books | WellRead` },
    description: `Discover the best ${name} books to read next on WellRead.`,
    openGraph: {
      title: `${name} Books | WellRead`,
      description: `Discover the best ${name} books to read next on WellRead.`,
    },
  }
}

export default function GenreLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const genre = getGenreBySlug(params.slug)
  const name = genre?.name ?? params.slug.replace(/-/g, ' ')
  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${name} Books`,
    description: `Discover the best ${name} books to read next on WellRead.`,
    url: `https://getwellread.com/discover/genre/${params.slug}`,
  }
  return (
    <>
      <JsonLd data={collectionPageSchema} />
      {children}
    </>
  )
}
