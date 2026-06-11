/* ============================================================
   MOBILE · HOME — the "what's happening" app screen.
   Greeting + continue-reading, Up Next rail, friend activity
   feed, letters. Mirrors HomeBold. Tab: home.
   ============================================================ */

const MH_READING = { isbn: '9780525436140', title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', hue: '#1a4858', pg: 142, total: 401, lastRead: '2 days ago' };

const MH_UP_NEXT = [
  { isbn: '9780441013593', title: 'Dune', author: 'Frank Herbert', hue: '#2c1810', note: 'Re-read before Part 3' },
  { isbn: '9780062073488', title: 'And Then There Were None', author: 'Agatha Christie', hue: '#3a2018', note: 'Charity-shop find' },
  { isbn: '9781250301697', title: 'Where the Crawdads Sing', author: 'Delia Owens', hue: '#284a2b', note: 'From Priya, May 02' },
];

const MH_ACTIVITY = [
  { sep: 'Today', count: 2 },
  { kind: 'finished', who: 'Alex', avatar: 'A', color: M.clay, book: { isbn: '9781501156700', title: 'Educated', author: 'Tara Westover', hue: '#3b2a14' }, rating: 5, note: "One of those reads where you put it down for a week because you can't handle finishing it.", when: '4h ago' },
  { kind: 'highlight', who: 'Priya', avatar: 'P', color: M.ocean, book: { isbn: '9780525436140', title: 'Tomorrow³', author: 'Gabrielle Zevin', hue: '#1a4858' }, passage: 'What is a game? It is tomorrow, and tomorrow, and tomorrow.', page: 247, when: '6h ago' },
  { sep: 'This week', count: 2 },
  { kind: 'suggested', who: 'Sam', avatar: 'S', color: M.ocean, book: { isbn: '9780062315007', title: 'The Alchemist', author: 'Paulo Coelho', hue: '#5a3c1b' }, to: 'you', note: "You'll either love this or want to throw it.", when: '2d ago' },
  { kind: 'dnf', who: 'Priya', avatar: 'P', color: M.ocean, book: { isbn: '9780062060624', title: "The Wise Man's Fear", author: 'Patrick Rothfuss', hue: '#2a1a2a' }, reason: 'Pacing', page: 412, when: '5d ago' },
];

function MHActivityCard({ e }) {
  const k = e.kind;
  const verb = { finished: 'finished', highlight: 'highlighted', suggested: 'suggested', dnf: 'put down' }[k];
  return (
    <MCard shadow={M.ink} pad={14} style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <MAvatar initial={e.avatar} color={e.color} size={32} />
        <div style={{ fontSize: 12, color: M.ink2, lineHeight: 1.35, flex: 1 }}>
          <strong style={{ color: M.ink, fontWeight: 800 }}>{e.who}</strong> {verb}{' '}
          <strong style={{ color: M.ink, fontWeight: 700, fontStyle: 'italic', fontFamily: 'Fraunces, serif' }}>{e.book.title}</strong>
          {k === 'suggested' && <> to <strong style={{ color: M.clay }}>{e.to}</strong></>}
        </div>
        <span style={{ fontSize: 9, color: M.ink3, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0 }}>{e.when}</span>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 48, flexShrink: 0, transform: 'rotate(-2deg)', filter: `drop-shadow(3px 4px 0 ${M.ink})` }}>
          <BookCover isbn={e.book.isbn} title={e.book.title} author={e.book.author} hue={e.book.hue} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {k === 'finished' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <MStars value={e.rating} size={10} />
                <MStamp rotate={-4} color={M.success} size={8} fill>FINISHED</MStamp>
              </div>
              <div style={{ fontSize: 12, fontStyle: 'italic', fontFamily: 'Fraunces, serif', lineHeight: 1.45, padding: 10, borderRadius: 8, backgroundColor: M.bg, border: `1.5px dashed ${M.ink3}` }}>"{e.note}"</div>
            </>
          )}
          {k === 'highlight' && (
            <div style={{ fontSize: 13, fontStyle: 'italic', fontFamily: 'Fraunces, serif', lineHeight: 1.45, padding: '14px 12px 12px', borderRadius: 8, backgroundColor: M.butter, border: `1.5px solid ${M.ink}`, position: 'relative' }}>
              <span style={{ position: 'absolute', top: -8, left: 8, padding: '2px 7px', backgroundColor: M.ink, color: M.butter, fontSize: 8, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 4 }}>Highlight · p. {e.page}</span>
              "{e.passage}"
            </div>
          )}
          {k === 'suggested' && (
            <div style={{ fontSize: 12, fontStyle: 'italic', fontFamily: 'Fraunces, serif', lineHeight: 1.45, padding: 10, borderRadius: 8, backgroundColor: M.clay, color: '#fff', border: `1.5px solid ${M.ink}` }}>"{e.note}"</div>
          )}
          {k === 'dnf' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <MStamp rotate={-3} color={M.ink} size={8} fill>DNF</MStamp>
              <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 99, backgroundColor: M.ink, color: '#fff', fontWeight: 700 }}>{e.reason}</span>
              <span style={{ fontSize: 10, color: M.ink3 }}>at p. {e.page}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {['heart', 'message'].map((ic, i) => (
              <button key={ic} style={{ padding: '5px 10px', borderRadius: 99, backgroundColor: 'transparent', color: M.ink, fontSize: 9, fontWeight: 800, border: `1.5px solid ${M.ink3}`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                <Icon name={ic} size={10} /> {i === 0 ? 'Cheer' : 'Reply'}
              </button>
            ))}
            {(k === 'finished' || k === 'highlight' || k === 'suggested') && (
              <button style={{ padding: '5px 10px', borderRadius: 99, backgroundColor: M.ink, color: M.bg, fontSize: 9, fontWeight: 800, border: `1.5px solid ${M.ink}`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                <Icon name="plus" size={10} /> To-read
              </button>
            )}
          </div>
        </div>
      </div>
    </MCard>
  );
}

function HomeMobile() {
  const pct = Math.round((MH_READING.pg / MH_READING.total) * 100);
  return (
    <MScreen tab="home" topBar={<MTopBar />}>
      {/* Greeting */}
      <section style={{ padding: '22px 20px 8px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: M.ink3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Friday, May 15 · Quiet afternoon</div>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 46, fontWeight: 600, color: M.ink, lineHeight: 0.9, margin: '0 0 14px', letterSpacing: '-0.04em' }}>
          Hello again,<br /><em style={{ color: M.clay }}>Mia.</em>
        </h1>
        <p style={{ fontSize: 14, color: M.ink2, lineHeight: 1.5, fontWeight: 500, margin: '0 0 16px' }}>
          You're <strong style={{ color: M.ink }}>14 days deep</strong> on Tomorrow³. Alex finished it last night and they're <em style={{ fontStyle: 'italic' }}>vibrating</em> to talk about it.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[['flame', M.clay, '14 day streak'], ['clock', M.ocean, '~18 min today'], ['book', M.ink, '18 of 30 books']].map(([ic, c, t]) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name={ic} size={14} stroke={c} />
              <span style={{ fontSize: 12, fontWeight: 700, color: M.ink }}>{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Continue reading */}
      <section style={{ padding: '14px 20px' }}>
        <div style={{ backgroundColor: M.ocean, color: '#fff', border: `2px solid ${M.ink}`, borderRadius: 18, padding: 18, boxShadow: `6px 6px 0 ${M.clay}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: `radial-gradient(circle, rgba(241,199,91,0.25) 0%, transparent 70%)` }} />
          <div style={{ position: 'relative', display: 'flex', gap: 16 }}>
            <div style={{ width: 84, flexShrink: 0, transform: 'rotate(-3deg)', filter: `drop-shadow(4px 5px 0 ${M.ink})` }}>
              <BookCover isbn={MH_READING.isbn} title={MH_READING.title} author={MH_READING.author} hue={MH_READING.hue} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <MStamp rotate={-3} color={M.butter}>Pick up where you left off</MStamp>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 600, color: '#fff', lineHeight: 1.05, margin: '8px 0 2px', letterSpacing: '-0.02em' }}>{MH_READING.title}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>{MH_READING.author}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, color: M.butter, lineHeight: 1 }}>{pct}%</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>p. {MH_READING.pg} / {MH_READING.total}</span>
              </div>
              <div style={{ height: 8, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.12)', border: `1.5px solid ${M.ink}`, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', backgroundColor: M.butter }} />
              </div>
            </div>
          </div>
          <div style={{ position: 'relative', display: 'flex', gap: 8, marginTop: 14 }}>
            <button style={{ flex: 1, padding: '10px', backgroundColor: M.butter, color: M.ink, fontSize: 10, fontWeight: 800, border: `1.5px solid ${M.ink}`, borderRadius: 99, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, letterSpacing: '0.06em', textTransform: 'uppercase', boxShadow: `2px 2px 0 ${M.clay}` }}>
              <Icon name="plus" size={11} /> Log session
            </button>
            <button style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: '#fff', fontSize: 10, fontWeight: 700, border: `1.5px solid rgba(255,255,255,0.35)`, borderRadius: 99, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <Icon name="pen" size={11} /> New note
            </button>
          </div>
        </div>
      </section>

      {/* Up Next */}
      <section style={{ padding: '14px 0 14px' }}>
        <div style={{ padding: '0 20px' }}>
          <MSection eyebrow="Up next" color={M.clay} right={<a style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: M.ink, display: 'inline-flex', alignItems: 'center', gap: 4 }}>All (5) <Icon name="arrow" size={11} /></a>}>From your <em style={{ color: M.clay }}>to-read</em></MSection>
        </div>
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '4px 20px 8px', scrollbarWidth: 'none' }}>
          {MH_UP_NEXT.map((b, i) => (
            <MCard key={b.isbn} shadow={[M.clay, M.ocean, M.butter][i]} pad={14} style={{ width: 200, flexShrink: 0, transform: `rotate(${i % 2 === 0 ? -0.5 : 0.5}deg)`, display: 'flex', gap: 12 }}>
              <div style={{ width: 56, flexShrink: 0, transform: 'rotate(-2deg)', filter: `drop-shadow(3px 4px 0 ${M.ink})` }}>
                <BookCover isbn={b.isbn} title={b.title} author={b.author} hue={b.hue} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 14, fontWeight: 700, lineHeight: 1.1 }}>{b.title}</div>
                <div style={{ fontSize: 9, color: M.ink3, marginTop: 2 }}>{b.author}</div>
                <div style={{ marginTop: 6, fontSize: 10, color: M.ink2, fontStyle: 'italic', fontFamily: 'Fraunces, serif', lineHeight: 1.35 }}>"{b.note}"</div>
                <button style={{ marginTop: 10, padding: '5px 9px', backgroundColor: M.ink, color: M.bg, fontSize: 9, fontWeight: 800, border: `1.5px solid ${M.ink}`, borderRadius: 99, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  <Icon name="book" size={10} /> Start
                </button>
              </div>
            </MCard>
          ))}
        </div>
      </section>

      {/* Activity feed */}
      <section style={{ padding: '8px 20px 8px' }}>
        <MSection eyebrow="The feed" color={M.ocean}>What your <em style={{ color: M.ocean }}>friends</em> read</MSection>
        {MH_ACTIVITY.map((e, i) => e.sep ? (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 12px' }}>
            <span style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 20, fontWeight: 600, color: M.ink, lineHeight: 1 }}>{e.sep}.</span>
            <div style={{ flex: 1, height: 2, backgroundImage: `repeating-linear-gradient(90deg, ${M.ink} 0 6px, transparent 6px 10px)` }} />
            <span style={{ fontSize: 9, fontWeight: 800, color: M.ink3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{e.count} updates</span>
          </div>
        ) : <MHActivityCard key={i} e={e} />)}
      </section>

      {/* Letters */}
      <section style={{ padding: '4px 20px 12px' }}>
        <MCard shadow={M.clay} pad={16}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <MEyebrow color={M.clay}>Letters</MEyebrow>
            <span style={{ fontSize: 8, fontWeight: 800, color: '#fff', backgroundColor: M.clay, padding: '3px 8px', borderRadius: 99, border: `1.5px solid ${M.ink}`, letterSpacing: '0.08em' }}>3 NEW</span>
          </div>
          <div style={{ padding: 12, backgroundColor: M.bg, border: `1.5px solid ${M.ink}`, borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <MAvatar initial="A" color={M.clay} size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 8, fontWeight: 800, color: M.clay, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Buddy invite · 2h</div>
              <div style={{ fontSize: 12, color: M.ink, lineHeight: 1.35 }}><strong style={{ fontWeight: 800 }}>Alex</strong> wants to buddy-read <em style={{ fontFamily: 'Fraunces, serif', fontWeight: 700 }}>Educated</em>.</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button style={{ padding: '5px 11px', borderRadius: 99, backgroundColor: M.ink, color: M.bg, fontSize: 9, fontWeight: 800, border: `1.5px solid ${M.ink}`, cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Accept</button>
                <button style={{ padding: '5px 11px', borderRadius: 99, backgroundColor: 'transparent', color: M.ink, fontSize: 9, fontWeight: 700, border: `1.5px solid ${M.ink3}`, cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Later</button>
              </div>
            </div>
          </div>
        </MCard>
      </section>
    </MScreen>
  );
}

window.HomeMobile = HomeMobile;
