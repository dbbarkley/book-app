/* ============================================================
   MOBILE · DISCOVER — friend-powered, not algorithmic.
   Featured pick, seed-book finder, upcoming, friend lists,
   trending, genres. Mirrors DiscoverBold. Tab: discover.
   ============================================================ */

const MD_FEATURED = {
  isbn: '9780525436140', title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', hue: '#1a4858',
  blurb: "Two college friends design videogames together for thirty years. It's about videogames the way a knife is about an apple.",
  reactions: [
    { who: 'Alex', avatar: 'A', color: M.clay, note: "Best book I've read this year. The cabin chapter alone." },
    { who: 'Priya', avatar: 'P', color: M.ocean, note: "It's about how friendship is the only love story that matters." },
  ],
};
const MD_SEED = [
  { isbn: '9781501156700', title: 'Educated', author: 'Tara Westover', hue: '#3b2a14' },
  { isbn: '9780571334650', title: 'Normal People', author: 'Sally Rooney', hue: '#234a5a' },
  { isbn: '9780525559474', title: 'Midnight Library', author: 'Matt Haig', hue: '#0e3b2a' },
  { isbn: '9780525436140', title: 'Tomorrow³', author: 'Gabrielle Zevin', hue: '#1a4858' },
];
const MD_MATCHES = [
  { isbn: '9780063084735', title: 'The Ministry of Time', author: 'Kaliane Bradley', hue: '#3a1a2a', by: 'Readers who loved Tomorrow³ finished this next', overlap: 78, finishedBy: ['Alex', 'Priya'] },
  { isbn: '9781250301697', title: 'Where the Crawdads Sing', author: 'Delia Owens', hue: '#284a2b', by: 'Similar pacing and emotional weight', overlap: 64, finishedBy: ['Alex'] },
];
const MD_UPCOMING = [
  { isbn: '9780063021426', title: 'The Tainted Cup', author: 'Robert Jackson Bennett', date: '2026-06-04', hue: '#1a3a4a', tag: 'Fantasy mystery' },
  { isbn: '9780593446478', title: 'James', author: 'Percival Everett', date: '2026-06-18', hue: '#2a1810', tag: 'Literary' },
];
const MD_LISTS = [
  { title: 'Books that ruined me in the best way', who: 'Alex', avatar: 'A', color: M.clay, count: 12, desc: 'Books I had to put down and walk around the block.', books: [{ isbn: '9781501156700', hue: '#3b2a14' }, { isbn: '9780571334650', hue: '#234a5a' }, { isbn: '9780525436140', hue: '#1a4858' }, { isbn: '9780525559474', hue: '#0e3b2a' }] },
  { title: 'Cozy Sunday afternoon reads', who: 'Priya', avatar: 'P', color: M.ocean, count: 9, desc: 'For when the world is loud and you just want a nice time.', books: [{ isbn: '9780062315007', hue: '#5a3c1b' }, { isbn: '9780525658184', hue: '#5a3a1a' }, { isbn: '9781250301697', hue: '#284a2b' }, { isbn: '9780062073488', hue: '#3a2018' }] },
];
const MD_TRENDING = [
  { title: 'Tomorrow, and Tomorrow…', author: 'Gabrielle Zevin', isbn: '9780525436140', hue: '#1a4858', friends: 5, action: '3 reading · 2 finished' },
  { title: 'The Ministry of Time', author: 'Kaliane Bradley', isbn: '9780063084735', hue: '#3a1a2a', friends: 3, action: '2 to-read · 1 reading' },
  { title: 'Normal People', author: 'Sally Rooney', isbn: '9780571334650', hue: '#234a5a', friends: 3, action: '3 finished' },
];
const MD_GENRES = [
  { label: 'Literary fiction', color: M.ocean, count: 124, big: true },
  { label: 'Romance', color: M.clay, count: 89 },
  { label: 'Mystery', color: M.ink, count: 142 },
  { label: 'Sci-fi & Fantasy', color: M.butter, dark: true, count: 178 },
  { label: 'Memoir', color: M.success, count: 56 },
];

function DiscoverMobile() {
  const [seedIdx, setSeedIdx] = React.useState(3);
  const max = Math.max(...MD_TRENDING.map(i => i.friends));
  return (
    <MScreen tab="discover" topBar={<MTopBar title="Discover" />}>
      {/* Header */}
      <section style={{ padding: '18px 20px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: `3px double ${M.ink}`, borderBottom: `3px double ${M.ink}`, marginBottom: 18, fontSize: 8.5, fontWeight: 800, color: M.ink, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          <span>Issue №47</span><span>Week of May 15</span><span>No AI</span>
        </div>
        <MEyebrow color={M.clay}>Discover</MEyebrow>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 58, fontWeight: 600, lineHeight: 0.86, margin: '12px 0 14px', letterSpacing: '-0.04em', color: M.ink }}>
          What to <em style={{ color: M.clay }}>read</em><br />
          <span style={{ position: 'relative', display: 'inline-block' }}>next.
            <svg width="100%" height="12" viewBox="0 0 180 12" style={{ position: 'absolute', left: 0, bottom: 0 }} preserveAspectRatio="none"><path d="M2 7 Q 50 2, 90 7 T 178 7" stroke={M.butter} strokeWidth="6" fill="none" strokeLinecap="round" /></svg>
          </span>
        </h1>
        <div style={{ position: 'relative', marginTop: 8 }}>
          <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: M.ink3 }}><Icon name="search" size={16} /></div>
          <input placeholder="Search books, authors, lists…" style={{ width: '100%', padding: '13px 16px 13px 42px', backgroundColor: M.paper, border: `2px solid ${M.ink}`, borderRadius: 99, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', outline: 'none', color: M.ink, boxShadow: `4px 4px 0 ${M.butter}` }} />
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {['Books', 'Authors', 'Lists', 'Series', 'Upcoming'].map((f, i) => (
            <button key={f} style={{ padding: '5px 11px', borderRadius: 99, backgroundColor: i === 0 ? M.ink : 'transparent', color: i === 0 ? M.bg : M.ink, border: `1.5px solid ${M.ink}`, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>{f}</button>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section style={{ padding: '8px 20px' }}>
        <MCard shadow={M.clay} pad={18}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: `3px double ${M.ink}` }}>
            <MStamp rotate={-2} color={M.clay}>This week, your circle</MStamp>
            <span style={{ fontSize: 8, fontWeight: 700, color: M.ink3, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'right' }}>3 friends</span>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ width: 96, flexShrink: 0, transform: 'rotate(-2deg)', filter: `drop-shadow(5px 7px 0 ${M.ink})` }}>
              <BookCover isbn={MD_FEATURED.isbn} title={MD_FEATURED.title} author={MD_FEATURED.author} hue={MD_FEATURED.hue} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <MEyebrow color={M.ocean}>Featured</MEyebrow>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 600, color: M.ink, lineHeight: 0.95, margin: '8px 0 6px', letterSpacing: '-0.03em' }}>{MD_FEATURED.title}</h2>
              <div style={{ fontSize: 11, color: M.ink2, fontWeight: 600 }}>by {MD_FEATURED.author}</div>
            </div>
          </div>
          <p style={{ fontFamily: 'Fraunces, serif', fontSize: 15, fontStyle: 'italic', color: M.ink, lineHeight: 1.4, margin: '14px 0' }}>"{MD_FEATURED.blurb}"</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {MD_FEATURED.reactions.map((rx, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 10, backgroundColor: M.bg, border: `1.5px solid ${M.ink}` }}>
                <MAvatar initial={rx.avatar} color={rx.color} size={22} />
                <div style={{ fontSize: 12, color: M.ink2, lineHeight: 1.35 }}><strong style={{ color: M.ink, fontWeight: 800 }}>{rx.who}</strong> <span style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic' }}>"{rx.note}"</span></div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ flex: 1, padding: '11px', backgroundColor: M.ink, color: M.bg, fontSize: 10, fontWeight: 800, border: `2px solid ${M.ink}`, borderRadius: 99, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, letterSpacing: '0.06em', textTransform: 'uppercase', boxShadow: `3px 3px 0 ${M.clay}` }}><Icon name="plus" size={11} /> To-read</button>
            <button style={{ flex: 1, padding: '11px', backgroundColor: 'transparent', color: M.ink, fontSize: 10, fontWeight: 800, border: `2px solid ${M.ink}`, borderRadius: 99, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}><Icon name="users" size={11} /> Buddy</button>
          </div>
        </MCard>
      </section>

      {/* Seed finder */}
      <section style={{ padding: '8px 20px' }}>
        <div style={{ backgroundColor: M.ocean, color: '#fff', border: `2px solid ${M.ink}`, borderRadius: 18, padding: 18, boxShadow: `6px 6px 0 ${M.butter}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: `radial-gradient(circle, rgba(241,199,91,0.25) 0%, transparent 70%)` }} />
          <div style={{ position: 'relative' }}>
            <MEyebrow color={M.butter}>Find your next read</MEyebrow>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 600, color: '#fff', lineHeight: 0.96, margin: '10px 0 6px', letterSpacing: '-0.03em' }}>"If I loved this,<br /><em style={{ color: M.butter }}>what next?"</em></h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: '0 0 14px', lineHeight: 1.45 }}>Pick a book you loved. We'll show what readers who also loved it actually finished.</p>
            <div style={{ padding: 12, backgroundColor: 'rgba(0,0,0,0.2)', border: `1.5px solid rgba(255,255,255,0.18)`, borderRadius: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Step 1 · A book you loved</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {MD_SEED.map((b, i) => (
                  <button key={b.isbn} onClick={() => setSeedIdx(i)} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 6, borderRadius: 8, backgroundColor: seedIdx === i ? M.butter : 'transparent', border: `2px solid ${seedIdx === i ? M.butter : 'rgba(255,255,255,0.25)'}`, cursor: 'pointer', alignItems: 'center' }}>
                    <BookCover isbn={b.isbn} title={b.title} author={b.author} hue={b.hue} />
                    <div style={{ fontSize: 8, fontWeight: 700, color: seedIdx === i ? M.ink : '#fff', textAlign: 'center', lineHeight: 1.1 }}>{b.title}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding: 12, backgroundColor: 'rgba(0,0,0,0.2)', border: `1.5px solid rgba(255,255,255,0.18)`, borderRadius: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Step 2 · Try one of these</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>Based on 247 readers of <em style={{ fontStyle: 'italic' }}>{MD_SEED[seedIdx].title}</em></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {MD_MATCHES.map(m => (
                  <div key={m.isbn} style={{ backgroundColor: M.paper, border: `1.5px solid ${M.ink}`, borderRadius: 10, padding: 12, color: M.ink, boxShadow: `3px 3px 0 ${M.clay}`, display: 'flex', gap: 10 }}>
                    <div style={{ width: 42, flexShrink: 0 }}><BookCover isbn={m.isbn} title={m.title} author={m.author} hue={m.hue} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 13, fontWeight: 700, lineHeight: 1.1 }}>{m.title}</div>
                      <div style={{ fontSize: 9, color: M.ink3, marginTop: 2 }}>{m.author}</div>
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 5, backgroundColor: M.bg, borderRadius: 99, border: `1px solid ${M.ink}`, overflow: 'hidden' }}><div style={{ height: '100%', width: `${m.overlap}%`, backgroundColor: M.clay }} /></div>
                        <span style={{ fontFamily: 'Fraunces, serif', fontSize: 11, fontWeight: 800, color: M.clay }}>{m.overlap}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming */}
      <section style={{ padding: '12px 20px 4px' }}>
        <MSection eyebrow="Coming up" color={M.clay}>Worth <em style={{ color: M.clay }}>waiting for</em></MSection>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {MD_UPCOMING.map((b, i) => {
            const d = daysUntil(b.date);
            const dateStr = new Date(b.date).toLocaleDateString('en', { month: 'short', day: 'numeric' });
            const shadow = [M.clay, M.ocean][i];
            return (
              <MCard key={b.isbn} shadow={shadow} pad={12} style={{ transform: `rotate(${i % 2 === 0 ? -0.6 : 0.6}deg)` }}>
                <BookCover isbn={b.isbn} title={b.title} author={b.author} hue={b.hue} />
                <span style={{ display: 'inline-block', padding: '2px 7px', fontSize: 7, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', backgroundColor: M.ink, color: '#fff', borderRadius: 99, margin: '8px 0 4px' }}>{b.tag}</span>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 13, fontWeight: 700, lineHeight: 1.1 }}>{b.title}</div>
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1.5px dashed ${M.ink3}`, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 800, color: shadow === M.butter ? M.ink : shadow, lineHeight: 1 }}>{d}d</div>
                    <div style={{ fontSize: 8, color: M.ink3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{dateStr}</div>
                  </div>
                  <div style={{ width: 26, height: 26, borderRadius: 99, backgroundColor: M.butter, color: M.ink, border: `1.5px solid ${M.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `2px 2px 0 ${M.ink}` }}><Icon name="bell" size={11} /></div>
                </div>
              </MCard>
            );
          })}
        </div>
      </section>

      {/* Friend lists */}
      <section style={{ padding: '14px 0 4px' }}>
        <div style={{ padding: '0 20px' }}><MSection eyebrow="Friend lists" color={M.ocean}>Lists <em style={{ color: M.ocean }}>friends made</em></MSection></div>
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '0 20px 8px', scrollbarWidth: 'none' }}>
          {MD_LISTS.map((l, idx) => (
            <MCard key={idx} shadow={[M.clay, M.ocean][idx]} pad={16} style={{ width: 250, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MAvatar initial={l.avatar} color={l.color} size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8, color: M.ink3, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>A list by</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: M.ink }}>{l.who}</div>
                </div>
                <span style={{ fontSize: 8, fontWeight: 800, padding: '3px 8px', borderRadius: 99, backgroundColor: M.ink, color: M.bg, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l.count} books</span>
              </div>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 19, fontWeight: 600, color: M.ink, lineHeight: 1.05, margin: 0, letterSpacing: '-0.02em' }}>{l.title}</h3>
              <div style={{ display: 'flex', gap: 6, padding: 10, backgroundColor: M.bg, border: `1.5px dashed ${M.ink3}`, borderRadius: 10 }}>
                {l.books.map((b, i) => <div key={i} style={{ flex: 1, transform: `rotate(${(i - 1.5) * 2}deg)` }}><BookCover isbn={b.isbn} title="" author="" hue={b.hue} /></div>)}
              </div>
              <button style={{ padding: '9px', backgroundColor: M.ink, color: M.bg, fontSize: 10, fontWeight: 800, border: `1.5px solid ${M.ink}`, borderRadius: 99, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Open list <Icon name="arrow" size={11} /></button>
            </MCard>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section style={{ padding: '12px 20px' }}>
        <MSection eyebrow="In your circle" color={M.clay}>What's <em style={{ color: M.clay }}>actually</em> read</MSection>
        <MCard shadow={M.ocean} pad={14}>
          {MD_TRENDING.map((it, i) => (
            <div key={it.isbn} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < MD_TRENDING.length - 1 ? `1.5px dashed ${M.ink3}` : 'none' }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 22, fontWeight: 600, color: M.ink3, width: 22, textAlign: 'center' }}>{i + 1}</span>
              <div style={{ width: 30, flexShrink: 0 }}><BookCover isbn={it.isbn} title={it.title} author={it.author} hue={it.hue} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 13, fontWeight: 700, lineHeight: 1.05 }}>{it.title}</div>
                <div style={{ fontSize: 9, color: M.ink3 }}>{it.action}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 80 }}>
                <div style={{ flex: 1, height: 8, backgroundColor: M.bg, borderRadius: 99, border: `1.5px solid ${M.ink}`, overflow: 'hidden' }}><div style={{ height: '100%', width: `${(it.friends / max) * 100}%`, backgroundColor: [M.clay, M.ocean, M.butter][i] }} /></div>
                <span style={{ fontFamily: 'Fraunces, serif', fontSize: 15, fontWeight: 800, color: M.ink }}>{it.friends}</span>
              </div>
            </div>
          ))}
        </MCard>
      </section>

      {/* Genres */}
      <section style={{ padding: '8px 20px 8px' }}>
        <MSection eyebrow="Browse" color={M.ink}>Wander <em style={{ color: M.clay }}>by section</em></MSection>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: '84px', gap: 12 }}>
          {MD_GENRES.map((g, i) => (
            <button key={g.label} style={{ gridColumn: g.big ? 'span 2' : 'span 1', backgroundColor: g.color, color: g.dark ? M.ink : '#fff', border: `2px solid ${M.ink}`, borderRadius: 14, padding: 14, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', boxShadow: `4px 4px 0 ${M.ink}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.1em', opacity: g.dark ? 0.7 : 0.85, textTransform: 'uppercase' }}>Section {String(i + 1).padStart(2, '0')}</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: g.big ? 28 : 17, fontWeight: 600, lineHeight: 0.95, letterSpacing: '-0.02em' }}>{g.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 9, fontWeight: 700, opacity: 0.9, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                <span>{g.count} books</span><Icon name="arrow" size={12} stroke={g.dark ? M.ink : '#fff'} />
              </div>
            </button>
          ))}
        </div>
      </section>
    </MScreen>
  );
}

window.DiscoverMobile = DiscoverMobile;
