'use client'

/**
 * ModernPlaceholder Component
 * 
 * Beautiful gradient placeholder for books without covers
 * Shows first letter of title with elegant typography
 * Genre-based color schemes for visual variety
 */

interface ModernPlaceholderProps {
  title: string
  author?: string
  genre?: string
  size?: 'small' | 'medium' | 'large'
  className?: string
}

// Genre-based gradient color schemes
const GENRE_GRADIENTS: Record<string, string> = {
  fiction: 'from-indigo-400 via-purple-400 to-pink-400',
  mystery: 'from-slate-600 via-slate-700 to-slate-800',
  scifi: 'from-cyan-400 via-blue-500 to-indigo-600',
  fantasy: 'from-violet-400 via-fuchsia-500 to-pink-500',
  romance: 'from-rose-400 via-pink-400 to-red-400',
  thriller: 'from-red-600 via-orange-600 to-yellow-600',
  history: 'from-amber-600 via-orange-500 to-red-500',
  biography: 'from-teal-400 via-emerald-500 to-green-600',
  default: 'from-gray-400 via-gray-500 to-gray-600',
}

// Generate consistent color based on title (for books without genre)
function getTitleBasedGradient(title: string): string {
  const charCode = title.charCodeAt(0) || 0
  const gradients = Object.values(GENRE_GRADIENTS)
  const index = charCode % (gradients.length - 1) // Exclude default
  return gradients[index]
}

export function ModernPlaceholder({
  title,
  author,
  genre,
  size = 'medium',
  className = '',
}: ModernPlaceholderProps) {
  const firstLetter = title.charAt(0).toUpperCase()
  
  // Select gradient based on genre or title
  const gradient = genre 
    ? GENRE_GRADIENTS[genre.toLowerCase()] || GENRE_GRADIENTS.default
    : getTitleBasedGradient(title)

  const sizeClasses = {
    small: {
      container: 'w-24 h-36',
      letter: 'text-4xl',
      author: 'text-[8px]',
    },
    medium: {
      container: 'w-32 h-48',
      letter: 'text-5xl',
      author: 'text-[10px]',
    },
    large: {
      container: 'w-48 h-72',
      letter: 'text-7xl',
      author: 'text-xs',
    },
  }

  const sizes = sizeClasses[size]

  return (
    <div
      className={`
        ${sizes.container}
        bg-gradient-to-br ${gradient}
        rounded-lg shadow-lg
        flex flex-col items-center justify-center
        relative overflow-hidden
        ${className}
      `}
    >
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]" />
      
      {/* First letter */}
      <div className={`${sizes.letter} font-bold text-white drop-shadow-lg z-10`}>
        {firstLetter}
      </div>

      {/* Book spine effect at bottom */}
      {author && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur-sm p-2 z-10">
          <div className="text-white/90 font-medium text-[10px] sm:text-xs truncate text-center">
            {title.length > 20 ? `${title.substring(0, 20)}...` : title}
          </div>
          <div className={`text-white/70 ${sizes.author} truncate text-center mt-0.5`}>
            {author}
          </div>
        </div>
      )}

      {/* Subtle highlight effect */}
      <div className="absolute top-0 left-0 right-1/2 h-1/2 bg-gradient-to-br from-white/20 to-transparent rounded-tl-lg" />
    </div>
  )
}

