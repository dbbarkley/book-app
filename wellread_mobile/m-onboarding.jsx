/* ============================================================
   MOBILE · ONBOARDING + AUTH
   First-run flow (Welcome → Import → Genres → Authors) with the
   same nav rules as desktop, plus Login + Sign-up. Mirrors
   OnboardingBold + auth-bold.
   ============================================================ */

const MOB_STEPS = [
  { num: '01', title: 'Welcome', accent: 'home', sub: "Let's get your library set up." },
  { num: '02', title: 'Import', accent: 'your books', sub: 'Bring your reading history over in seconds.' },
  { num: '03', title: 'Pick the', accent: 'genres', sub: "We'll use these to personalise — never to profile." },
  { num: '04', title: 'And the', accent: 'authors', sub: 'Add the names that already live on your shelf.' },
];
const MOB_GENRES = [
  { id: 'fiction', name: 'Fiction' }, { id: 'mystery', name: 'Mystery' }, { id: 'romance', name: 'Romance' },
  { id: 'scifi', name: 'Sci-Fi' }, { id: 'fantasy', name: 'Fantasy' }, { id: 'horror', name: 'Horror' },
  { id: 'historical', name: 'Historical' }, { id: 'memoir', name: 'Memoir' }, { id: 'poetry', name: 'Poetry' },
];
const MOB_AUTHORS = [
  { id: 1, name: 'Toni Morrison', bio: 'Nobel laureate, beloved necessity' },
  { id: 2, name: 'Haruki Murakami', bio: 'Japanese, dreamlike and slippery' },
  { id: 3, name: 'Ursula K. Le Guin', bio: 'Earthsea, the Dispossessed, the lot' },
  { id: 4, name: 'Margaret Atwood', bio: 'Canadian, dystopias and poetry' },
  { id: 5, name: 'James Baldwin', bio: 'American, essayist and prophet' },
  { id: 6, name: 'Sally Rooney', bio: 'Irish, millennial novels' },
];

function MOBProgress({ step }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {MOB_STEPS.map((s, i) => {
          const done = i < step, active = i === step;
          return (
            <React.Fragment key={s.num}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0, zIndex: 1 }}>
                <div style={{ width: 34, height: 34, borderRadius: 99, backgroundColor: active ? M.clay : done ? M.ink : M.paper, color: active || done ? '#fff' : M.ink3, border: `2px solid ${M.ink}`, boxShadow: active ? `3px 3px 0 ${M.ink}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>
                  {done ? <Icon name="check" size={14} stroke="#fff" strokeWidth={3} /> : i + 1}
                </div>
                <div style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: active ? M.ink : M.ink3 }}>{['Welcome', 'Import', 'Genres', 'Authors'][i]}</div>
              </div>
              {i < 3 && <div style={{ flex: 1, height: 0, borderTop: `2px ${done ? 'solid' : 'dashed'} ${done ? M.ink : M.ink3}`, marginTop: -12 }} />}
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ marginTop: 12, fontSize: 9.5, fontWeight: 800, color: M.ink2, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
        <span>Chapter {step + 1} of 4</span><span style={{ color: M.ink3 }}>· ~2 min ·</span>
      </div>
    </div>
  );
}

function MOBCard({ step, children, accent = M.clay }) {
  const def = MOB_STEPS[step];
  return (
    <div style={{ backgroundColor: M.paper, border: `2px solid ${M.ink}`, borderRadius: 18, padding: '24px 20px 26px', boxShadow: `7px 7px 0 ${M.ink}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <MStamp rotate={-3} color={accent}>Chapter {def.num}</MStamp>
        <div style={{ flex: 1, height: 0, borderTop: `2px dashed ${M.ink3}` }} />
      </div>
      <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 40, fontWeight: 600, lineHeight: 0.95, letterSpacing: '-0.035em', color: M.ink, margin: '0 0 10px' }}>
        {def.title}{' '}<span style={{ position: 'relative', display: 'inline-block', fontStyle: 'italic', color: accent }}>{def.accent}
          <svg width="100%" height="9" viewBox="0 0 200 9" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, bottom: -1 }}><path d="M2 5 Q 50 1, 100 5 T 198 5" stroke={M.butter} strokeWidth="5" fill="none" strokeLinecap="round" /></svg>
        </span>.
      </h1>
      <p style={{ fontSize: 14, lineHeight: 1.5, color: M.ink2, margin: '0 0 22px', fontWeight: 500 }}>{def.sub}</p>
      {children}
    </div>
  );
}

function MOBWelcome() {
  const items = [
    { icon: 'layers', color: M.ocean, label: 'Import your Goodreads library', sub: 'Books, ratings, shelves — all of it.', n: '01' },
    { icon: 'sparkles', color: M.clay, label: 'Pick the genres you read', sub: "We'll bias toward them, never away from yours.", n: '02' },
    { icon: 'heart', color: M.butter, label: "Tag authors you'd buy in hardcover", sub: "We'll wake you when they publish — once, quietly.", n: '03' },
  ];
  return (
    <MOBCard step={0} accent={M.clay}>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: M.ink2, marginBottom: 10 }}>Here's what we'll ask</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(it => (
          <div key={it.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: 13, backgroundColor: '#fff', border: `2px solid ${M.ink}`, borderRadius: 12, boxShadow: `3px 3px 0 ${M.ink}` }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: it.color, color: '#fff', border: `2px solid ${M.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={it.icon} size={18} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                <span style={{ fontFamily: 'Fraunces, serif', fontSize: 10, fontWeight: 900, fontStyle: 'italic', color: it.color }}>№ {it.n}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: M.ink, letterSpacing: '-0.01em' }}>{it.label}</span>
              </div>
              <div style={{ fontSize: 11.5, color: M.ink2, lineHeight: 1.4, fontWeight: 500 }}>{it.sub}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18, padding: '11px 14px', backgroundColor: M.ink, color: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, fontSize: 11.5, fontWeight: 700 }}>
        <Icon name="noBot" size={16} stroke={M.butter} />
        <span>Nothing here becomes training data. Ever.</span>
      </div>
    </MOBCard>
  );
}

function MOBImport() {
  return (
    <MOBCard step={1} accent={M.ocean}>
      <div style={{ backgroundColor: '#fff', border: `2px solid ${M.ink}`, borderRadius: 14, padding: 18, boxShadow: `5px 5px 0 ${M.clay}`, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: M.butter, color: M.ink, border: `2px solid ${M.ink}`, boxShadow: `3px 3px 0 ${M.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 900, fontStyle: 'italic', flexShrink: 0 }}>g</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.05 }}>Goodreads</div>
            <div style={{ fontSize: 11.5, color: M.ink2, marginTop: 2 }}>Every book, rating, and shelf — under 30 sec.</div>
          </div>
        </div>
        <div style={{ backgroundColor: M.bg, border: `2px solid ${M.ink}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: M.clay, marginBottom: 10 }}>How it works</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {['Goodreads → My Books → Import/Export', "Hit 'Export library' — they email a CSV", 'Drop the CSV here — we read it locally, then delete it'].map((line, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                <span style={{ width: 22, height: 22, borderRadius: 99, flexShrink: 0, backgroundColor: M.ink, color: '#fff', border: `2px solid ${M.ink}`, fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                <div style={{ fontSize: 12, color: M.ink, fontWeight: 600, lineHeight: 1.4 }}>{line}</div>
              </div>
            ))}
          </div>
        </div>
        <button style={{ width: '100%', padding: '16px', backgroundColor: M.ink, color: '#fff', border: `2px solid ${M.ink}`, borderRadius: 12, cursor: 'pointer', fontSize: 13, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: `4px 4px 0 ${M.clay}` }}><Icon name="arrowDown" size={16} /> Drop your CSV</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', backgroundColor: M.paper, border: `2px solid ${M.ink}`, borderRadius: 10, fontSize: 11.5, color: M.ink2, lineHeight: 1.45, fontWeight: 500 }}>
        <Icon name="lock" size={16} stroke={M.clay} />
        <span><strong style={{ color: M.ink, fontWeight: 800 }}>No Goodreads?</strong> Hit <em>Skip for now</em> below.</span>
      </div>
    </MOBCard>
  );
}

function MOBGenres({ selected, toggle }) {
  return (
    <MOBCard step={2} accent={M.clay}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: M.ink2 }}>Pick three or more</div>
        <div style={{ padding: '5px 11px', borderRadius: 99, backgroundColor: selected.length >= 3 ? M.success : selected.length ? M.butter : M.paper, color: selected.length >= 3 ? '#fff' : M.ink, border: `1.5px solid ${M.ink}`, fontSize: 10, fontWeight: 900, boxShadow: `2px 2px 0 ${M.ink}` }}>{selected.length} picked</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        {MOB_GENRES.map(g => {
          const on = selected.includes(g.id);
          return (
            <button key={g.id} onClick={() => toggle(g.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', backgroundColor: on ? M.ink : '#fff', color: on ? '#fff' : M.ink, border: `2px solid ${M.ink}`, borderRadius: 10, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: on ? `3px 3px 0 ${M.clay}` : `3px 3px 0 ${M.ink}` }}>
              <span style={{ fontSize: 13, fontWeight: 800 }}>{g.name}</span>
              <span style={{ width: 16, height: 16, borderRadius: 99, backgroundColor: on ? M.clay : 'transparent', border: `1.5px solid ${on ? M.clay : M.ink3}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{on && <Icon name="check" size={9} stroke="#fff" strokeWidth={3} />}</span>
            </button>
          );
        })}
      </div>
    </MOBCard>
  );
}

function MOBAuthors({ selected, toggle }) {
  const sel = MOB_AUTHORS.filter(a => selected.includes(a.id));
  const rest = MOB_AUTHORS.filter(a => !selected.includes(a.id));
  return (
    <MOBCard step={3} accent={M.ocean}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: M.ink2 }}>Names that ring a bell</div>
        <div style={{ padding: '5px 11px', borderRadius: 99, backgroundColor: selected.length ? M.ocean : M.paper, color: selected.length ? '#fff' : M.ink, border: `1.5px solid ${M.ink}`, fontSize: 10, fontWeight: 900, boxShadow: `2px 2px 0 ${M.ink}` }}>{selected.length} picked</div>
      </div>
      {sel.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, padding: 12, backgroundColor: M.bg, border: `2px dashed ${M.ink3}`, borderRadius: 10, marginBottom: 12 }}>
          {sel.map(a => (
            <button key={a.id} onClick={() => toggle(a.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 7px 6px 12px', backgroundColor: M.ink, color: '#fff', border: `2px solid ${M.ink}`, borderRadius: 99, cursor: 'pointer', fontSize: 11, fontWeight: 700, boxShadow: `2px 2px 0 ${M.clay}` }}>
              {a.name} <span style={{ width: 16, height: 16, borderRadius: 99, backgroundColor: M.clay, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${M.ink}` }}><Icon name="x" size={9} strokeWidth={3} /></span>
            </button>
          ))}
        </div>
      )}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: M.ink2 }}><Icon name="search" size={15} /></div>
        <input placeholder="Type a name — Atwood, Murakami…" style={{ width: '100%', padding: '12px 14px 12px 40px', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: M.ink, backgroundColor: '#fff', border: `2px solid ${M.ink}`, borderRadius: 10, outline: 'none', boxShadow: `3px 3px 0 ${M.ink}` }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rest.map((a, i) => (
          <button key={a.id} onClick={() => toggle(a.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', backgroundColor: '#fff', border: `2px solid ${M.ink}`, borderRadius: 10, cursor: 'pointer', textAlign: 'left', boxShadow: `3px 3px 0 ${M.ink}` }}>
            <div style={{ width: 34, height: 34, borderRadius: 99, backgroundColor: [M.clay, M.ocean, M.butter, M.success][i % 4], color: i % 4 === 2 ? M.ink : '#fff', border: `2px solid ${M.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, serif', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{a.name.split(' ').map(p => p[0]).join('').slice(0, 2)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 14, fontWeight: 700, color: M.ink, lineHeight: 1.1 }}>{a.name}</div>
              <div style={{ fontSize: 10.5, color: M.ink3, marginTop: 1 }}>{a.bio}</div>
            </div>
            <div style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: M.bg, color: M.ink, border: `1.5px solid ${M.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="plus" size={13} /></div>
          </button>
        ))}
      </div>
    </MOBCard>
  );
}

function OnboardingMobile() {
  const [step, setStep] = React.useState(0);
  const [genres, setGenres] = React.useState(['fiction', 'mystery', 'scifi']);
  const [authors, setAuthors] = React.useState([1, 3]);
  const toggleG = id => setGenres(g => g.includes(id) ? g.filter(x => x !== id) : [...g, id]);
  const toggleA = id => setAuthors(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id]);
  const nextDisabled = (step === 2 && !genres.length) || (step === 3 && !authors.length);
  const isLast = step === 3, isImport = step === 1;
  const label = isLast ? 'Finish setup' : isImport ? 'Skip for now' : 'Continue';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: M.bg, color: M.ink, fontFamily: 'Inter, system-ui, sans-serif', position: 'relative', overflow: 'hidden', ...mPaperTexture }}>
      {/* decorative */}
      <div style={{ position: 'absolute', top: -90, right: -90, width: 240, height: 240, borderRadius: '50%', backgroundColor: M.clay, opacity: 0.9, border: `2px solid ${M.ink}` }} />
      <div style={{ position: 'absolute', bottom: -100, left: -100, width: 220, height: 220, borderRadius: '50%', backgroundColor: M.ocean, opacity: 0.85, border: `2px solid ${M.ink}` }} />
      {/* nav */}
      <div style={{ flexShrink: 0, paddingTop: 54, backgroundColor: M.paper, borderBottom: `2px solid ${M.ink}`, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 12px' }}>
          <MBrand />
          <a style={{ fontSize: 10, fontWeight: 800, color: M.ink, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'underline', textDecorationColor: M.clay, textDecorationThickness: 2, textUnderlineOffset: 3, cursor: 'pointer' }}>Log out</a>
        </div>
      </div>
      {/* step picker (preview helper) */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 6, padding: '10px 16px', backgroundColor: M.ink, alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none', position: 'relative', zIndex: 2 }}>
        <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: M.butter, flexShrink: 0 }}>Preview →</span>
        {MOB_STEPS.map((s, i) => (
          <button key={i} onClick={() => setStep(i)} style={{ padding: '5px 10px', borderRadius: 99, backgroundColor: step === i ? M.clay : 'transparent', color: '#fff', border: `1.5px solid ${step === i ? M.clay : 'rgba(255,255,255,0.35)'}`, cursor: 'pointer', fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>{['Welcome', 'Import', 'Genres', 'Authors'][i]}</button>
        ))}
      </div>
      {/* body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', position: 'relative', zIndex: 1 }}>
        <MOBProgress step={step} />
        {step === 0 && <MOBWelcome />}
        {step === 1 && <MOBImport />}
        {step === 2 && <MOBGenres selected={genres} toggle={toggleG} />}
        {step === 3 && <MOBAuthors selected={authors} toggle={toggleA} />}
        {/* footer nav */}
        <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 12 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{ padding: '13px 18px', backgroundColor: 'transparent', color: M.ink, border: `2px solid ${M.ink}`, borderRadius: 99, cursor: 'pointer', fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 7 }}><Icon name="arrow" size={13} style={{ transform: 'rotate(180deg)' }} /> Back</button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={() => setStep(s => Math.min(3, s + 1))} disabled={nextDisabled} style={{ padding: '14px 22px', backgroundColor: nextDisabled ? M.ink3 : M.clay, color: '#fff', border: `2px solid ${M.ink}`, borderRadius: 99, cursor: nextDisabled ? 'not-allowed' : 'pointer', fontWeight: 900, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 9, boxShadow: nextDisabled ? 'none' : `5px 5px 0 ${M.ink}`, opacity: nextDisabled ? 0.7 : 1 }}>
            {label} <Icon name={isLast ? 'check' : 'arrow'} size={14} />
          </button>
        </div>
        <div style={{ marginTop: 24, textAlign: 'center', fontFamily: 'Fraunces, serif', fontSize: 12, fontStyle: 'italic', color: M.ink3, fontWeight: 500 }}>
          Change every answer later in <strong style={{ color: M.ink, fontStyle: 'normal', fontWeight: 800 }}>Settings</strong>.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────
function MAuthInput({ label, type = 'text', placeholder, icon, dark }) {
  const c = dark ? '#fff' : M.ink, sub = dark ? 'rgba(255,255,255,0.6)' : M.ink2;
  const fieldBg = dark ? 'rgba(255,255,255,0.06)' : '#fff';
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 9.5, fontWeight: 800, color: c, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 7 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: fieldBg, border: `2px solid ${dark ? '#fff' : M.ink}`, borderRadius: 8, boxShadow: `3px 3px 0 ${dark ? M.clay : M.ink}` }}>
        {icon && <span style={{ paddingLeft: 13, color: sub, display: 'flex' }}><Icon name={icon} size={15} stroke={sub} /></span>}
        <input type={type} placeholder={placeholder} style={{ flex: 1, padding: `13px ${icon ? 11 : 14}px`, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: c, backgroundColor: 'transparent', border: 'none', outline: 'none', width: '100%' }} />
      </div>
    </label>
  );
}

function MAuthSocial({ provider, badgeColor, badgeText, italic, dark }) {
  return (
    <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11, padding: '13px', backgroundColor: dark ? 'rgba(255,255,255,0.06)' : '#fff', color: dark ? '#fff' : M.ink, border: `2px solid ${dark ? '#fff' : M.ink}`, borderRadius: 10, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', boxShadow: `3px 3px 0 ${dark ? M.clay : M.ink}` }}>
      <span style={{ width: 24, height: 24, borderRadius: 99, backgroundColor: badgeColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: italic ? 'Fraunces, serif' : 'Inter, sans-serif', fontWeight: 900, fontStyle: italic ? 'italic' : 'normal', fontSize: 14, border: `1.5px solid ${M.ink}`, flexShrink: 0 }}>{badgeText}</span>
      Continue with {provider}
    </button>
  );
}

function AuthScreen({ dark, eyebrow, title, accent, subtitle, fields, cta, footer, agree }) {
  const c = dark ? '#fff' : M.ink, sub = dark ? 'rgba(255,255,255,0.65)' : M.ink2;
  const bg = dark ? M.ink : M.bg;
  return (
    <div style={{ height: '100%', overflowY: 'auto', backgroundColor: bg, color: c, fontFamily: 'Inter, system-ui, sans-serif', position: 'relative', ...mPaperTexture }}>
      {/* hero band */}
      <div style={{ position: 'relative', paddingTop: 64, padding: '64px 24px 28px', borderBottom: `2px solid ${dark ? '#fff' : M.ink}`, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: '50%', backgroundColor: M.clay, border: `2px solid ${M.ink}`, opacity: dark ? 0.5 : 0.95 }} />
        <div style={{ position: 'relative' }}>
          <MBrand />
          <div style={{ marginTop: 16 }}><MStamp rotate={-3} color={dark ? '#fff' : M.ink}>No bots · No AI · No nonsense</MStamp></div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 600, lineHeight: 0.98, letterSpacing: '-0.03em', color: c, marginTop: 18 }}>
            The library you'd build if you didn't have to <span style={{ fontStyle: 'italic', color: M.clay }}>perform</span> on it.
          </div>
        </div>
      </div>
      {/* form */}
      <div style={{ padding: '24px 24px 36px' }}>
        <MStamp rotate={-5} color={M.clay}>{eyebrow}</MStamp>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 42, fontWeight: 600, lineHeight: 0.96, letterSpacing: '-0.035em', color: c, margin: '16px 0 10px' }}>
          {title} <span style={{ fontStyle: 'italic', color: M.clay }}>{accent}</span>
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.5, color: sub, margin: '0 0 22px', fontWeight: 500 }}>{subtitle}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          <MAuthSocial provider="Google" badgeColor={M.butter} badgeText="G" dark={dark} />
          <MAuthSocial provider="Facebook" badgeColor={M.ocean} badgeText="f" italic dark={dark} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 16px' }}>
          <div style={{ flex: 1, height: 2, backgroundColor: dark ? '#fff' : M.ink }} />
          <span style={{ fontFamily: 'Fraunces, serif', fontSize: 13, fontStyle: 'italic', color: sub, fontWeight: 500 }}>or with email</span>
          <div style={{ flex: 1, height: 2, backgroundColor: dark ? '#fff' : M.ink }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {fields.map((f, i) => <MAuthInput key={i} {...f} dark={dark} />)}
        </div>
        {agree && (
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 11.5, lineHeight: 1.5, color: sub, fontWeight: 500, marginTop: 14 }}>
            <span style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1, backgroundColor: M.ink, border: `2px solid ${dark ? '#fff' : M.ink}`, boxShadow: `2px 2px 0 ${dark ? M.clay : M.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={11} stroke={M.butter} strokeWidth={3} /></span>
            <span>I've read the <strong style={{ color: c }}>manifesto</strong> and agree to the <strong style={{ color: c }}>terms</strong>. No data sold, no models trained.</span>
          </label>
        )}
        <button style={{ width: '100%', marginTop: 18, padding: '17px', backgroundColor: M.clay, color: '#fff', border: `2px solid ${dark ? '#fff' : M.ink}`, borderRadius: 99, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, boxShadow: `5px 5px 0 ${dark ? '#fff' : M.ink}` }}>{cta} <Icon name="arrow" size={15} /></button>
        <div style={{ marginTop: 22, paddingTop: 18, borderTop: `2px dashed ${dark ? 'rgba(255,255,255,0.3)' : M.ink3}`, fontSize: 12.5, color: sub, fontWeight: 600, textAlign: 'center' }}>{footer}</div>
      </div>
    </div>
  );
}

function LoginMobile() {
  return <AuthScreen eyebrow="Welcome back, reader" title="Pick up" accent="where you left off."
    subtitle="Your shelf is exactly as you left it. No new notifications — we don't send them."
    fields={[{ label: 'Email', type: 'email', placeholder: 'you@somewhere.real' }, { label: 'Password', type: 'password', placeholder: '••••••••••', icon: 'lock' }]}
    cta="Log in" footer={<>New to Libraio? <a style={{ color: M.ink, fontWeight: 800, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: M.clay, textDecorationThickness: 2, textUnderlineOffset: 3 }}>Claim your shelf →</a></>} />;
}

function SignUpMobile() {
  return <AuthScreen dark eyebrow="Claim your shelf" title="Start a" accent="reading life."
    subtitle="One account. A private shelf. Nothing trained on your reading habits — we wouldn't even know how."
    fields={[{ label: 'Your name', placeholder: 'What should we call you?' }, { label: 'Email', type: 'email', placeholder: 'you@somewhere.real' }, { label: 'Choose a password', type: 'password', placeholder: 'at least 8 characters', icon: 'lock' }]}
    agree cta="Start reading" footer={<>Already reading with us? <a style={{ color: '#fff', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: M.clay, textDecorationThickness: 2, textUnderlineOffset: 3 }}>Log in →</a></>} />;
}

window.OnboardingMobile = OnboardingMobile;
window.LoginMobile = LoginMobile;
window.SignUpMobile = SignUpMobile;
