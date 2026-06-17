import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/library', '/feed', '/onboarding', '/reading-buddy'],
    },
    sitemap: 'https://getwellread.com/sitemap.xml',
  }
}
