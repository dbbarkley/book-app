/* ============================================================
   MOBILE · MARKETING LANDING — website edition
   The public landing page at phone width. Distinct from the app
   shell (own marketing nav, sticky CTA, no bottom tab bar) but
   the same Bold Modern visual language. Mirrors LandingBold.
   ============================================================ */

// ── Marketing top nav (sticky, with menu + CTA) ───────────
function MktNav() {
  const tw = window.useMTweaks ? window.useMTweaks() : { cta: 'Start free' };
  const cta = (tw.cta || 'Start free').toUpperCase();
  return (
    <div style={{
      flexShrink: 0, paddingTop: 54,
      backgroundColor: M.paper, borderBottom: `2px solid ${M.ink}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 12px' }}>
        <MBrand />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={{
            padding: '8px 14px', borderRadius: 99,
            backgroundColor: M.ink, color: M.bg,
            border: `2px solid ${M.ink}`, cursor: 'pointer',
            fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase',
            fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
          }}>{cta}</button>
          <button style={{
            width: 36, height: 36, borderRadius: 9,
            backgroundColor: M.paper, border: `2px solid ${M.ink}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            cursor: 'pointer',
          }}>
            <span style={{ width: 16, height: 2, backgroundColor: M.ink }} />
            <span style={{ width: 16, height: 2, backgroundColor: M.ink }} />
            <span style={{ width: 16, height: 2, backgroundColor: M.ink }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Scrolling marquee ─────────────────────────────────────
function MktMarquee({ items, bg = M.butter }) {
  const content = [...items, ...items, ...items];
  return (
    <div style={{
      backgroundColor: bg, borderTop: `2px solid ${M.ink}`, borderBottom: `2px solid ${M.ink}`,
      padding: '10px 0', overflow: 'hidden', position: 'relative',
    }}>
      <div style={{ display: 'flex', gap: 22, whiteSpace: 'nowrap', animation: 'm-marquee 22s linear infinite', width: 'fit-content' }}>
        {content.map((it, i) => (
          <span key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 16,
            fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, fontWeight: 600, color: M.ink,
            letterSpacing: '-0.01em',
          }}>
            {it}
            <span style={{ width: 7, height: 7, backgroundColor: M.clay, borderRadius: 99 }} />
          </span>
        ))}
      </div>
      <style>{`@keyframes m-marquee { from { transform: translateX(0);} to { transform: translateX(-33.333%);} }`}</style>
    </div>
  );
}

// ── Interactive shelf demo ────────────────────────────────
function MktShelf() {
  const [filter, setFilter] = React.useState('all');
  const filters = [
    { id: 'all', label: 'All', color: M.ink },
    { id: 'reading', label: 'Reading', color: M.clay },
    { id: 'finished', label: 'Finished', color: M.ocean },
    { id: 'priv', label: 'Private', color: M.butter },
  ];
  const data = LIB_BOOKS.slice(0, 6).map((b, i) => ({ ...b, status: ['reading','reading','finished','finished','priv','finished'][i] }));
  const visible = filter === 'all' ? data : data.filter(d => d.status === filter);
  return (
    <MCard shadow={M.ink} pad={16}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '5px 11px', borderRadius: 99,
            backgroundColor: filter === f.id ? f.color : 'transparent',
            color: filter === f.id ? (f.id === 'priv' ? M.ink : '#fff') : M.ink,
            border: `1.5px solid ${M.ink}`,
            fontSize: 10, fontWeight: 800, cursor: 'pointer',
          }}>{f.label}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {visible.map(b => (
          <div key={b.isbn} style={{ position: 'relative' }}>
            <BookCover isbn={b.isbn} title={b.title} author={b.author} hue={b.hue} />
            {b.status === 'priv' && (
              <div style={{ position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: 4, backgroundColor: M.butter, color: M.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${M.ink}` }}>
                <Icon name="lock" size={10} />
              </div>
            )}
            {b.status === 'reading' && (
              <div style={{ position: 'absolute', bottom: 5, left: 5, right: 5, padding: '2px 4px', borderRadius: 4, backgroundColor: M.clay, color: '#fff', fontSize: 7, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center', border: `1.5px solid ${M.ink}` }}>Reading</div>
            )}
          </div>
        ))}
      </div>
    </MCard>
  );
}

// ── AI-free seal ──────────────────────────────────────────
function MktSeal() {
  return (
    <div style={{ width: 200, height: 200, margin: '0 auto' }}>
      <svg viewBox="0 0 220 220" style={{ width: '100%', height: '100%' }}>
        <defs><path id="m-seal" d="M 110,110 m -88,0 a 88,88 0 1,1 176,0 a 88,88 0 1,1 -176,0" /></defs>
        <circle cx="110" cy="110" r="108" fill={M.butter} stroke={M.ink} strokeWidth="3" />
        <circle cx="110" cy="110" r="78" fill={M.bg} stroke={M.ink} strokeWidth="2" />
        <circle cx="110" cy="110" r="92" fill="none" stroke={M.ink} strokeWidth="1" />
        <text fontSize="11" fontWeight="900" fill={M.ink} letterSpacing="2.5" fontFamily="Inter, sans-serif">
          <textPath href="#m-seal" startOffset="0%">BUILT BY READERS · NOT BY ROBOTS · BUILT BY READERS · </textPath>
        </text>
        <g transform="translate(110 110)">
          <text x="0" y="14" textAnchor="middle" fontSize="56" fontWeight="900" fill={M.ink} fontFamily="Fraunces, serif" letterSpacing="2">AI</text>
          <line x1="-50" y1="-30" x2="50" y2="30" stroke={M.clay} strokeWidth="8" strokeLinecap="round" />
        </g>
        <text x="110" y="194" textAnchor="middle" fontSize="9" fontWeight="800" fill={M.ink} letterSpacing="3" fontFamily="Inter, sans-serif">EST. 2026</text>
      </svg>
    </div>
  );
}

// ── Chat demo (buddy) ─────────────────────────────────────
function MktBuddyMsg({ me, name, color, text }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexDirection: me ? 'row-reverse' : 'row' }}>
      <MAvatar initial={name[0]} color={color} size={26} />
      <div style={{ maxWidth: '80%' }}>
        <div style={{ fontSize: 13, padding: '9px 12px', borderRadius: 12,
          backgroundColor: '#fff', color: M.ink, lineHeight: 1.45,
          border: `1.5px solid ${M.ink}`,
          borderTopLeftRadius: !me ? 4 : 12, borderTopRightRadius: me ? 4 : 12,
          boxShadow: `2px 2px 0 ${M.ink}` }}>{text}</div>
      </div>
    </div>
  );
}

// ── Suggest demo ──────────────────────────────────────────
function MktSuggest() {
  const [sent, setSent] = React.useState(false);
  return (
    <div style={{ padding: 16, backgroundColor: M.clay, color: '#fff', borderRadius: 14, border: `2px solid ${M.ink}`, boxShadow: `5px 5px 0 ${M.ink}` }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 46, flexShrink: 0 }}>
          <BookCover isbn="9780571334650" title="Normal People" author="Sally Rooney" hue="#234a5a" />
        </div>
        <div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>Normal People</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Sally Rooney</div>
        </div>
      </div>
      <div style={{ padding: 12, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.18)', fontSize: 13, fontStyle: 'italic', fontFamily: 'Fraunces, serif', lineHeight: 1.5, marginBottom: 12 }}>
        "you're going to hate this and love this in equal measure. read it on a sunday."
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>To:</span>
        {['Mia', 'Priya'].map((c, i) => (
          <span key={c} style={{ padding: '4px 9px', borderRadius: 99, backgroundColor: i === 1 ? '#fff' : 'rgba(255,255,255,0.18)', color: i === 1 ? M.ink : '#fff', fontSize: 10, fontWeight: 700, border: i === 1 ? 'none' : '1px solid rgba(255,255,255,0.3)' }}>{c}</span>
        ))}
        <button onClick={() => setSent(true)} disabled={sent} style={{
          marginLeft: 'auto', padding: '7px 12px', borderRadius: 99,
          backgroundColor: sent ? M.butter : '#fff', color: M.ink, fontSize: 10, fontWeight: 800,
          border: `1.5px solid ${M.ink}`, cursor: sent ? 'default' : 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 5, letterSpacing: '0.04em' }}>
          {sent ? <><Icon name="check" size={11} /> SENT</> : <>SEND <Icon name="send" size={11} /></>}
        </button>
      </div>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────
function MktBlock({ children, style }) {
  return <section style={{ padding: '36px 20px', ...style }}>{children}</section>;
}

// ═══════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════
function MarketingMobile() {
  const tw = window.useMTweaks ? window.useMTweaks() : { cta: 'Start free', hero_variant: 'default' };
  const cta = (tw.cta || 'Start free').toUpperCase();
  const heroShort = tw.hero_variant === 'short';

  return (
    <MScreen noTabBar topBar={<MktNav />} bg={M.bg}>
      {/* ── HERO ─────────────────────────────────── */}
      <MktBlock style={{ paddingTop: 28, paddingBottom: 8, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -90, width: 240, height: 240, borderRadius: '50%', backgroundColor: M.clay, border: `2px solid ${M.ink}`, opacity: 0.95 }} />
        <div style={{ position: 'relative' }}>
          <MStamp rotate={-3} color={M.ink} size={10}>No bots · No AI · No nonsense</MStamp>
          <h1 style={{
            fontFamily: 'Fraunces, Georgia, serif', fontSize: 64, fontWeight: 600,
            lineHeight: 0.9, letterSpacing: '-0.04em', color: M.ink, margin: '16px 0 16px',
          }}>
            Books<br />
            <span style={{ color: M.clay, fontStyle: 'italic' }}>belong</span><br />
            to <span style={{ position: 'relative', display: 'inline-block' }}>
              readers.
              <svg width="100%" height="12" viewBox="0 0 260 12" style={{ position: 'absolute', left: 0, bottom: -4 }} preserveAspectRatio="none">
                <path d="M2 7 Q 65 2, 130 7 T 258 7" stroke={M.butter} strokeWidth="6" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.5, color: M.ink2, fontWeight: 500, margin: '0 0 22px' }}>
            {heroShort
              ? <>A book tracker built like a zine. <em style={{ fontStyle: 'italic' }}>No AI. No algorithm. No nonsense.</em></>
              : <>A book tracker built like a zine — bold, opinionated, run by people who'd rather argue about <em style={{ fontStyle: 'italic' }}>Tomorrow³</em> than train another language model.</>}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button style={{
              padding: '16px 24px', backgroundColor: M.ink, color: M.bg,
              fontSize: 13, fontWeight: 800, border: `2px solid ${M.ink}`, borderRadius: 99,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              letterSpacing: '0.06em', textTransform: 'uppercase', boxShadow: `5px 5px 0 ${M.clay}`,
            }}>{cta} <Icon name="arrow" size={15} /></button>
            <button style={{
              padding: '14px 22px', backgroundColor: 'transparent', color: M.ink,
              fontSize: 13, fontWeight: 800, border: `2px solid ${M.ink}`, borderRadius: 99,
              cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>Read the manifesto</button>
          </div>
        </div>

        {/* Book stack */}
        <div style={{ position: 'relative', height: 230, marginTop: 28 }}>
          {[
            { ...LIB_BOOKS[7], top: 10, left: 10, rot: -8, z: 3 },
            { ...LIB_BOOKS[1], top: 30, left: 110, rot: 6, z: 4 },
            { ...LIB_BOOKS[5], top: 70, left: 210, rot: -3, z: 2 },
            { ...LIB_BOOKS[3], top: 95, left: 60, rot: 7, z: 1 },
          ].map((b, i) => (
            <div key={b.isbn + i} style={{ position: 'absolute', top: b.top, left: b.left, width: 110, transform: `rotate(${b.rot}deg)`, zIndex: b.z, filter: `drop-shadow(6px 9px 0 rgba(26,26,26,0.85))` }}>
              <BookCover isbn={b.isbn} title={b.title} author={b.author} hue={b.hue} />
            </div>
          ))}
          <div style={{ position: 'absolute', bottom: 0, right: 4, backgroundColor: M.butter, border: `2px solid ${M.ink}`, borderRadius: 12, padding: '10px 13px', maxWidth: 200, transform: 'rotate(-3deg)', zIndex: 10, boxShadow: `4px 4px 0 ${M.ink}` }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 12, fontStyle: 'italic', color: M.ink, lineHeight: 1.4 }}>"The library you'd build if you didn't have to perform on it."</div>
            <div style={{ fontSize: 9, color: M.ink2, marginTop: 5, fontWeight: 700 }}>— our pledge</div>
          </div>
        </div>
      </MktBlock>

      {/* ── MARQUEE ──────────────────────────────── */}
      <MktMarquee items={['NO AI', 'NO ALGORITHM', 'NO TRACKING', 'JUST BOOKS', 'FREE FOREVER']} />

      {/* ── MANIFESTO ────────────────────────────── */}
      <MktBlock>
        <MktSeal />
        <div style={{ marginTop: 24 }}>
          <MStamp rotate={-2} color={M.clay}>The manifesto</MStamp>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 38, fontWeight: 600, color: M.ink, lineHeight: 0.96, margin: '16px 0 16px', letterSpacing: '-0.03em' }}>
            We will <em style={{ color: M.clay }}>never</em> use AI to read your books <em style={{ fontStyle: 'italic', textDecoration: `underline ${M.butter}`, textUnderlineOffset: 5, textDecorationThickness: 6 }}>for you.</em>
          </h2>
          <p style={{ fontSize: 15, color: M.ink2, lineHeight: 1.6, fontWeight: 500 }}>
            No AI summaries of books you haven't read. No algorithmic feeds telling you what to think. No model trained on your highlights, notes, or DNFs. Your reading life isn't training data.
          </p>
          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[['No AI summaries', M.clay], ['No algorithm', M.ocean], ['No training', M.butter], ['No tracking', M.ink]].map(([t, c]) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 11, height: 11, backgroundColor: c, border: `1.5px solid ${M.ink}`, borderRadius: 99 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: M.ink }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </MktBlock>

      {/* ── SHELF FEATURE ────────────────────────── */}
      <MktBlock style={{ paddingTop: 8 }}>
        <MEyebrow color={M.clay}>01 — The Shelf</MEyebrow>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 600, lineHeight: 0.98, margin: '10px 0 12px', letterSpacing: '-0.03em' }}>
          Every book.<br /><em style={{ color: M.clay }}>Including</em> the ones you hide.
        </h2>
        <p style={{ fontSize: 14, color: M.ink2, lineHeight: 1.55, margin: '0 0 18px' }}>
          Reading, finished, DNF, and a private shelf only you can see — for the romance novel, the self-help book, the one your therapist said to try.
        </p>
        <MktShelf />
      </MktBlock>

      {/* ── BUDDY FEATURE ────────────────────────── */}
      <MktBlock style={{ paddingTop: 8 }}>
        <MEyebrow color={M.ocean}>02 — Buddies</MEyebrow>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 600, lineHeight: 0.98, margin: '10px 0 12px', letterSpacing: '-0.03em' }}>
          The <em style={{ color: M.ocean }}>group chat</em> you actually want.
        </h2>
        <p style={{ fontSize: 14, color: M.ink2, lineHeight: 1.55, margin: '0 0 18px' }}>
          Pick a book. Invite a friend. Reactions thread by chapter and unlock as you both reach them — so no one spoils the twist.
        </p>
        <MCard shadow={M.clay} bg={M.paper} pad={16} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, borderBottom: `1.5px dashed ${M.ink3}` }}>
            <div style={{ width: 28 }}><BookCover isbn="9780525436140" title="Tomorrow" author="Zevin" hue="#1a4858" /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 13, fontWeight: 700, lineHeight: 1.05 }}>Tomorrow, and Tomorrow…</div>
              <div style={{ fontSize: 10, color: M.ink3 }}>with Alex</div>
            </div>
            <span style={{ padding: '3px 9px', borderRadius: 99, backgroundColor: M.butter, color: M.ink, fontSize: 8, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', border: `1.5px solid ${M.ink}` }}>Ch. 4</span>
          </div>
          <MktBuddyMsg name="Alex" color={M.clay} text="The NPC chapter is the best thing Zevin's ever written. Take your time." />
          <MktBuddyMsg me name="You" color={M.ocean} text="I'm calling it now: Marx is going to break my heart." />
        </MCard>
      </MktBlock>

      {/* ── SUGGEST + NOTES ──────────────────────── */}
      <MktBlock style={{ paddingTop: 8 }}>
        <MEyebrow color={M.ink}>03 — Everything else</MEyebrow>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 600, lineHeight: 0.98, margin: '10px 0 18px', letterSpacing: '-0.03em' }}>
          Small features. <em style={{ color: M.clay }}>Big rituals.</em>
        </h2>
        <MktSuggest />
        <div style={{ height: 16 }} />
        <MCard bg={M.butter} shadow={M.ink} pad={18}>
          <MEyebrow color={M.ink}>Notes</MEyebrow>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 600, lineHeight: 0.98, margin: '8px 0 12px', letterSpacing: '-0.02em' }}>
            Marginalia, <em>but searchable.</em>
          </h3>
          <div style={{ backgroundColor: M.paper, border: `2px solid ${M.ink}`, borderRadius: 12, padding: 16, boxShadow: `3px 3px 0 ${M.ink}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 26 }}><BookCover isbn="9780525559474" title="The Midnight Library" author="Matt Haig" hue="#0e3b2a" /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 800 }}>The Midnight Library</div>
                <div style={{ fontSize: 9, color: M.ink3 }}>Page 142</div>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 8, fontWeight: 800, color: M.clay, letterSpacing: '0.08em', textTransform: 'uppercase' }}><Icon name="lock" size={9} /> Private</span>
            </div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 13, fontStyle: 'italic', lineHeight: 1.5 }}>
              "Nora's regrets are too specific to be coincidences. He's writing about the cat, isn't he?"
            </div>
          </div>
        </MCard>
      </MktBlock>

      {/* ── WATCHLIST ────────────────────────────── */}
      <MktBlock style={{ paddingTop: 8 }}>
        <MEyebrow color={M.clay}>04 — Watchlist</MEyebrow>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 600, lineHeight: 0.98, margin: '10px 0 18px', letterSpacing: '-0.03em' }}>
          Ring the bell.<br /><em>We'll wake you up.</em>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {UPCOMING.slice(0, 2).map((b, i) => {
            const d = daysUntil(b.date);
            const dateStr = new Date(b.date).toLocaleDateString('en', { month: 'short', day: 'numeric' });
            return (
              <MCard key={b.isbn} shadow={i % 2 === 0 ? M.clay : M.ocean} pad={12} style={{ transform: `rotate(${i % 2 === 0 ? -1 : 1}deg)` }}>
                <BookCover isbn={b.isbn} title={b.title} author={b.author} hue={b.hue} />
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 13, fontWeight: 700, lineHeight: 1.1, marginTop: 8 }}>{b.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: `1.5px dashed ${M.ink3}` }}>
                  <div>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 800, color: M.clay, lineHeight: 1 }}>{d}d</div>
                    <div style={{ fontSize: 8, color: M.ink3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{dateStr}</div>
                  </div>
                  <div style={{ width: 26, height: 26, borderRadius: 99, backgroundColor: M.butter, border: `1.5px solid ${M.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="bell" size={11} stroke={M.ink} />
                  </div>
                </div>
              </MCard>
            );
          })}
        </div>
      </MktBlock>

      {/* ── PRICING ──────────────────────────────── */}
      <MktBlock style={{ paddingTop: 8 }}>
        <div style={{ backgroundColor: M.ink, color: '#fff', borderRadius: 18, padding: '36px 24px', position: 'relative', overflow: 'hidden', boxShadow: `8px 8px 0 ${M.clay}`, border: `2px solid ${M.ink}` }}>
          <div style={{ position: 'absolute', top: -70, right: -70, width: 220, height: 220, backgroundColor: M.clay, borderRadius: '50%', opacity: 0.4 }} />
          <div style={{ position: 'relative' }}>
            <MStamp rotate={-3} color={M.butter}>Pricing</MStamp>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 66, fontWeight: 600, lineHeight: 0.88, margin: '14px 0 14px', letterSpacing: '-0.04em', color: '#fff' }}>
              Free.<br /><em style={{ color: M.butter }}>Forever.</em>
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55, marginBottom: 20 }}>
              Funded by a small group of patron readers. No tiers, no trials, no surprise paywalls.
            </p>
            <div style={{ backgroundColor: '#fff', color: M.ink, borderRadius: 14, padding: 18, border: `2px solid ${M.ink}`, boxShadow: `4px 4px 0 ${M.butter}`, marginBottom: 20 }}>
              {['Unlimited books, every shelf', 'Private shelf (hidden)', 'Reading Buddies', 'Page-pinned notes', 'Release alerts', 'Zero AI · Zero ads'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `1px dashed ${M.ink3}` }}>
                  <div style={{ width: 16, height: 16, borderRadius: 99, backgroundColor: M.clay, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="check" size={10} strokeWidth={3} /></div>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{t}</span>
                </div>
              ))}
            </div>
            <button style={{
              width: '100%', padding: '16px 24px', backgroundColor: M.butter, color: M.ink,
              fontSize: 13, fontWeight: 800, border: `2px solid ${M.ink}`, borderRadius: 99,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              letterSpacing: '0.06em', textTransform: 'uppercase', boxShadow: `4px 4px 0 ${M.clay}`,
            }}>Claim your shelf <Icon name="arrow" size={15} /></button>
          </div>
        </div>
      </MktBlock>

      {/* ── FOOTER ───────────────────────────────── */}
      <footer style={{ padding: '28px 20px', borderTop: `2px solid ${M.ink}`, backgroundColor: M.paper }}>
        <MBrand />
        <div style={{ fontSize: 11, color: M.ink3, fontWeight: 600, margin: '12px 0 16px' }}>© 2026 · Made by humans, for humans</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 18px', fontSize: 11, fontWeight: 800, color: M.ink, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {['Manifesto', 'Privacy', 'Blog', 'Status', 'Contact'].map(l => <a key={l} style={{ color: M.ink, cursor: 'pointer' }}>{l}</a>)}
        </div>
      </footer>
    </MScreen>
  );
}

window.MarketingMobile = MarketingMobile;
