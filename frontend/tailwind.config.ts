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
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'Cambria', 'serif'],
      },
      colors: {
        // -------------------------------------------------------
        // SEMANTIC THEME COLOURS
        // All values come from CSS variables defined in globals.css.
        // To change the theme, edit globals.css :root — not here.
        // -------------------------------------------------------

        // Backgrounds
        'canvas':   'var(--color-canvas)',    // Main app background
        'surface':  'var(--color-surface)',   // Cards & panels
        'cave':     'var(--color-cave)',      // Hero / deepest bg
        'grove':    'var(--color-grove)',     // Muted section bg

        // Accent
        'accent':         'var(--color-accent)',
        'accent-hover':   'var(--color-accent-hover)',
        'accent-subtle':  'var(--color-accent-subtle)',
        'accent-on':      'var(--color-accent-on)',

        // Text on LIGHT surfaces
        'ink':    'var(--color-ink)',    // Primary
        'ink-2':  'var(--color-ink-2)', // Secondary
        'ink-3':  'var(--color-ink-3)', // Muted

        // Text on DARK surfaces
        'lit':    'var(--color-lit)',    // Primary
        'lit-2':  'var(--color-lit-2)', // Secondary
        'lit-3':  'var(--color-lit-3)', // Faint

        // Borders
        'rim':        'var(--color-rim)',
        'rim-dark':   'var(--color-rim-dark)',
        'rim-accent': 'var(--color-rim-accent)',

        // Status
        'success':        'var(--color-success)',
        'success-light':  'var(--color-success-light)',

        // -------------------------------------------------------
        // LEGACY ALIASES — kept so untouched components still work
        // -------------------------------------------------------
        'brand-indigo':      'var(--color-accent)',
        'brand-indigo-dark': 'var(--color-accent-hover)',
        'brand-green':       'var(--color-success)',
        'text-primary':      'var(--color-ink)',
        'text-secondary':    'var(--color-ink-2)',
        'text-muted':        'var(--color-ink-3)',
        'background-app':    'var(--color-canvas)',
        'background-card':   'var(--color-surface)',
        'background-muted':  'var(--color-grove)',
        'border-default':    'var(--color-rim)',
        'status-error':      'var(--color-error)',
        'status-warning':    '#D97706',

        // Additional legacy aliases for legacy components
        'background-elevated': 'var(--color-grove)',
        'background-default':  'var(--color-canvas)',
        'brand-purple':        'var(--color-accent)',
        'primary-600':         'var(--color-accent)',
        'primary-50':          'var(--color-accent-subtle)',
        'primary-100':         'var(--color-accent-subtle)',
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
