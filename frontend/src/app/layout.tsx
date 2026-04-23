import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import OnboardingGuard from '@/components/OnboardingGuard'
import AuthInitializer from '@/components/AuthInitializer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: 'Libraio',
  description: 'Your personal reading library — track books, follow authors, and share what you read.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen" style={{ backgroundColor: 'var(--color-canvas)' }}>
        {/* Initialize auth and handle token refresh */}
        <AuthInitializer />
        {/* Navigation is always visible, even during onboarding */}
        <Navigation />
        <OnboardingGuard>
          <main className="min-h-screen">{children}</main>
        </OnboardingGuard>
      </body>
    </html>
  )
}
