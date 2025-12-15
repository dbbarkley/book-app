import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'
import OnboardingGuard from '@/components/OnboardingGuard'
import AuthInitializer from '@/components/AuthInitializer'

export const metadata: Metadata = {
  title: 'Book Social Platform',
  description: 'A social platform for book lovers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
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
