/**
 * Brand color tokens — mirrors the CSS custom properties in the web app.
 * Dark theme only for now; add a light object later if needed.
 */

export const Colors = {
  // Base canvas / background
  canvas:   '#0D1A0F',   // --color-canvas
  surface:  '#111E13',   // --color-surface
  grove:    '#1A2C1D',   // --color-grove (hover / subtle bg)

  // Borders
  rim:      '#2A3D2D',   // --color-rim

  // Text
  lit:      '#EDE8DC',   // --color-lit      (primary text)
  lit2:     '#A09880',   // --color-lit-2    (secondary text)
  lit3:     '#8A8070',   // --color-lit-3    (tertiary / muted) — lightened for WCAG AA ~4.5:1

  // Accent (gold)
  accent:   '#C9A84C',   // --color-accent
  accentOn: '#0D1A0F',   // --color-accent-on (text on accent bg)

  // Semantic
  error:    '#D9534F',
  success:  '#4CAF50',
  partner:  '#7B8EC4',   // reading buddy partner accent (dusty rose)

  // Tab bar
  tabActive:   '#C9A84C',
  tabInactive: '#6B6352',
} as const

export type ColorKey = keyof typeof Colors
