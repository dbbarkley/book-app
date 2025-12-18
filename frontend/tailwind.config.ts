import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        'brand-indigo': '#4F46E5',
        'brand-indigo-dark': '#312E81',
        'brand-green': '#16A34A',
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        'text-muted': '#9CA3AF',
        'background-app': '#FAFAFA',
        'background-card': '#FFFFFF',
        'background-muted': '#F3F4F6',
        'border-default': '#E5E7EB',
        'status-error': '#DC2626',
        'status-warning': '#D97706',
      },
      screens: {
        xs: '475px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        'shimmer-slide': 'shimmer-slide 2s infinite',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'shimmer-slide': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
