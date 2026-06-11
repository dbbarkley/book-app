/* ============================================================
   MOBILE · LIBRARY — your shelves. Mirrors LibraryBold.
   Goal ring + stats, currently-reading hero, friend suggestions,
   and the shelves: To Read / Completed / DNF / Private. Tab: library.
   ============================================================ */

const ML_READING = [
  { isbn: '9780525436140', title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', hue: '#1a4858', pg: 142, total: 401 },
  { isbn: '9780525559474', title: 'The Midnight Library', author: 'Matt Haig', hue: '#0e3b2a', pg: 78, total: 304 },
];
const ML_TO_READ = [
  { isbn: '9780441013593', title: 'Dune', author: 'Frank Herbert', hue: '#2c1810' },
  { isbn: '9780062060624', title: "The Wise Man's Fear", author: 'Patrick Rothfuss', hue: '#2a1a2a' },
  { isbn: '9781250301697', title: 'Where the Crawdads Sing', author: 'Delia Owens', hue: '#284a2b' },
  { isbn: '9780571334650', title: 'Normal People', author: 'Sally Rooney', hue: '#234a5a' },
];
const ML_COMPLETED = [
  { isbn: '9781501156700', title: 'Educated', author: 'Tara Westover', hue: '#3b2a14', rating: 5, finished: 'Apr 26' },
  { isbn: '9780062315007', title: 'The Alchemist', author: 'Paulo Coelho', hue: '#5a3c1b', rating: 4, finished: 'Apr 10' },
  { isbn: '9780735224292', title: 'Atomic Habits', author: 'James Clear', hue: '#1f3a8a', rating: 3, finished: 'Mar 28' },
];
const ML_DNF = [{ isbn: '9780062060624', title: "The Wise Man's Fear", author: 'Patrick Rothfuss', hue: '#2a1a2a', reason: 'Pacing', pg: 320 }];
const ML_PRIVATE = [
  { isbn: '9780385545990', title: "The Handmaid's Tale", author: 'Margaret Atwood', hue: '#7a1c1c' },
  { isbn: '9780062315007', title: 'The Alchemist', author: 'Paulo Coelho', hue: '#5a3c1b' },
];
const ML_SUGGESTIONS = [
  { isbn: '9780525436140', title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', hue: '#1a4858', from: 'Alex', avatar: 'A', avatarBg: M.clay, note: 'If you liked Normal People — but make it videogames and 30 years long. Trust me.' },
];

function MLStatusBadge({ kind }) {
  const map = { reading: { c: M.clay, l: 'READING' }, private: { c: M.butter, l: 'PRIVATE', dark: true }, dnf: { c: M.ink, l: 'DNF' } };
  const m = map[kind]; if (!m) return null;
  return <div style={{ position: 'absolute', top: 5, left: 5, padding: '2px 7px', backgroundColor: m.c, color: m.dark ? M.ink : '#fff', fontSize: 7, fontWeight: 900, letterSpacing: '0.1em', border: `1.5px solid ${M.ink}`, borderRadius: 4, boxShadow: `1.5px 1.5px 0 ${M.ink}` }}>{m.l}</div>;
}

function MLShelf({ books, kind, showRating, showReason, dark, addLabel = 'Add' }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      {books.map((b, i) => (
        <div key={b.isbn + i} style={{ transform: `rotate(${i % 2 === 0 ? -0.8 : 0.8}deg)` }}>
          <div style={{ position: 'relative' }}>
            <BookCover isbn={b.isbn} title={b.title} author={b.author} hue={b.hue} />
            <MLStatusBadge kind={kind} />
            {kind === 'dnf' && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(26,26,26,0.4)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MStamp rotate={-12} color="#fff" size={9}>DNF</MStamp>
              </div>
            )}
          </div>
          <div style={{ marginTop: 6, fontFamily: 'Fraunces, serif', fontSize: 11, fontWeight: 700, color: dark ? '#fff' : M.ink, lineHeight: 1.1, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>{b.title}</div>
          {showRating && b.rating && <div style={{ marginTop: 4 }}><MStars value={b.rating} size={9} /></div>}
          {showReason && b.reason && <div style={{ marginTop: 4, fontSize: 8, fontWeight: 700, color: M.ink2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{b.reason} · p.{b.pg}</div>}
        </div>
      ))}
      <button style={{ aspectRatio: '2/3', backgroundColor: 'transparent', border: `2px dashed ${dark ? 'rgba(241,199,91,0.5)' : M.ink3}`, borderRadius: 4, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, color: dark ? M.butter : M.ink2 }}>
        <Icon name="plus" size={18} />
        <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{addLabel}</span>
      </button>
    </div>
  );
}

function MLShelfHeader({ num, title, count, color, subtitle, dark }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16, gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 36, fontWeight: 600, color, lineHeight: 0.9 }}>{num}</span>
        <div>
          <MEyebrow color={color}>Shelf</MEyebrow>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 600, color: dark ? '#fff' : M.ink, margin: '3px 0 0', letterSpacing: '-0.025em', lineHeight: 1 }}>{title}</h2>
        </div>
      </div>
      <div style={{ padding: '4px 10px', backgroundColor: dark ? M.butter : M.ink, color: dark ? M.ink : M.bg, border: `2px solid ${M.ink}`, borderRadius: 99, fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{count} books</div>
    </div>
  );
}

function MLReadingHero() {
  const [active, setActive] = React.useState(0);
  const book = ML_READING[active];
  const pct = Math.round((book.pg / book.total) * 100);
  return (
    <div style={{ backgroundColor: M.ocean, color: '#fff', border: `2px solid ${M.ink}`, borderRadius: 18, padding: 20, boxShadow: `6px 6px 0 ${M.clay}`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: `radial-gradient(circle, rgba(241,199,91,0.3) 0%, transparent 70%)` }} />
      <div style={{ position: 'relative', display: 'flex', gap: 16 }}>
        <div style={{ width: 92, flexShrink: 0, transform: 'rotate(-3deg)', filter: `drop-shadow(5px 6px 0 ${M.ink})` }}>
          <BookCover isbn={book.isbn} title={book.title} author={book.author} hue={book.hue} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <MStamp rotate={-2} color={M.butter}>Reading now</MStamp>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 600, color: '#fff', lineHeight: 0.98, margin: '10px 0 4px', letterSpacing: '-0.02em' }}>{book.title}</h2>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>{book.author}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 700, color: M.butter, lineHeight: 1 }}>{pct}%</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>p. {book.pg} of {book.total}</span>
          </div>
          <div style={{ height: 10, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.12)', border: `1.5px solid ${M.ink}`, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: M.butter, transition: 'width 500ms' }} />
          </div>
        </div>
      </div>
      <div style={{ position: 'relative', display: 'flex', gap: 8, marginTop: 14 }}>
        <button style={{ flex: 1, padding: '10px', backgroundColor: M.butter, color: M.ink, fontSize: 10, fontWeight: 800, border: `1.5px solid ${M.ink}`, borderRadius: 99, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, letterSpacing: '0.06em', textTransform: 'uppercase', boxShadow: `2px 2px 0 ${M.clay}` }}><Icon name="plus" size={11} /> Log</button>
        <button style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: '#fff', fontSize: 10, fontWeight: 700, border: `1.5px solid rgba(255,255,255,0.4)`, borderRadius: 99, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}><Icon name="pen" size={11} /> Note</button>
        <button style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: '#fff', fontSize: 10, fontWeight: 700, border: `1.5px solid rgba(255,255,255,0.4)`, borderRadius: 99, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}><Icon name="check" size={11} /> Done</button>
      </div>
      {ML_READING.length > 1 && (
        <div style={{ position: 'relative', marginTop: 14, paddingTop: 12, borderTop: '1.5px dashed rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Also</span>
          {ML_READING.map((b, i) => i !== active && (
            <button key={b.isbn} onClick={() => setActive(i)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 9px', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', color: '#fff', fontSize: 10, fontWeight: 600 }}>
              <div style={{ width: 18 }}><BookCover isbn={b.isbn} title={b.title} author={b.author} hue={b.hue} /></div>
              <span style={{ whiteSpace: 'nowrap' }}>{b.title.split(',')[0]}</span> <Icon name="arrow" size={10} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LibraryMobile() {
  const goal = 30, done = 18, pct = (done / goal) * 100;
  const r = 40, c = 2 * Math.PI * r, dash = (pct / 100) * c;
  const stats = [
    { label: 'Reading', value: 2, color: M.clay },
    { label: 'To Read', value: 4, color: M.ink },
    { label: 'Done', value: 18, color: M.ocean },
    { label: 'DNF', value: 1, color: M.ink3 },
  ];
  return (
    <MScreen tab="library" topBar={<MTopBar title="Library" right={<>
      <div style={{ width: 34, height: 34, borderRadius: 99, border: `2px solid ${M.ink}`, backgroundColor: M.paper, color: M.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="layers" size={14} /></div>
      <div style={{ width: 34, height: 34, borderRadius: 99, backgroundColor: M.clay, color: '#fff', border: `2px solid ${M.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `2px 2px 0 ${M.ink}` }}><Icon name="plus" size={15} /></div>
    </>} />}>
      {/* Page header */}
      <section style={{ padding: '22px 20px 12px' }}>
        <MEyebrow color={M.clay}>Your library</MEyebrow>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 52, fontWeight: 600, lineHeight: 0.9, margin: '12px 0 8px', letterSpacing: '-0.04em', color: M.ink }}>
          Mia's <em style={{ color: M.clay }}>shelf.</em>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: M.ink2, fontWeight: 500 }}>28 books · 4 shelves</span>
          <MStamp rotate={-3} color={M.ink} size={8}>Reader · est. 2024</MStamp>
        </div>
        {/* Search */}
        <div style={{ marginTop: 16, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: M.ink3 }}><Icon name="search" size={15} /></div>
          <input placeholder="Search your library…" style={{ width: '100%', padding: '11px 14px 11px 38px', backgroundColor: M.paper, border: `2px solid ${M.ink}`, borderRadius: 99, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', outline: 'none', color: M.ink, boxShadow: `3px 3px 0 ${M.butter}` }} />
        </div>
      </section>

      {/* Goal + stats */}
      <section style={{ padding: '8px 20px' }}>
        <MCard shadow={M.butter} pad={16} style={{ marginBottom: 12 }}>
          <MEyebrow color={M.clay}>2026 Reading Goal</MEyebrow>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 12 }}>
            <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
              <svg viewBox="0 0 96 96" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="48" cy="48" r={r} fill="none" stroke={M.bg} strokeWidth="9" />
                <circle cx="48" cy="48" r={r} fill="none" stroke={M.clay} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${dash} ${c}`} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 700, color: M.ink, lineHeight: 1 }}>{done}</div>
                <div style={{ fontSize: 8, fontWeight: 700, color: M.ink3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>of {goal}</div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 600, color: M.ink, lineHeight: 1.05, margin: '0 0 6px', letterSpacing: '-0.015em' }}>
                {Math.round(pct)}% there.<br /><em style={{ color: M.clay }}>12 to go.</em>
              </h3>
              <p style={{ fontSize: 11, color: M.ink2, lineHeight: 1.4, margin: 0 }}>2 books ahead of pace. Keep it boring.</p>
              <button style={{ marginTop: 10, fontSize: 9, fontWeight: 800, color: M.ink, background: 'transparent', border: 'none', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 5 }}>Edit goal <Icon name="arrow" size={10} /></button>
            </div>
          </div>
        </MCard>
        <MCard shadow={M.ocean} pad={14}>
          <MEyebrow color={M.ocean}>By the shelf</MEyebrow>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
            {stats.map(s => (
              <div key={s.label} style={{ padding: 10, backgroundColor: M.bg, border: `1.5px solid ${M.ink}`, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 7, fontWeight: 800, color: M.ink, marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: '9px 12px', backgroundColor: M.clay, color: '#fff', border: `1.5px solid ${M.ink}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, fontWeight: 700 }}>
            <Icon name="flame" size={14} />
            <span><strong style={{ fontFamily: 'Fraunces, serif', fontSize: 15, fontWeight: 800, marginRight: 4 }}>14</strong> day streak</span>
            <span style={{ marginLeft: 'auto', fontSize: 8, opacity: 0.85, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Keep going →</span>
          </div>
        </MCard>
      </section>

      {/* Reading hero */}
      <section style={{ padding: '8px 20px' }}><MLReadingHero /></section>

      {/* Suggestions */}
      <section style={{ padding: '12px 20px 4px' }}>
        <MSection eyebrow="From friends" color={M.clay} right={<span style={{ fontSize: 10, color: M.ink2, fontWeight: 600 }}>2 new</span>}>Just for <em style={{ color: M.clay }}>you</em></MSection>
        {ML_SUGGESTIONS.map((s, i) => (
          <MCard key={i} shadow={M.clay} pad={14} style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 60, flexShrink: 0, transform: 'rotate(-2deg)', filter: `drop-shadow(3px 4px 0 ${M.ink})` }}>
              <BookCover isbn={s.isbn} title={s.title} author={s.author} hue={s.hue} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 15, fontWeight: 700, lineHeight: 1.1 }}>{s.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <MAvatar initial={s.avatar} color={s.avatarBg} size={20} />
                <span style={{ fontSize: 10, color: M.ink2 }}><strong style={{ color: M.ink, fontWeight: 800 }}>{s.from}</strong> thinks you'd like this:</span>
              </div>
              <div style={{ marginTop: 8, padding: 9, borderRadius: 8, backgroundColor: M.bg, border: `1.5px solid ${M.ink3}`, fontFamily: 'Fraunces, serif', fontSize: 12, fontStyle: 'italic', lineHeight: 1.4 }}>"{s.note}"</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button style={{ padding: '6px 11px', borderRadius: 99, backgroundColor: M.ink, color: M.bg, fontSize: 9, fontWeight: 800, border: `1.5px solid ${M.ink}`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}><Icon name="plus" size={10} /> To-read</button>
                <button style={{ padding: '6px 11px', borderRadius: 99, backgroundColor: 'transparent', color: M.ink3, fontSize: 9, fontWeight: 600, border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Dismiss</button>
              </div>
            </div>
          </MCard>
        ))}
      </section>

      {/* Shelves */}
      <section style={{ padding: '16px 20px' }}>
        <MLShelfHeader num="I" title="To read" count={ML_TO_READ.length} color={M.clay} />
        <MLShelf books={ML_TO_READ} kind="default" />
      </section>
      <section style={{ padding: '4px 20px' }}>
        <MLShelfHeader num="II" title="Completed" count={ML_COMPLETED.length} color={M.ocean} />
        <MLShelf books={ML_COMPLETED} kind="default" showRating />
      </section>
      <section style={{ padding: '4px 20px' }}>
        <MLShelfHeader num="III" title="Did not finish" count={ML_DNF.length} color={M.ink3} />
        <MLShelf books={ML_DNF} kind="dnf" showReason />
      </section>
      <section style={{ padding: '12px 20px' }}>
        <div style={{ backgroundColor: M.ink, color: '#fff', borderRadius: 18, padding: 20, border: `2px solid ${M.ink}`, boxShadow: `6px 6px 0 ${M.butter}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, background: `radial-gradient(circle, rgba(241,199,91,0.18) 0%, transparent 70%)` }} />
          <div style={{ position: 'relative' }}>
            <MLShelfHeader num="IV" title="Private" count={ML_PRIVATE.length} color={M.butter} dark />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: '-8px 0 14px' }}>Hidden from your feed, stats, and friends.</div>
            <MLShelf books={ML_PRIVATE} kind="private" dark addLabel="Private" />
          </div>
        </div>
      </section>
    </MScreen>
  );
}

window.LibraryMobile = LibraryMobile;
