import { MetadataRoute } from 'next'
import { GENRES } from '@/app/discover/genreConfig'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://getwellread.com',
      priority: 1.0,
      changeFrequency: 'weekly',
    },
    {
      url: 'https://getwellread.com/discover',
      priority: 0.8,
      changeFrequency: 'weekly',
    },
    {
      url: 'https://getwellread.com/search',
      priority: 0.6,
      changeFrequency: 'monthly',
    },
    ...GENRES.map((g) => ({
      url: `https://getwellread.com/discover/genre/${g.slug}`,
      priority: 0.7 as number,
      changeFrequency: 'monthly' as const,
    })),
  ]
}
