import type { Metadata } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import OnboardingProgressBar from '@/components/OnboardingProgressBar'
import SiteFooter from '@/components/SiteFooter'
import OnboardingGuard from '@/components/OnboardingGuard'
import AuthInitializer from '@/components/AuthInitializer'

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
  title: 'WellRead',
  description: 'Your personal reading library — track books, follow authors, and share what you read.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen" style={{ backgroundColor: 'var(--color-canvas)' }}>
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
