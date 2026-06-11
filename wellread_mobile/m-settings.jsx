/* ============================================================
   MOBILE · SETTINGS — mirrors SettingsBold.
   The Stamp (profile) · Compass (genres+authors) · Hall of Fame
   (Top 10) · Migration (import) · The Ledger (account + sign out).
   ============================================================ */

const MST_GENRES = [
  { id: 'literary', label: 'Literary' }, { id: 'historical', label: 'Historical' }, { id: 'mystery', label: 'Mystery' },
  { id: 'scifi', label: 'Sci-Fi' }, { id: 'fantasy', label: 'Fantasy' }, { id: 'memoir', label: 'Memoir' },
  { id: 'essays', label: 'Essays' }, { id: 'poetry', label: 'Poetry' }, { id: 'philosophy', label: 'Philosophy' },
  { id: 'romance', label: 'Romance' }, { id: 'horror', label: 'Horror' }, { id: 'graphic', label: 'Graphic Novels' },
];
const MST_AUTHORS = ['Gabrielle Zevin', 'Min Jin Lee', 'Kazuo Ishiguro', 'Toni Morrison', 'Sally Rooney', 'Hernan Diaz'];
const MST_TOP10_INIT = [
  { id: 1, title: 'Tomorrow³', author: 'Gabrielle Zevin', isbn: '9780525436140', hue: '#1a4858', rating: 5 },
  { id: 2, title: 'The Midnight Library', author: 'Matt Haig', isbn: '9780525559474', hue: '#0e3b2a', rating: 5 },
  { id: 3, title: 'Pachinko', author: 'Min Jin Lee', isbn: '9781455563937', hue: '#2c1810', rating: 5 },
  { id: 4, title: 'Normal People', author: 'Sally Rooney', isbn: '9780571334650', hue: '#234a5a', rating: 4 },
];

function MSTCard({ n, title, subtitle, shadow, children }) {
  return (
    <div style={{ backgroundColor: M.paper, border: `2.5px solid ${M.ink}`, borderRadius: 16, boxShadow: `6px 6px 0 ${shadow || M.ink}`, overflow: 'hidden', ...mPaperTexture }}>
      <div style={{ padding: '16px 18px 14px', borderBottom: `2px dashed ${M.ink}`, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 40, fontWeight: 700, color: M.clay, lineHeight: 0.9, letterSpacing: '-0.04em', flexShrink: 0 }}>{n}</div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', margin: '2px 0 5px' }}>{title}</h2>
          <p style={{ fontSize: 12, color: M.ink2, lineHeight: 1.4, margin: 0, fontWeight: 500 }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}

const MST_INPUT = { width: '100%', backgroundColor: M.paper, border: `2px solid ${M.ink}`, borderRadius: 10, padding: '11px 13px', fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif', color: M.ink, outline: 'none', boxShadow: `3px 3px 0 ${M.ink}` };

function MSTLabel({ children }) {
  return <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: M.ink2, display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><span style={{ width: 16, height: 2, backgroundColor: M.ink2 }} />{children}</div>;
}

function MSTSave({ children }) {
  return <button style={{ padding: '13px 20px', backgroundColor: M.ink, color: M.paper, border: `2px solid ${M.ink}`, borderRadius: 99, fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: `4px 4px 0 ${M.clay}`, display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'Inter, sans-serif' }}>{children} <Icon name="arrow" size={13} stroke={M.paper} /></button>;
}

function SettingsMobile() {
  const [name, setName] = React.useState('Sam Ortega');
  const [bio, setBio] = React.useState("Reading slowly on purpose. DM me if you also can't shut up about Pachinko.");
  const [genres, setGenres] = React.useState(['literary', 'memoir', 'philosophy', 'essays']);
  const [authors, setAuthors] = React.useState(['Gabrielle Zevin', 'Min Jin Lee', 'Kazuo Ishiguro']);
  const [top10, setTop10] = React.useState(MST_TOP10_INIT);

  const toggleGenre = id => setGenres(g => g.includes(id) ? g.filter(x => x !== id) : [...g, id]);
  const toggleAuthor = a => setAuthors(s => s.includes(a) ? s.filter(x => x !== a) : [...s, a]);
  const move = (idx, dir) => setTop10(t => {
    const j = idx + dir; if (j < 0 || j >= t.length) return t;
    const next = [...t]; [next[idx], next[j]] = [next[j], next[idx]]; return next;
  });
  const remove = id => setTop10(t => t.filter(x => x.id !== id));

  return (
    <MScreen tab="you" topBar={<MTopBar title="Settings" showBack right={<span style={{ fontSize: 12, fontWeight: 800, color: M.ink, fontFamily: 'ui-monospace, monospace' }}>@samortega</span>} />}>
      {/* Header */}
      <section style={{ padding: '20px 20px 8px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, backgroundColor: M.clay, borderRadius: '50%', opacity: 0.9, border: `2px solid ${M.ink}` }} />
        <div style={{ position: 'relative' }}>
          <MStamp rotate={-3} color={M.ink} size={9}>Settings · Maintenance</MStamp>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 48, fontWeight: 600, lineHeight: 0.9, letterSpacing: '-0.04em', margin: '12px 0 10px' }}>Your <em style={{ color: M.clay }}>shelf</em>,<br />your stamp.</h1>
          <p style={{ fontSize: 13, color: M.ink2, lineHeight: 1.5, margin: 0, fontWeight: 500 }}>Who you are on the page, what you read, the ten books on your mantel, and the door to the ledger.</p>
        </div>
      </section>

      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* 01 The Stamp */}
        <MSTCard n="01" title="The Stamp" subtitle="Your face, your name, your bio — visible to other readers." shadow={M.clay}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 90, height: 90, backgroundColor: M.butter, border: `2.5px solid ${M.ink}`, borderRadius: 12, boxShadow: `4px 4px 0 ${M.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, serif', fontSize: 52, fontWeight: 700, color: M.ink, flexShrink: 0 }}>S</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
              <button style={{ padding: '9px 12px', backgroundColor: M.ink, color: M.paper, border: `2px solid ${M.ink}`, borderRadius: 8, cursor: 'pointer', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', boxShadow: `2px 2px 0 ${M.clay}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icon name="arrowDown" size={11} stroke={M.paper} style={{ transform: 'rotate(180deg)' }} /> Change photo</button>
              <div style={{ fontSize: 9, color: M.ink3, lineHeight: 1.4 }}>JPG, PNG or WebP · max 5 MB</div>
            </div>
          </div>
          <MSTLabel>Display name</MSTLabel>
          <input value={name} onChange={e => setName(e.target.value)} style={{ ...MST_INPUT, marginBottom: 14 }} />
          <MSTLabel>Bio · {bio.length}/500</MSTLabel>
          <textarea rows={3} value={bio} onChange={e => setBio(e.target.value.slice(0, 500))} style={{ ...MST_INPUT, resize: 'none', lineHeight: 1.5, fontFamily: 'Fraunces, serif', fontStyle: 'italic', marginBottom: 16 }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><MSTSave>Save profile</MSTSave></div>
        </MSTCard>

        {/* 02 Compass */}
        <MSTCard n="02" title="The Compass" subtitle="What points you toward next reads. Pick liberally." shadow={M.ocean}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <MSTLabel>Favourite genres</MSTLabel>
            <span style={{ fontSize: 11, fontWeight: 800, color: M.clay }}>{genres.length} picked</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
            {MST_GENRES.map(g => {
              const on = genres.includes(g.id);
              return (
                <button key={g.id} onClick={() => toggleGenre(g.id)} style={{ padding: '8px 13px', borderRadius: 99, border: `2px solid ${M.ink}`, backgroundColor: on ? M.ink : M.paper, color: on ? M.paper : M.ink, fontSize: 11, fontWeight: 800, cursor: 'pointer', boxShadow: on ? `3px 3px 0 ${M.clay}` : 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  {on && <Icon name="check" size={11} stroke={M.paper} />}{g.label}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <MSTLabel>Favourite authors</MSTLabel>
            <span style={{ fontSize: 11, fontWeight: 800, color: M.clay }}>{authors.length} picked</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {MST_AUTHORS.map(a => {
              const on = authors.includes(a);
              return (
                <button key={a} onClick={() => toggleAuthor(a)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 10, border: `2px solid ${M.ink}`, backgroundColor: on ? M.clay : M.paper, color: on ? M.paper : M.ink, cursor: 'pointer', boxShadow: `2px 2px 0 ${M.ink}`, textAlign: 'left' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 99, backgroundColor: on ? M.paper : M.butter, color: on ? M.clay : M.ink, border: `1.5px solid ${M.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, serif', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{a.split(' ').slice(-1)[0][0]}</div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a}</span>
                </button>
              );
            })}
          </div>
        </MSTCard>

        {/* 03 Hall of Fame */}
        <MSTCard n="03" title="Hall of Fame" subtitle="Your all-time top ten — in this exact order." shadow={M.butter}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <MSTLabel>The mantel</MSTLabel>
            <span style={{ fontSize: 12, fontWeight: 800 }}><span style={{ fontFamily: 'Fraunces, serif', fontSize: 18, color: M.clay }}>{top10.length}</span><span style={{ color: M.ink3 }}> / 10</span></span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {top10.map((b, idx) => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', backgroundColor: idx === 0 ? M.butter : M.paper, border: `2px solid ${M.ink}`, borderRadius: 10, boxShadow: idx === 0 ? `3px 3px 0 ${M.clay}` : `2px 2px 0 ${M.ink}` }}>
                <div style={{ width: 36, height: 36, backgroundColor: idx === 0 ? M.ink : M.bg, border: `2px solid ${M.ink}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 800, color: idx === 0 ? M.butter : M.ink, flexShrink: 0 }}>{idx + 1}</div>
                <div style={{ width: 28, flexShrink: 0, transform: `rotate(${idx % 2 === 0 ? -2 : 2}deg)`, filter: `drop-shadow(2px 2px 0 ${M.ink})` }}><BookCover isbn={b.isbn} title={b.title} author={b.author} hue={b.hue} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: 14, fontWeight: 700, lineHeight: 1.05, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</div>
                  <div style={{ fontSize: 10, color: M.ink2, marginTop: 1 }}>{b.author}</div>
                </div>
                <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                  {[['arrowDown', -1, true], ['arrowDown', 1, false]].map(([ic, dir, up], i) => (
                    <button key={i} onClick={() => move(idx, dir)} disabled={up ? idx === 0 : idx === top10.length - 1} style={{ width: 26, height: 26, backgroundColor: M.paper, border: `1.5px solid ${M.ink}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: (up ? idx === 0 : idx === top10.length - 1) ? 0.35 : 1, boxShadow: `1.5px 1.5px 0 ${M.ink}` }}>
                      <Icon name="arrowDown" size={11} stroke={M.ink} style={{ transform: up ? 'rotate(180deg)' : 'none' }} />
                    </button>
                  ))}
                  <button onClick={() => remove(b.id)} style={{ width: 26, height: 26, backgroundColor: '#FBEAE5', border: `1.5px solid ${M.red}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `1.5px 1.5px 0 ${M.red}` }}>
                    <Icon name="x" size={11} stroke={M.red} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </MSTCard>

        {/* 04 Migration */}
        <MSTCard n="04" title="The Migration" subtitle="Move your library here — keep the years, ratings, shelves." shadow={M.forest}>
          <div style={{ padding: 16, backgroundColor: M.paper, border: `2px solid ${M.ink}`, borderRadius: 12, boxShadow: `4px 4px 0 ${M.clay}`, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <div style={{ width: 50, height: 50, backgroundColor: M.clay, color: '#fff', border: `2px solid ${M.ink}`, borderRadius: 12, fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `3px 3px 0 ${M.ink}`, flexShrink: 0 }}>G</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Goodreads</div>
                <div style={{ fontSize: 11, color: M.ink2, lineHeight: 1.35 }}>Import your library, ratings & shelves — under a minute.</div>
              </div>
            </div>
            <button style={{ width: '100%', padding: '13px', backgroundColor: M.ink, color: M.paper, border: `2px solid ${M.ink}`, borderRadius: 99, fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: `4px 4px 0 ${M.clay}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Icon name="arrowDown" size={13} stroke={M.paper} /> Start import</button>
          </div>
          <div style={{ padding: 14, backgroundColor: M.paper, border: `2px dashed ${M.ink3}`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14, opacity: 0.7 }}>
            <div style={{ width: 44, height: 44, backgroundColor: M.bg, color: M.ink, border: `2px dashed ${M.ink3}`, borderRadius: 12, fontFamily: 'Fraunces, serif', fontSize: 15, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>SG</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>StoryGraph</div>
              <div style={{ fontSize: 11, color: M.ink2 }}>Import from StoryGraph.</div>
            </div>
            <MStamp rotate={4} color={M.ink3} size={8}>Soon</MStamp>
          </div>
        </MSTCard>

        {/* 05 The Ledger */}
        <MSTCard n="05" title="The Ledger" subtitle="The cold, factual record. Sign out lives here." shadow={M.ink}>
          {[['Username', '@samortega', true], ['Email', 'sam@samortega.email', false], ['Member since', 'September 2024', false], ['Books logged', '147', false, true]].map((row, i, arr) => (
            <div key={row[0]} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < arr.length - 1 ? `1.5px dashed ${M.ink3}` : 'none' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: M.ink2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{row[0]}</div>
              <div style={{ fontSize: row[3] ? 18 : 14, fontWeight: row[2] ? 700 : 600, fontFamily: row[2] ? 'ui-monospace, monospace' : (row[3] ? 'Fraunces, serif' : 'Inter, sans-serif'), color: row[3] ? M.clay : M.ink }}>{row[1]}</div>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: 16, backgroundColor: '#FBEAE5', border: `2px solid ${M.red}`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14, boxShadow: `4px 4px 0 ${M.ink}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 700, color: M.red, letterSpacing: '-0.01em' }}>Sign out</div>
              <div style={{ fontSize: 11, color: M.ink2, marginTop: 3, lineHeight: 1.35 }}>Your shelf, notes, and pact stay safe.</div>
            </div>
            <button style={{ padding: '11px 16px', backgroundColor: M.red, color: '#fff', border: `2px solid ${M.ink}`, borderRadius: 99, fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: `3px 3px 0 ${M.ink}`, flexShrink: 0 }}>Sign out</button>
          </div>
        </MSTCard>

        <div style={{ textAlign: 'center', padding: '12px 0 4px', fontFamily: 'Fraunces, serif', fontSize: 15, fontStyle: 'italic', color: M.ink3 }}>
          That's all the dials. Go read something good. <span style={{ color: M.clay, fontStyle: 'normal' }}>→</span>
        </div>
      </div>
    </MScreen>
  );
}

window.SettingsMobile = SettingsMobile;
