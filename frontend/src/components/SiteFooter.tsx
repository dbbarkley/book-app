import Link from 'next/link'

const FOOTER_LINKS = [
  { label: 'Manifesto', href: '/manifesto' },
  { label: 'Privacy',   href: '/privacy'   },
  { label: 'Contact',   href: '/contact'   },
]

export default function SiteFooter() {
  return (
    <footer
      style={{
        backgroundColor: 'var(--color-canvas)',
        borderTop: '2px solid var(--color-ink)',
      }}
    >
      <div
        className="container-mobile"
        style={{ paddingTop: 28, paddingBottom: 28 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

          {/* Left — logo + tagline */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: 'var(--color-accent)',
                  border: '2px solid var(--color-ink)',
                  boxShadow: '2px 2px 0px var(--color-ink)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-playfair), Georgia, serif',
                    fontSize: 20,
                    fontWeight: 800,
                    color: '#fff',
                    lineHeight: 1,
                    letterSpacing: '-0.5px',
                  }}
                >
                  W
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-playfair), Georgia, serif',
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: '-0.4px',
                  color: 'var(--color-ink)',
                }}
              >
                WellRead
              </span>
            </Link>
            <span
              className="text-[13px]"
              style={{ color: 'var(--color-ink-3)' }}
            >
              © 2026 · Made by Readers, for Readers
            </span>
          </div>

          {/* Right — nav links */}
          <nav className="flex items-center gap-6 flex-wrap">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[12px] font-bold uppercase tracking-[0.12em] transition-opacity hover:opacity-50"
                style={{ color: 'var(--color-ink)' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

        </div>
      </div>
    </footer>
  )
}
