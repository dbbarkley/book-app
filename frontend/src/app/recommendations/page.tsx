import { redirect } from 'next/navigation'

// /recommendations has been merged into /dashboard.
// Preference controls (hide/dislike) will live in Settings when added.
export default function RecommendationsPage() {
  redirect('/dashboard')
}
