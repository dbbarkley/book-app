/* ============================================================
   MOBILE SHARED — Libraio Bold Modern, phone edition
   Tokens, stamps, top bar, bottom tab bar, bottom sheet, and the
   MScreen shell. Reuses window.BookCover + window.Icon from
   shared.jsx. Shared visual language with the desktop build:
   cream paper + ink, terracotta clay, ocean, butter; hard offset
   shadows; Fraunces display + Inter UI; stamps & eyebrows.
   ============================================================ */

const M = {
  bg:        '#F2EDE2',
  paper:     '#FAF6EB',
  ink:       '#1A1A1A',
  ink2:      '#4A4A4A',
  ink3:      '#8B8378',
  clay:      '#D5582E',
  clayDeep:  '#A03F1F',
  ocean:     '#1E3A5F',
  butter:    '#F1C75B',
  success:   '#3F8A5C',
  forest:    '#2E6D54',
  red:       '#B33B22',
};

const mPaperTexture = {
  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><filter id='n'><feTurbulence baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.1 0 0 0 0 0.08 0 0 0 0 0.05 0 0 0 0.04 0'/></filter><rect width='100' height='100' filter='url(%23n)'/></svg>")`,
};

// ── Stamp (rotated outline tag) ───────────────────────────
function MStamp({ children, rotate = -4, color = M.clay, size = 9, fill }) {
  return (
    <div style={{
      display: 'inline-block',
      transform: `rotate(${rotate}deg)`,
      padding: '4px 9px',
      border: `1.5px solid ${color}`,
      color: fill ? '#fff' : color,
      backgroundColor: fill ? color : 'transparent',
      fontFamily: 'Inter, sans-serif',
      fontSize: size, fontWeight: 900,
      letterSpacing: '0.14em', textTransform: 'uppercase',
      borderRadius: 4, whiteSpace: 'nowrap',
    }}>{children}</div>
  );
}

// ── Eyebrow (bar + label) ─────────────────────────────────
function MEyebrow({ children, color = M.clay }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      fontSize: 10, fontWeight: 800, letterSpacing: '0.16em',
      color, textTransform: 'uppercase',
    }}>
      <span style={{ width: 18, height: 2, backgroundColor: color }} />
      {children}
    </div>
  );
}

// ── Pill button ───────────────────────────────────────────
function MPill({ children, bg = M.ink, color = '#fff', border = M.ink, shadow, onClick, style, icon, iconRight }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      padding: '10px 16px', borderRadius: 99,
      backgroundColor: bg, color,
      border: `2px solid ${border}`,
      fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
      textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap',
      fontFamily: 'Inter, sans-serif',
      boxShadow: shadow ? `3px 3px 0 ${shadow}` : 'none',
      ...style,
    }}>
      {icon && <Icon name={icon} size={12} />}
      {children}
      {iconRight && <Icon name={iconRight} size={12} />}
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────
function MCard({ children, shadow = M.ink, bg = M.paper, pad = 16, style }) {
  return (
    <div style={{
      backgroundColor: bg,
      border: `2px solid ${M.ink}`,
      borderRadius: 14,
      boxShadow: `5px 5px 0 ${shadow}`,
      padding: pad,
      ...style,
    }}>{children}</div>
  );
}

// ── Section title (eyebrow + serif headline) ──────────────
function MSection({ eyebrow, color = M.clay, children, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, gap: 12 }}>
      <div>
        <MEyebrow color={color}>{eyebrow}</MEyebrow>
        <h2 style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 26, fontWeight: 600, color: M.ink,
          margin: '6px 0 0', letterSpacing: '-0.025em', lineHeight: 1.02,
        }}>{children}</h2>
      </div>
      {right}
    </div>
  );
}

// ── Brand mark ────────────────────────────────────────────
function MBrand({ size = 30 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: size, height: size, borderRadius: 7,
        backgroundColor: M.clay, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Fraunces, serif', fontSize: size * 0.6, fontWeight: 900,
        border: `2px solid ${M.ink}`, boxShadow: `2px 2px 0 ${M.ink}`,
      }}>L</div>
      <span style={{ fontFamily: 'Fraunces, serif', fontSize: 19, fontWeight: 700, color: M.ink, letterSpacing: '-0.02em' }}>Libraio</span>
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────
function MAvatar({ initial, color = M.ocean, size = 32, dark, border = true }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 99, flexShrink: 0,
      backgroundColor: color, color: dark ? M.ink : '#fff',
      fontFamily: 'Fraunces, serif', fontSize: Math.round(size * 0.44), fontWeight: 800,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: border ? `2px solid ${M.ink}` : 'none',
    }}>{initial}</div>
  );
}

// ── Star row ──────────────────────────────────────────────
function MStars({ value, size = 11, color = M.clay }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= value ? color : 'none'} stroke={color} strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

// ── Tab-bar glyphs ────────────────────────────────────────
function TabGlyph({ name, active }) {
  const c = active ? '#fff' : M.ink;
  const sw = 2;
  const p = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: c, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'home')     return <svg {...p}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/><path d="M9.5 21v-6h5v6"/></svg>;
  if (name === 'shelf')    return <svg {...p}><rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 9.5h18M3 15h18"/></svg>;
  if (name === 'discover') return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>;
  if (name === 'buddies')  return <svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="3.5"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.5a4 4 0 0 1 0 7"/></svg>;
  if (name === 'you')      return <svg {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>;
  return null;
}

// ── Bottom tab bar ────────────────────────────────────────
const M_TABS = [
  { id: 'home',     label: 'Home',     glyph: 'home' },
  { id: 'library',  label: 'Library',  glyph: 'shelf' },
  { id: 'discover', label: 'Discover', glyph: 'discover' },
  { id: 'buddies',  label: 'Buddies',  glyph: 'buddies' },
  { id: 'you',      label: 'You',      glyph: 'you' },
];

function BottomTabBar({ active = 'home' }) {
  return (
    <div style={{
      flexShrink: 0,
      borderTop: `2px solid ${M.ink}`,
      backgroundColor: M.paper,
      paddingBottom: 24, // clear home indicator
      display: 'flex', alignItems: 'stretch',
    }}>
      {M_TABS.map(t => {
        const on = t.id === active;
        return (
          <button key={t.id} style={{
            flex: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '10px 0 8px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            position: 'relative',
          }}>
            <div style={{
              width: 44, height: 30, borderRadius: 99,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: on ? M.clay : 'transparent',
              border: on ? `1.5px solid ${M.ink}` : '1.5px solid transparent',
              boxShadow: on ? `2px 2px 0 ${M.ink}` : 'none',
              transition: 'all 150ms',
            }}>
              <TabGlyph name={t.glyph} active={on} />
            </div>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: on ? M.ink : M.ink3,
            }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── App top bar (sticky, clears status bar) ───────────────
function MTopBar({ title, showBack, big, right }) {
  return (
    <div style={{
      flexShrink: 0,
      paddingTop: 54, // clear iOS status bar
      backgroundColor: M.paper,
      borderBottom: `2px solid ${M.ink}`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px 12px', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {showBack && (
            <div style={{
              width: 34, height: 34, borderRadius: 99,
              border: `2px solid ${M.ink}`, backgroundColor: M.paper,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon name="arrow" size={14} style={{ transform: 'rotate(180deg)' }} stroke={M.ink} />
            </div>
          )}
          {title ? (
            <span style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 700, color: M.ink, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
          ) : <MBrand />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {right || (
            <>
              <div style={{
                width: 34, height: 34, borderRadius: 99,
                border: `2px solid ${M.ink}`, backgroundColor: M.paper, color: M.ink,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="search" size={14} />
              </div>
              <MAvatar initial="M" size={34} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MScreen shell — fills the device, optional bottom tab bar
function MScreen({ children, tab, topBar, bg = M.bg, scrollRef, noTabBar, pad = true }) {
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      backgroundColor: bg, color: M.ink,
      fontFamily: 'Inter, system-ui, sans-serif',
      ...mPaperTexture,
    }}>
      {topBar}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}>
        {children}
        <div style={{ height: noTabBar ? 28 : 12 }} />
      </div>
      {!noTabBar && <BottomTabBar active={tab} />}
    </div>
  );
}

// ── Bottom sheet (modal) — slides up over a dimmed backdrop ─
// For static artboards we render in the OPEN state.
function BottomSheet({ children, peek, onClose, maxHeight = '88%' }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 40,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      {/* Backdrop */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundColor: 'rgba(26,26,26,0.55)',
        backdropFilter: 'blur(2px)',
      }} />
      {/* Sheet */}
      <div style={{
        position: 'relative',
        backgroundColor: M.paper,
        borderTopLeftRadius: 26, borderTopRightRadius: 26,
        borderTop: `2.5px solid ${M.ink}`,
        borderLeft: `2.5px solid ${M.ink}`,
        borderRight: `2.5px solid ${M.ink}`,
        boxShadow: `0 -12px 40px rgba(0,0,0,0.3)`,
        maxHeight, display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        ...mPaperTexture,
      }}>
        {/* Grabber */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px', flexShrink: 0 }}>
          <div style={{ width: 44, height: 5, borderRadius: 99, backgroundColor: M.ink3 }} />
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Tweaks context (cta + hero_variant carry over) ────────
const MTweaksCtx = React.createContext({ cta: 'Start free', hero_variant: 'default' });
function useMTweaks() { return React.useContext(MTweaksCtx); }

Object.assign(window, {
  M, mPaperTexture, MStamp, MEyebrow, MPill, MCard, MSection, MBrand,
  MAvatar, MStars, TabGlyph, BottomTabBar, MTopBar, MScreen, BottomSheet,
  MTweaksCtx, useMTweaks,
});
