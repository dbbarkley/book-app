import type { Metadata } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import OnboardingProgressBar from '@/components/OnboardingProgressBar'
import SiteFooter from '@/components/SiteFooter'
import OnboardingGuard from '@/components/OnboardingGuard'
import AuthInitializer from '@/components/AuthInitializer'
import JsonLd from '@/components/JsonLd'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://getwellread.com'),
  title: {
    default: 'WellRead',
    template: '%s | WellRead',
  },
  description: 'Track your reading life. Follow authors, share progress, and read alongside friends.',
  openGraph: {
    type: 'website',
    siteName: 'WellRead',
    url: 'https://getwellread.com',
    title: 'WellRead',
    description: 'Track your reading life. Follow authors, share progress, and read alongside friends.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'WellRead — track your reading life' }],
  },
  twitter: { card: 'summary_large_image' },
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'WellRead',
  url: 'https://getwellread.com',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen" style={{ backgroundColor: 'var(--color-canvas)' }}>
          <JsonLd data={websiteSchema} />
          <AuthInitializer />
          <OnboardingProgressBar />
          <Navigation />
          <OnboardingGuard>
            <main className="min-h-screen pb-20 md:pb-0">{children}</main>
            <div className="hidden lg:block"><SiteFooter /></div>
          </OnboardingGuard>
      </body>
    </html>
  )
}
