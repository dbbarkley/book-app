/* ============================================================
   MOBILE · BOOK DETAIL — mirrors BookDetailBold.
   Blurred header, cover + shelf actions, stat cards, friends,
   buddy CTA, description, more-by-author, review, private notes.
   ============================================================ */

const MB_BOOK = {
  isbn: '9780525436140', title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', hue: '#1a4858',
  released: 'July 5, 2022', pages: 401, genre: 'Literary fiction', avgRating: 4.3, ratingCount: 1248,
  description: `On a bitter-cold day, in the December of his junior year at Harvard, Sam Masur exits a subway car and sees, amid the hordes of people on the platform, Sadie Green. He calls her name. A legendary collaboration begins.\n\nSpanning thirty years, from Cambridge to Venice Beach, the novel examines identity, disability, failure, the redemptive possibilities in play, and above all, our need to connect.`,
};
const MB_FRIENDS = [
  { name: 'Alex', avatar: 'A', color: M.clay, status: 'Finished · 5★' },
  { name: 'Priya', avatar: 'P', color: M.ocean, status: 'Reading · p. 247' },
  { name: 'James', avatar: 'J', color: M.butter, dark: true, status: 'Finished · 5★' },
  { name: 'Sam', avatar: 'S', color: M.success, status: 'To-read' },
];
const MB_MORE = [
  { isbn: '9780374110239', title: 'Young Jane Young', year: 2017, hue: '#3a1a2a', rating: 4.1 },
  { isbn: '9780374533557', title: 'The Storied Life of A. J. Fikry', year: 2014, hue: '#5a3c1b', rating: 4.2 },
  { isbn: '9780374110000', title: "All These Things I've Done", year: 2011, hue: '#1a4858', rating: 3.8 },
];
const MB_SHELVES = [
  { id: 'reading', label: 'Currently reading', color: M.clay },
  { id: 'to_read', label: 'Want to read', color: M.ink },
  { id: 'read', label: 'Finished', color: M.ocean },
  { id: 'dnf', label: 'DNF', color: M.ink3 },
  { id: 'private', label: 'Private', color: M.butter, dark: true },
];

function MBShelfActions() {
  const [shelf, setShelf] = React.useState('reading');
  const [open, setOpen] = React.useState(false);
  const [follow, setFollow] = React.useState(true);
  const cur = MB_SHELVES.find(s => s.id === shelf);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button onClick={() => setOpen(o => !o)} style={{ padding: '13px 16px', backgroundColor: cur.color, color: cur.dark ? M.ink : '#fff', fontSize: 12, fontWeight: 800, border: `2px solid ${M.ink}`, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, letterSpacing: '0.05em', textTransform: 'uppercase', boxShadow: `3px 3px 0 ${M.ink}` }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{shelf === 'private' ? <Icon name="lock" size={14} /> : <Icon name="check" size={14} />}{cur.label}</span>
        <Icon name="arrowDown" size={13} style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <div style={{ padding: 8, backgroundColor: M.paper, border: `2px solid ${M.ink}`, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 4, boxShadow: `3px 3px 0 ${M.ink}` }}>
          {MB_SHELVES.map(s => (
            <button key={s.id} onClick={() => { setShelf(s.id); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', backgroundColor: shelf === s.id ? M.bg : 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'left', fontSize: 12, fontWeight: 700, color: M.ink }}>
              <span style={{ width: 11, height: 11, borderRadius: 99, backgroundColor: s.color, border: `1.5px solid ${M.ink}` }} />
              <span style={{ flex: 1 }}>{s.label}</span>
              {shelf === s.id && <Icon name="check" size={12} stroke={M.clay} />}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setFollow(f => !f)} style={{ flex: 1, padding: '10px', backgroundColor: follow ? M.paper : 'transparent', color: M.ink, fontSize: 10, fontWeight: 800, border: `2px solid ${M.ink}`, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{follow ? <><Icon name="check" size={12} /> Following</> : <><Icon name="plus" size={12} /> Follow</>}</button>
        <button style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: M.ink, fontSize: 10, fontWeight: 800, border: `2px solid ${M.ink}`, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, letterSpacing: '0.04em', textTransform: 'uppercase' }}><Icon name="send" size={12} /> Suggest</button>
      </div>
    </div>
  );
}

function MBReviewForm() {
  const [rating, setRating] = React.useState(5);
  const [text, setText] = React.useState('');
  const [saved, setSaved] = React.useState(false);
  return (
    <MCard shadow={M.ocean} pad={16}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
        <MEyebrow color={M.ocean}>Your take</MEyebrow>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 600, color: M.ink, margin: 0, letterSpacing: '-0.02em' }}>Write a review</h3>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        {[1,2,3,4,5].map(i => (
          <button key={i} onClick={() => setRating(i)} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill={i <= rating ? M.clay : 'none'} stroke={M.ink} strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
          </button>
        ))}
        <span style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 700, color: M.clay, marginLeft: 4 }}>{rating}.0</span>
      </div>
      <textarea value={text} onChange={e => { setText(e.target.value); setSaved(false); }} rows={4} placeholder="What did you actually think? Spoilers are okay — hidden by default." style={{ width: '100%', padding: 12, fontFamily: 'Fraunces, serif', fontSize: 14, color: M.ink, lineHeight: 1.5, backgroundColor: M.bg, border: `1.5px solid ${M.ink}`, borderRadius: 10, outline: 'none', resize: 'vertical' }} />
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: M.ink2, fontWeight: 600 }}>
          <input type="checkbox" defaultChecked style={{ accentColor: M.clay, width: 15, height: 15 }} /> Hide spoilers
        </label>
        <button onClick={() => setSaved(true)} disabled={saved} style={{ padding: '10px 18px', backgroundColor: saved ? M.success : M.ink, color: '#fff', fontSize: 11, fontWeight: 800, border: `2px solid ${M.ink}`, borderRadius: 99, cursor: saved ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, letterSpacing: '0.06em', textTransform: 'uppercase', boxShadow: `3px 3px 0 ${M.clay}` }}>
          {saved ? <><Icon name="check" size={12} /> Posted</> : 'Post'}
        </button>
      </div>
    </MCard>
  );
}

function BookDetailMobile() {
  const b = MB_BOOK;
  const statCards = [
    { label: 'Avg rating', big: b.avgRating, sub: `${b.ratingCount.toLocaleString()} ratings`, bg: M.clay, light: true, shadow: M.ink },
    { label: 'In your circle', big: '5', sub: '2 done · 2 reading', bg: M.paper, shadow: M.butter },
    { label: 'Your progress', big: '35%', sub: 'p. 142 / 401', bg: M.paper, shadow: M.success },
  ];
  return (
    <MScreen tab="" topBar={<MTopBar title={b.title.split(',')[0]} showBack right={<div style={{ width: 34, height: 34, borderRadius: 99, border: `2px solid ${M.ink}`, backgroundColor: M.paper, color: M.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="send" size={14} /></div>} />}>
      {/* Blurred band */}
      <div style={{ position: 'relative', height: 130, overflow: 'hidden', borderBottom: `2px solid ${M.ink}` }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 50%, ${b.hue} 0%, rgba(0,0,0,0.6) 90%), linear-gradient(180deg, ${b.hue} 0%, ${M.bg} 100%)`, filter: 'blur(8px)', opacity: 0.85 }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 30%, ${M.bg} 100%)` }} />
        <div style={{ position: 'absolute', top: 12, right: 16, padding: '5px 11px', backgroundColor: 'rgba(26,26,26,0.6)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 99, fontSize: 8, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', backdropFilter: 'blur(8px)' }}>The Catalogue · №047</div>
      </div>

      {/* Dateline */}
      <div style={{ margin: '0 20px', padding: '8px 0', borderTop: `2px solid ${M.ink}`, borderBottom: `2px solid ${M.ink}`, display: 'flex', justifyContent: 'space-between', fontSize: 8.5, fontWeight: 800, color: M.ink, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        <span>{b.genre}</span><span>{b.released}</span><span>{b.pages}p</span>
      </div>

      {/* Cover + title */}
      <section style={{ padding: '18px 20px 8px' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 120, flexShrink: 0, marginTop: -54, transform: 'rotate(-3deg)', filter: `drop-shadow(7px 9px 0 ${M.ink})` }}>
            <BookCover isbn={b.isbn} title={b.title} author={b.author} hue={b.hue} />
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              <MStamp rotate={-3} color={M.clay} size={8}>Featured</MStamp>
              <MStamp rotate={2} color={M.ocean} size={8}>3 finished</MStamp>
            </div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 600, color: M.ink, lineHeight: 0.92, margin: '0 0 8px', letterSpacing: '-0.03em' }}>{b.title}</h1>
            <div style={{ fontSize: 14, fontWeight: 600, color: M.clay, fontStyle: 'italic', fontFamily: 'Fraunces, serif' }}>by {b.author}</div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}><MBShelfActions /></div>
      </section>

      {/* Stat cards */}
      <section style={{ padding: '8px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {statCards.map(s => (
            <div key={s.label} style={{ padding: 12, backgroundColor: s.bg, color: s.light ? '#fff' : M.ink, border: `2px solid ${M.ink}`, borderRadius: 12, boxShadow: `3px 3px 0 ${s.shadow}` }}>
              <div style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: s.light ? 0.85 : 0.6, color: s.light ? '#fff' : M.ink3, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 800, lineHeight: 1, color: s.light ? '#fff' : (s.label === 'Your progress' ? M.success : M.ink) }}>{s.big}</div>
              <div style={{ fontSize: 8, opacity: 0.7, marginTop: 4, color: s.light ? '#fff' : M.ink3 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Friends who have */}
      <section style={{ padding: '12px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
          <MEyebrow color={M.clay}>Your circle</MEyebrow>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 600, color: M.ink, margin: 0, letterSpacing: '-0.02em' }}>Friends who have this</h3>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {MB_FRIENDS.map(f => (
            <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px 5px 5px', backgroundColor: M.paper, border: `1.5px solid ${M.ink}`, borderRadius: 99, boxShadow: `2px 2px 0 ${M.ink}` }}>
              <MAvatar initial={f.avatar} color={f.color} dark={f.dark} size={24} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: M.ink, lineHeight: 1 }}>{f.name}</div>
                <div style={{ fontSize: 8.5, color: M.ink2, marginTop: 1 }}>{f.status}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Buddy CTA */}
      <section style={{ padding: '8px 20px' }}>
        <div style={{ backgroundColor: M.clay, color: '#fff', border: `2px solid ${M.ink}`, borderRadius: 16, padding: 18, boxShadow: `5px 5px 0 ${M.ink}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 160, height: 160, background: `radial-gradient(circle, rgba(241,199,91,0.4) 0%, transparent 70%)` }} />
          <div style={{ position: 'relative' }}>
            <MStamp rotate={-3} color={M.butter}>Reading Buddy</MStamp>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 600, color: '#fff', lineHeight: 1.02, margin: '8px 0 6px', letterSpacing: '-0.02em' }}>Read this <em style={{ color: M.butter }}>with a friend.</em></h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.45, margin: '0 0 12px' }}>Spoiler-safe reactions, shared highlights, synced pace. <strong style={{ color: '#fff' }}>Alex</strong> & <strong style={{ color: '#fff' }}>Priya</strong> can buddy-read again.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, padding: '11px', backgroundColor: M.butter, color: M.ink, fontSize: 10, fontWeight: 800, border: `2px solid ${M.ink}`, borderRadius: 99, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, letterSpacing: '0.06em', textTransform: 'uppercase', boxShadow: `2px 2px 0 ${M.ink}` }}><Icon name="plus" size={11} /> Start session</button>
              <button style={{ flex: 1, padding: '11px', backgroundColor: 'transparent', color: '#fff', fontSize: 10, fontWeight: 800, border: `2px solid rgba(255,255,255,0.4)`, borderRadius: 99, cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Join existing</button>
            </div>
          </div>
        </div>
      </section>

      {/* Description */}
      <section style={{ padding: '12px 20px' }}>
        <MEyebrow color={M.ocean}>What it's about</MEyebrow>
        <div style={{ marginTop: 12, backgroundColor: M.paper, border: `2px solid ${M.ink}`, borderRadius: 14, padding: 18, boxShadow: `4px 4px 0 ${M.ink}`, fontFamily: 'Fraunces, serif', fontSize: 15, color: M.ink, lineHeight: 1.55 }}>
          {b.description.split('\n\n').map((para, i) => (
            <p key={i} style={{ margin: i === 0 ? '0 0 14px' : 0 }}>
              {i === 0 && <span style={{ float: 'left', fontFamily: 'Fraunces, serif', fontSize: 52, fontWeight: 700, color: M.clay, lineHeight: 0.8, paddingRight: 8, paddingTop: 2 }}>{para[0]}</span>}
              {i === 0 ? para.slice(1) : para}
            </p>
          ))}
        </div>
      </section>

      {/* More by author */}
      <section style={{ padding: '8px 0 8px' }}>
        <div style={{ padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
            <MEyebrow color={M.clay}>More</MEyebrow>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 600, color: M.ink, margin: 0, letterSpacing: '-0.02em' }}>By <em style={{ color: M.clay }}>{b.author}</em></h3>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '0 20px 8px', scrollbarWidth: 'none' }}>
          {MB_MORE.map((m, i) => (
            <div key={m.isbn} style={{ width: 100, flexShrink: 0, transform: `rotate(${i % 2 === 0 ? -0.6 : 0.6}deg)` }}>
              <div style={{ filter: `drop-shadow(4px 5px 0 ${M.ink})` }}><BookCover isbn={m.isbn} title={m.title} author={b.author} hue={m.hue} /></div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 12, fontWeight: 700, color: M.ink, lineHeight: 1.1, marginTop: 8, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>{m.title}</div>
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: M.ink3 }}>
                <span>{m.year}</span><span>·</span><Icon name="star" size={9} stroke={M.clay} style={{ fill: M.clay }} /><span style={{ fontWeight: 700, color: M.ink }}>{m.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Review */}
      <section style={{ padding: '8px 20px' }}><MBReviewForm /></section>

      {/* Personal notes */}
      <section style={{ padding: '8px 20px 8px' }}>
        <div style={{ backgroundColor: M.ink, color: '#fff', border: `2px solid ${M.ink}`, borderRadius: 16, padding: 18, boxShadow: `5px 5px 0 ${M.butter}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 160, height: 160, background: `radial-gradient(circle, rgba(241,199,91,0.2) 0%, transparent 70%)` }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <MEyebrow color={M.butter}>Only you</MEyebrow>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 600, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Personal notes</h3>
              <MStamp rotate={-3} color={M.butter} size={8}>Private</MStamp>
            </div>
            <textarea defaultValue="Nora's regrets are too specific to be coincidences — Haig is writing about the cat, isn't he? The library framing as a multiverse is a soft enough metaphor to make the heavy theme stick." rows={5} style={{ width: '100%', padding: 14, fontFamily: 'Fraunces, serif', fontSize: 14, color: '#fff', lineHeight: 1.55, backgroundColor: 'rgba(0,0,0,0.3)', border: `1.5px solid rgba(255,255,255,0.2)`, borderRadius: 10, outline: 'none', resize: 'vertical' }} />
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>saved 2 mins ago</span>
              <button style={{ padding: '9px 16px', backgroundColor: M.butter, color: M.ink, fontSize: 11, fontWeight: 800, border: `2px solid ${M.butter}`, borderRadius: 99, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}><Icon name="check" size={12} /> Saved</button>
            </div>
          </div>
        </div>
      </section>
    </MScreen>
  );
}

window.BookDetailMobile = BookDetailMobile;
