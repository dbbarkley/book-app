/* ============================================================
   MOBILE · BOTTOM-SHEET MODALS
   Log Progress · Reading Goal · Add Highlight — each slides up
   over a dimmed app screen. Mirrors the desktop modals' feature
   sets, reframed as native bottom sheets.
   ============================================================ */

const MSHEET_INPUT = { width: '100%', backgroundColor: M.paper, border: `2px solid ${M.ink}`, borderRadius: 8, padding: '10px 12px', fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: M.ink, outline: 'none', boxShadow: `3px 3px 0 ${M.ink}` };

function MSheetLabel({ children, color = M.ink2 }) {
  return <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color, display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 9 }}><span style={{ width: 16, height: 2, backgroundColor: color }} />{children}</div>;
}

// Dimmed app backdrop behind a sheet — light, static.
function ModalHost({ children, behindTitle = 'Library' }) {
  return (
    <div style={{ height: '100%', position: 'relative', backgroundColor: M.bg, overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif', ...mPaperTexture }}>
      {/* faux app behind */}
      <div style={{ paddingTop: 54, backgroundColor: M.paper, borderBottom: `2px solid ${M.ink}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 12px' }}>
          <MBrand />
          <MAvatar initial="M" size={34} />
        </div>
      </div>
      <div style={{ padding: 20, opacity: 0.5 }}>
        <div style={{ height: 160, borderRadius: 16, backgroundColor: M.ocean, border: `2px solid ${M.ink}`, marginBottom: 16 }} />
        <div style={{ height: 120, borderRadius: 14, backgroundColor: M.paper, border: `2px solid ${M.ink}` }} />
      </div>
      {children}
    </div>
  );
}

function MSheetHeader({ eyebrow, title, accent = M.clay }) {
  return (
    <div style={{ padding: '8px 22px 16px', borderBottom: `2px dashed ${M.ink}`, flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: 9.5, fontWeight: 900, color: accent, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4 }}>{eyebrow}</div>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1, margin: 0 }}>{title}</h2>
      </div>
      <button style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: M.bg, border: `2px solid ${M.ink}`, color: M.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `2px 2px 0 ${M.ink}`, flexShrink: 0 }}><Icon name="x" size={16} /></button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// LOG PROGRESS
// ─────────────────────────────────────────────────────────
function LogProgressMobile() {
  const total = 401;
  const [status, setStatus] = React.useState('reading');
  const [pages, setPages] = React.useState(187);
  const [visibility, setVisibility] = React.useState('public');
  const [notes, setNotes] = React.useState("Sam and Sadie's design sessions read like a love letter to making things. p.142 — keep this passage.");
  const pct = Math.min(100, Math.round((pages / total) * 100));
  const statusOpts = [
    { id: 'to_read', label: 'To Read', color: M.ink3, icon: 'clock' },
    { id: 'reading', label: 'Reading', color: M.clay, icon: 'book' },
    { id: 'read', label: 'Completed', color: M.forest, icon: 'check' },
    { id: 'dnf', label: 'DNF', color: M.red, icon: 'x' },
  ];
  return (
    <ModalHost>
      <BottomSheet>
        <MSheetHeader eyebrow="Reader's log · entry №287" title={<>Log <em style={{ color: M.clay }}>Progress</em></>} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Book summary */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, backgroundColor: M.butter, border: `2px solid ${M.ink}`, borderRadius: 12, boxShadow: `3px 3px 0 ${M.ink}` }}>
            <div style={{ width: 44, flexShrink: 0, transform: 'rotate(-3deg)', filter: `drop-shadow(2px 3px 0 ${M.ink})` }}><BookCover isbn="9780525436140" title="Tomorrow³" author="Gabrielle Zevin" hue="#1a4858" /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 8, fontWeight: 900, color: M.ink, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 3 }}>The book</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 700, lineHeight: 1.05 }}>Tomorrow, and Tomorrow…</div>
              <div style={{ fontSize: 11, color: M.ink2, marginTop: 3, fontWeight: 600 }}>by Gabrielle Zevin</div>
            </div>
          </div>
          {/* Shelf status */}
          <div>
            <MSheetLabel>Shelf status</MSheetLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {statusOpts.map(o => {
                const on = status === o.id;
                return (
                  <button key={o.id} onClick={() => setStatus(o.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 12px', borderRadius: 10, border: `2px solid ${M.ink}`, backgroundColor: on ? o.color : M.paper, color: on ? '#fff' : M.ink, fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: on ? `3px 3px 0 ${M.ink}` : `2px 2px 0 ${M.ink}`, fontFamily: 'Inter, sans-serif' }}>
                    <Icon name={o.icon} size={13} stroke={on ? '#fff' : o.color} /> <span style={{ flex: 1, textAlign: 'left' }}>{o.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Reading state */}
          {status === 'reading' && (
            <div style={{ border: `2px solid ${M.ink}`, borderRadius: 12, backgroundColor: M.bg, padding: 16, boxShadow: `3px 3px 0 ${M.clay}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <MSheetLabel color={M.clay}>Progress</MSheetLabel>
                <div style={{ fontFamily: 'Fraunces, serif', display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: M.ink, lineHeight: 1 }}>{pct}</span><span style={{ fontSize: 18, fontWeight: 600, color: M.clay }}>%</span>
                </div>
              </div>
              <input type="range" min="0" max="100" value={pct} onChange={e => setPages(Math.round((e.target.value / 100) * total))} style={{ width: '100%', accentColor: M.clay, marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8, fontWeight: 900, color: M.ink2, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>Pages read</div>
                  <input type="number" value={pages} onChange={e => setPages(Math.max(0, Math.min(total, parseInt(e.target.value) || 0)))} style={MSHEET_INPUT} />
                </div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, color: M.ink3, paddingBottom: 8 }}>/</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8, fontWeight: 900, color: M.ink2, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>Total</div>
                  <input type="number" value={total} readOnly style={MSHEET_INPUT} />
                </div>
              </div>
            </div>
          )}
          {status === 'dnf' && (
            <div style={{ border: `2px solid ${M.red}`, borderRadius: 12, backgroundColor: '#FBEAE5', padding: 16, boxShadow: `3px 3px 0 ${M.ink}`, position: 'relative' }}>
              <div style={{ position: 'absolute', top: -12, right: 14 }}><MStamp rotate={-8} color={M.red} size={9}>Did not finish</MStamp></div>
              <MSheetLabel color={M.red}>Stopped at page</MSheetLabel>
              <input type="number" defaultValue={212} style={{ ...MSHEET_INPUT, border: `2px solid ${M.red}`, boxShadow: `3px 3px 0 ${M.red}`, marginBottom: 12 }} />
              <MSheetLabel color={M.red}>Reason · optional</MSheetLabel>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['Not for me', 'Wrong time', 'Pacing', 'Lost interest'].map(r => (
                  <button key={r} style={{ padding: '5px 10px', borderRadius: 99, border: `1.5px solid ${M.red}`, backgroundColor: M.paper, color: M.red, fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>+ {r}</button>
                ))}
              </div>
            </div>
          )}
          {status === 'read' && (
            <div style={{ border: `2px solid ${M.forest}`, borderRadius: 12, backgroundColor: '#E8F0EA', padding: 16, display: 'flex', alignItems: 'center', gap: 12, boxShadow: `3px 3px 0 ${M.ink}` }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 800, color: M.forest, lineHeight: 1 }}>100<span style={{ fontSize: 18, color: M.ink }}>%</span></div>
              <div style={{ fontSize: 12, color: M.ink2, lineHeight: 1.4 }}>Moves <em>Tomorrow³</em> to <strong>Finished</strong>. Leave a rating?</div>
            </div>
          )}
          {status === 'to_read' && (
            <div style={{ border: `2px dashed ${M.ink3}`, borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name="clock" size={18} stroke={M.ink} /><div style={{ fontSize: 12, color: M.ink2, lineHeight: 1.4 }}>On deck. No progress to log yet.</div>
            </div>
          )}
          {/* Notes */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <MSheetLabel>Marginalia</MSheetLabel>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 8.5, fontWeight: 900, color: M.ink3, letterSpacing: '0.12em', textTransform: 'uppercase' }}><Icon name="lock" size={10} /> Only you</span>
            </div>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} style={{ ...MSHEET_INPUT, resize: 'none', lineHeight: 1.5, fontFamily: 'Fraunces, serif', fontStyle: 'italic' }} />
          </div>
          {/* Privacy */}
          <div>
            <MSheetLabel>Privacy of this update</MSheetLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: `2px solid ${M.ink}`, borderRadius: 99, overflow: 'hidden', boxShadow: `3px 3px 0 ${M.ink}` }}>
              {[{ id: 'public', label: 'Public', icon: 'eye' }, { id: 'private', label: 'Private', icon: 'lock' }].map((v, i) => {
                const on = visibility === v.id;
                return (
                  <button key={v.id} onClick={() => setVisibility(v.id)} style={{ padding: '11px', backgroundColor: on ? M.ink : 'transparent', color: on ? M.paper : M.ink, border: 'none', borderLeft: i === 1 ? `2px solid ${M.ink}` : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    <Icon name={v.icon} size={13} stroke={on ? M.paper : M.ink} /> {v.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {/* Footer */}
        <div style={{ flexShrink: 0, padding: '12px 22px 26px', borderTop: `2px solid ${M.ink}`, backgroundColor: M.bg, display: 'flex', gap: 10 }}>
          <button style={{ flex: 1, padding: '15px', backgroundColor: M.ink, color: M.paper, border: `2px solid ${M.ink}`, borderRadius: 99, fontSize: 12, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: `4px 4px 0 ${M.clay}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>Stamp & save <Icon name="arrow" size={15} stroke={M.paper} /></button>
        </div>
      </BottomSheet>
    </ModalHost>
  );
}

// ─────────────────────────────────────────────────────────
// READING GOAL
// ─────────────────────────────────────────────────────────
function ReadingGoalMobile() {
  const year = 2026;
  const [goal, setGoal] = React.useState(24);
  const completed = 11;
  const step = goal >= 50 ? 5 : 1;
  const presets = [{ v: 12, l: 'One a month' }, { v: 24, l: 'Two a month' }, { v: 52, l: 'One a week' }, { v: 18, l: 'Match last year' }];
  const visible = Math.min(goal, 30), overflow = Math.max(0, goal - visible);
  const palette = [M.clay, M.ocean, M.butter, M.forest, M.ink];
  return (
    <ModalHost>
      <BottomSheet>
        <MSheetHeader eyebrow="The Pact · annual pledge" title={<>Your <em style={{ color: M.clay }}>{year}</em> goal.</>} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ fontSize: 13, color: M.ink2, lineHeight: 1.5, margin: 0 }}>You're <strong>{completed}</strong> books in. Adjust if life looks different now.</p>
          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '18px 20px', backgroundColor: M.bg, border: `2px solid ${M.ink}`, borderRadius: 16, boxShadow: `4px 4px 0 ${M.clay}` }}>
            <button onClick={() => setGoal(g => Math.max(1, g - step))} style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: M.paper, border: `2px solid ${M.ink}`, color: M.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `3px 3px 0 ${M.ink}`, flexShrink: 0, fontSize: 24, fontWeight: 700 }}>−</button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 88, fontWeight: 700, lineHeight: 0.85, letterSpacing: '-0.05em', color: M.ink }}>{goal}</div>
              <div style={{ fontSize: 10, fontWeight: 900, color: M.clay, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 4 }}>Books in {year}</div>
            </div>
            <button onClick={() => setGoal(g => Math.min(365, g + step))} style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: M.ink, border: `2px solid ${M.ink}`, color: M.paper, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `3px 3px 0 ${M.clay}`, flexShrink: 0, fontSize: 22, fontWeight: 700 }}>+</button>
          </div>
          {/* Pace projection */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: `2px solid ${M.ink}`, borderRadius: 12, overflow: 'hidden', backgroundColor: M.paper }}>
            {[['Per month', (goal / 12).toFixed(1), 'books', M.clay], ['Per book', Math.round(365 / goal), 'days', M.ocean], ['vs last yr', (goal >= 18 ? '+' : '') + (goal - 18), 'books', goal >= 18 ? M.forest : M.ink3]].map((s, i) => (
              <div key={s[0]} style={{ padding: 12, borderRight: i < 2 ? `2px solid ${M.ink}` : 'none', textAlign: 'center' }}>
                <div style={{ fontSize: 8, fontWeight: 900, color: s[3], letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>{s[0]}</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, color: M.ink, lineHeight: 1 }}>{s[1]}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: M.ink3, marginTop: 3 }}>{s[2]}</div>
              </div>
            ))}
          </div>
          {/* Shelf preview */}
          <div>
            <MSheetLabel>The shelf, drawn</MSheetLabel>
            <div style={{ padding: '14px 12px 6px', backgroundColor: M.paper, border: `2px solid ${M.ink}`, borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, flexWrap: 'wrap', minHeight: 56 }}>
                {Array.from({ length: visible }).map((_, i) => {
                  const done = i < completed; const c = palette[i % palette.length];
                  return <div key={i} style={{ width: 12 + (i % 3) * 2, height: 56, backgroundColor: done ? c : M.paper, border: `1.5px solid ${M.ink}`, borderRadius: 2, boxShadow: `1.5px 1.5px 0 ${M.ink}`, transform: `rotate(${((i % 4) - 1.5) * 0.4}deg)` }} />;
                })}
                {overflow > 0 && <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 8px', fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 700, color: M.ink2 }}>+{overflow}</div>}
              </div>
              <div style={{ height: 3, backgroundColor: M.ink, marginTop: 4, borderRadius: 1, boxShadow: `0 2px 0 ${M.ink3}` }} />
            </div>
          </div>
          {/* Presets */}
          <div>
            <MSheetLabel>Or pick a pace</MSheetLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {presets.map(p => {
                const on = goal === p.v;
                return (
                  <button key={p.l} onClick={() => setGoal(p.v)} style={{ padding: '11px 12px', border: `2px solid ${M.ink}`, borderRadius: 10, backgroundColor: on ? M.ink : M.paper, color: on ? M.paper : M.ink, cursor: 'pointer', boxShadow: on ? `3px 3px 0 ${M.clay}` : `2px 2px 0 ${M.ink}`, fontFamily: 'Inter, sans-serif', textAlign: 'left' }}>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{p.l}</div>
                    <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.65, marginTop: 3 }}>{p.v} / year</div>
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ padding: '10px 14px', fontSize: 11, color: M.ink3, fontStyle: 'italic', fontFamily: 'Fraunces, serif', borderLeft: `3px solid ${M.butter}` }}>Goals are private by default. Change your mind any time.</div>
        </div>
        <div style={{ flexShrink: 0, padding: '12px 22px 26px', borderTop: `2px solid ${M.ink}`, backgroundColor: M.bg, display: 'flex', gap: 10 }}>
          <button style={{ padding: '15px 16px', backgroundColor: 'transparent', color: M.ink, border: `2px solid ${M.ink}`, borderRadius: 99, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>Later</button>
          <button style={{ flex: 1, padding: '15px', backgroundColor: M.ink, color: M.paper, border: `2px solid ${M.ink}`, borderRadius: 99, fontSize: 12, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: `4px 4px 0 ${M.clay}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>Update the pact <Icon name="arrow" size={14} stroke={M.paper} /></button>
        </div>
      </BottomSheet>
    </ModalHost>
  );
}

// ─────────────────────────────────────────────────────────
// ADD HIGHLIGHT
// ─────────────────────────────────────────────────────────
function AddHighlightMobile() {
  const [page, setPage] = React.useState('142');
  const [passage, setPassage] = React.useState('What is a game? It is tomorrow, and tomorrow, and tomorrow. It is the possibility of infinite rebirth, infinite redemption.');
  const [note, setNote] = React.useState("Quoting this for the rest of the year.");
  const [tags, setTags] = React.useState(['wrecked', 'craft']);
  const [color, setColor] = React.useState('butter');
  const [share, setShare] = React.useState(true);
  const buddyPage = 189;
  const ALL_TAGS = [{ id: 'wrecked', l: 'Wrecked me', e: '💔' }, { id: 'craft', l: 'On the craft', e: '✍️' }, { id: 'structure', l: 'Structure', e: '🧱' }, { id: 'save', l: 'Save', e: '🔖' }, { id: 'funny', l: 'Made me laugh', e: '😂' }];
  const COLORS = [{ id: 'butter', hex: M.butter }, { id: 'clay', hex: M.clay }, { id: 'ocean', hex: M.ocean }, { id: 'forest', hex: M.success }];
  const accent = COLORS.find(c => c.id === color).hex;
  const pageNum = parseInt(page, 10);
  const willSeeNow = share && pageNum && pageNum <= buddyPage;
  const toggleTag = id => setTags(t => t.includes(id) ? t.filter(x => x !== id) : [...t, id]);
  return (
    <ModalHost>
      <BottomSheet>
        <MSheetHeader eyebrow="Marginalia · New highlight" title={<>Mark a <em style={{ color: M.clay }}>passage.</em></>} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Book + page */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, backgroundColor: M.butter, border: `2px solid ${M.ink}`, borderRadius: 12, boxShadow: `3px 3px 0 ${M.ink}` }}>
            <div style={{ width: 42, flexShrink: 0, transform: 'rotate(-3deg)', filter: `drop-shadow(2px 3px 0 ${M.ink})` }}><BookCover isbn="9780525436140" title="Tomorrow³" author="Gabrielle Zevin" hue="#1a4858" /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 8, fontWeight: 900, color: M.ink, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 3 }}>From the book</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 15, fontWeight: 700, lineHeight: 1.05 }}>Tomorrow, and Tomorrow…</div>
            </div>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 9px', backgroundColor: M.paper, border: `2px solid ${M.ink}`, borderRadius: 8, boxShadow: `2px 2px 0 ${M.ink}` }}>
              <div style={{ fontSize: 7, fontWeight: 900, color: M.ink3, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Page</div>
              <input value={page} onChange={e => setPage(e.target.value.replace(/[^0-9]/g, ''))} style={{ width: 42, textAlign: 'center', fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 800, color: M.ink, border: 'none', background: 'transparent', outline: 'none', padding: 0 }} />
            </div>
          </div>
          {/* Passage */}
          <div>
            <MSheetLabel color={M.clay}>The passage</MSheetLabel>
            <div style={{ position: 'relative' }}>
              <textarea value={passage} onChange={e => setPassage(e.target.value)} rows={4} placeholder="Type or paste the passage…" style={{ ...MSHEET_INPUT, padding: '14px 14px 14px 26px', fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 15, lineHeight: 1.5, resize: 'vertical', backgroundColor: accent === M.butter ? '#FFF6D6' : M.paper, borderLeft: `8px solid ${accent}`, fontWeight: 500 }} />
              <span style={{ position: 'absolute', top: 4, left: 12, fontFamily: 'Fraunces, serif', fontSize: 36, color: accent, fontWeight: 700, lineHeight: 1, pointerEvents: 'none' }}>“</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: M.ink3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Ink</span>
              {COLORS.map(c => (
                <button key={c.id} onClick={() => setColor(c.id)} style={{ width: 26, height: 26, borderRadius: 99, backgroundColor: c.hex, border: `2px solid ${M.ink}`, cursor: 'pointer', boxShadow: color === c.id ? `0 0 0 3px ${M.bg}, 0 0 0 5px ${M.ink}` : 'none' }} />
              ))}
            </div>
          </div>
          {/* Note */}
          <div>
            <MSheetLabel color={M.ocean}>Your note · optional</MSheetLabel>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Why does this stay with you?" style={{ ...MSHEET_INPUT, fontSize: 13, lineHeight: 1.5, resize: 'vertical' }} />
          </div>
          {/* Tags */}
          <div>
            <MSheetLabel>Mood · why it stuck</MSheetLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_TAGS.map(t => {
                const on = tags.includes(t.id);
                return <button key={t.id} onClick={() => toggleTag(t.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 99, backgroundColor: on ? M.ink : M.paper, color: on ? M.bg : M.ink, border: `1.5px solid ${M.ink}`, fontSize: 10, fontWeight: 800, cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase', boxShadow: on ? `2px 2px 0 ${M.clay}` : 'none' }}><span>{t.e}</span> {t.l}</button>;
              })}
            </div>
          </div>
          {/* Sharing */}
          <div style={{ padding: 12, backgroundColor: M.bg, border: `2px solid ${M.ink}`, borderRadius: 12, boxShadow: `3px 3px 0 ${M.ocean}` }}>
            <MSheetLabel color={M.ocean}>Share with</MSheetLabel>
            <label style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', borderRadius: 10, backgroundColor: M.paper, border: `1.5px solid ${M.ink}`, cursor: 'pointer' }}>
              <input type="checkbox" checked={share} onChange={e => setShare(e.target.checked)} style={{ width: 17, height: 17, accentColor: M.clay }} />
              <MAvatar initial="A" color={M.clay} size={28} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: M.ink, lineHeight: 1.1 }}>Share with Alex</div>
                <div style={{ fontSize: 9.5, color: M.ink3, marginTop: 2, fontWeight: 600 }}>Drops into your buddy session</div>
              </div>
            </label>
            <div style={{ marginTop: 10, fontSize: 11, color: M.ink2, lineHeight: 1.4, fontWeight: 600 }}>
              {!share ? <><strong style={{ color: M.ink }}>Private highlight.</strong> Saves to your library.</>
                : willSeeNow ? <><strong style={{ color: M.success }}>Alex sees this now</strong> — they're past p. {page}.</>
                : <><strong style={{ color: M.clay }}>Hidden</strong> for {pageNum - buddyPage} more pages of reading.</>}
            </div>
          </div>
        </div>
        <div style={{ flexShrink: 0, padding: '12px 22px 26px', borderTop: `2px solid ${M.ink}`, backgroundColor: M.bg, display: 'flex', gap: 10 }}>
          <button disabled={!passage || !page} style={{ flex: 1, padding: '15px', backgroundColor: passage && page ? M.clay : M.ink3, color: '#fff', border: `2px solid ${M.ink}`, borderRadius: 99, fontSize: 12, fontWeight: 800, cursor: passage && page ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, letterSpacing: '0.08em', textTransform: 'uppercase', boxShadow: passage && page ? `4px 4px 0 ${M.ink}` : 'none' }}><Icon name="bookmark" size={13} stroke="#fff" /> Save highlight</button>
        </div>
      </BottomSheet>
    </ModalHost>
  );
}

window.LogProgressMobile = LogProgressMobile;
window.ReadingGoalMobile = ReadingGoalMobile;
window.AddHighlightMobile = AddHighlightMobile;
