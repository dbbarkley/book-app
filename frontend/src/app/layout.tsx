import type { Metadata } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import OnboardingProgressBar from '@/components/OnboardingProgressBar'
import SiteFooter from '@/components/SiteFooter'
import OnboardingGuard from '@/components/OnboardingGuard'
import AuthInitializer from '@/components/AuthInitializer'
import { CurtainProvider } from '@/context/CurtainContext'
import LoginTransitionCurtain from '@/components/LoginTransitionCurtain'

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
        <CurtainProvider>
          {/* Initialize auth and handle token refresh */}
          <AuthInitializer />
          {/* Onboarding progress bar sits above the nav (only on /onboarding) */}
          <OnboardingProgressBar />
          {/* Navigation is always visible, even during onboarding */}
          <Navigation />
          {/*
            LoginTransitionCurtain lives here so it persists through
            client-side navigation from /login → /dashboard.
            It reads state from CurtainContext and renders nothing when idle.
          */}
          <LoginTransitionCurtain />
          <OnboardingGuard>
            <main className="min-h-screen pb-20 md:pb-0">{children}</main>
            <div className="hidden lg:block"><SiteFooter /></div>
          </OnboardingGuard>
        </CurtainProvider>
      </body>
    </html>
  )
}
