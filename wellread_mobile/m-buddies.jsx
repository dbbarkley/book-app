/* ============================================================
   MOBILE · BUDDIES + BUDDY SESSION
   Mirrors BuddiesBold (hub) and BuddySessionBold (dedicated).
   Tab: buddies.
   ============================================================ */

// ── Progress ring ─────────────────────────────────────────
function MRing({ pct, color, size = 84, stroke = 7, ringBg = 'rgba(255,255,255,0.1)' }) {
  const r = (size - stroke * 2) / 2, c = 2 * Math.PI * r, dash = (Math.min(pct, 100) / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={ringBg} strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${dash} ${c}`} strokeLinecap="round" />
    </svg>
  );
}

const MBU_ACTIVE = {
  book: { isbn: '9780525436140', title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', hue: '#1a4858', total: 401 },
  startedAt: 'May 04', pace: '~35 pg/wk',
  me: { name: 'You', avatar: 'M', pct: 35, page: 142 },
  partner: { name: 'Alex', avatar: 'A', pct: 47, page: 189 },
  chapters: [
    { num: 1, label: 'Sam & Sadie meet again', bothRead: true },
    { num: 2, label: 'Building Ichigo', bothRead: true },
    { num: 3, label: 'Marx', bothRead: true },
    { num: 4, label: 'NPC', current: true },
    { num: 5, label: 'Both Sides', locked: true },
  ],
  messages: [
    { from: 'Alex', avatar: 'A', color: M.clay, text: "Marx chapter end. I am NOT okay.", time: '2h', chapter: 3 },
    { from: 'You', avatar: 'M', color: M.ocean, text: "I'm reading slow because I know what's coming. Halfway through ch.4.", time: '40m', chapter: 4, me: true },
  ],
  highlight: { from: 'Alex', page: 142, passage: 'What is a game? It is tomorrow, and tomorrow, and tomorrow.', note: "Quoting this for the rest of the year." },
};
const MBU_PENDING = [
  { book: { isbn: '9780062315007', title: 'The Alchemist', author: 'Paulo Coelho', hue: '#5a3c1b' }, from: { name: 'Sam', avatar: 'S', color: M.ink3 }, message: "I want a buddy who'll roll their eyes with me at the right parts.", sentAgo: '2 days ago' },
];
const MBU_COMPLETED = [
  { isbn: '9781501156700', title: 'Educated', author: 'Tara Westover', hue: '#3b2a14', partner: 'Alex', rating: 5, when: 'Mar 12' },
  { isbn: '9780571334650', title: 'Normal People', author: 'Sally Rooney', hue: '#234a5a', partner: 'Priya', rating: 4, when: 'Feb 22' },
];
const MBU_FRIENDS = [
  { name: 'Alex', avatar: 'A', color: M.clay, busy: true },
  { name: 'Priya', avatar: 'P', color: M.success, busy: true },
  { name: 'James', avatar: 'J', color: M.butter, dark: true },
  { name: 'Sam', avatar: 'S', color: M.ink3 },
];

function MBURing({ label, pct, page, total, color, avatar, dark }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: 84, height: 84 }}>
        <MRing pct={pct} color={color} size={84} stroke={7} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.55)', marginTop: 2, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>p.{page}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <MAvatar initial={avatar} color={color} dark={dark} size={20} />
        <span style={{ fontSize: 11, color: '#fff', fontWeight: 800 }}>{label}</span>
      </div>
    </div>
  );
}

function MBUPending({ invite }) {
  const [state, setState] = React.useState('pending');
  if (state === 'declined') return null;
  return (
    <div style={{ padding: 14, backgroundColor: state === 'accepted' ? M.success : M.butter, color: M.ink, border: `2px solid ${M.ink}`, borderRadius: 14, boxShadow: `4px 4px 0 ${M.ink}`, display: 'flex', gap: 12 }}>
      <div style={{ width: 50, flexShrink: 0 }}><BookCover isbn={invite.book.isbn} title={invite.book.title} author={invite.book.author} hue={invite.book.hue} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
          <MAvatar initial={invite.from.avatar} color={invite.from.color} size={22} />
          <span style={{ fontSize: 11, color: M.ink, fontWeight: 800 }}>{invite.from.name}</span>
          <span style={{ fontSize: 10, color: M.ink2 }}>wants to buddy read</span>
        </div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 700, color: M.ink, lineHeight: 1.05 }}>{invite.book.title}</div>
        <div style={{ marginTop: 8, padding: 8, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.08)', border: `1.5px dashed ${M.ink}`, fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 12, color: M.ink, lineHeight: 1.4 }}>"{invite.message}"</div>
        {state === 'pending' ? (
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button onClick={() => setState('accepted')} style={{ padding: '7px 12px', backgroundColor: M.ink, color: M.bg, fontSize: 10, fontWeight: 800, border: `1.5px solid ${M.ink}`, borderRadius: 99, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}><Icon name="check" size={11} /> Accept</button>
            <button onClick={() => setState('declined')} style={{ padding: '7px 12px', backgroundColor: 'transparent', color: M.ink, fontSize: 10, fontWeight: 700, border: `1.5px solid ${M.ink}`, borderRadius: 99, cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Decline</button>
          </div>
        ) : (
          <span style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', backgroundColor: M.ink, color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 99, letterSpacing: '0.04em', textTransform: 'uppercase' }}><Icon name="check" size={11} /> Opening session…</span>
        )}
      </div>
    </div>
  );
}

function MBUStartNew() {
  const [friend, setFriend] = React.useState(2);
  const [pace, setPace] = React.useState(1);
  const paces = [{ label: 'Casual', pages: '~20/wk' }, { label: 'Steady', pages: '~35/wk' }, { label: 'Intense', pages: '~70/wk' }];
  return (
    <div style={{ backgroundColor: M.ocean, color: '#fff', border: `2px solid ${M.ink}`, borderRadius: 18, padding: 18, boxShadow: `6px 6px 0 ${M.butter}`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, background: `radial-gradient(circle, rgba(241,199,91,0.18) 0%, transparent 70%)` }} />
      <div style={{ position: 'relative' }}>
        <MEyebrow color={M.butter}>New session</MEyebrow>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 600, color: '#fff', lineHeight: 0.96, margin: '10px 0 12px', letterSpacing: '-0.03em' }}>Read the same book <em style={{ color: M.butter }}>together.</em></h2>
        <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Step 1 · Who's reading with you</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
          {MBU_FRIENDS.map((f, i) => (
            <button key={f.name} onClick={() => !f.busy && setFriend(i)} disabled={f.busy} style={{ padding: 8, borderRadius: 10, backgroundColor: friend === i ? M.butter : 'transparent', border: `1.5px solid ${friend === i ? M.butter : f.busy ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.25)'}`, cursor: f.busy ? 'not-allowed' : 'pointer', opacity: f.busy ? 0.4 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <MAvatar initial={f.avatar} color={f.color} dark={f.dark} size={28} />
              <div style={{ fontSize: 9, fontWeight: 700, color: friend === i ? M.ink : '#fff' }}>{f.name}</div>
            </button>
          ))}
        </div>
        <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Step 2 · Pace</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          {paces.map((p, i) => (
            <button key={p.label} onClick={() => setPace(i)} style={{ padding: '10px 8px', borderRadius: 10, backgroundColor: pace === i ? M.butter : 'transparent', color: pace === i ? M.ink : '#fff', border: `1.5px solid ${pace === i ? M.butter : 'rgba(255,255,255,0.25)'}`, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
              <div style={{ fontSize: 11, fontWeight: 800 }}>{p.label}</div>
              <div style={{ fontSize: 8.5, opacity: 0.7, marginTop: 2 }}>{p.pages}</div>
            </button>
          ))}
        </div>
        <button style={{ width: '100%', padding: '13px', backgroundColor: M.butter, color: M.ink, fontSize: 11, fontWeight: 800, border: `1.5px solid ${M.ink}`, borderRadius: 99, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, letterSpacing: '0.06em', textTransform: 'uppercase', boxShadow: `3px 3px 0 ${M.clay}` }}>
          Send invite to {MBU_FRIENDS[friend].name} <Icon name="send" size={12} />
        </button>
      </div>
    </div>
  );
}

function BuddiesMobile() {
  const s = MBU_ACTIVE;
  return (
    <MScreen tab="buddies" topBar={<MTopBar title="Buddies" />}>
      <section style={{ padding: '20px 20px 8px' }}>
        <MEyebrow color={M.clay}>Reading together</MEyebrow>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 52, fontWeight: 600, lineHeight: 0.88, margin: '12px 0 12px', letterSpacing: '-0.04em', color: M.ink }}>Reading <em style={{ color: M.clay }}>buddies.</em></h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['1 active', M.clay, '#fff'], ['1 pending', M.butter, M.ink], ['3 finished', M.paper, M.ink]].map(([t, bg, c]) => (
            <span key={t} style={{ padding: '5px 11px', borderRadius: 99, backgroundColor: bg, color: c, fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', border: `2px solid ${M.ink}` }}>{t}</span>
          ))}
        </div>
      </section>

      {/* Active session */}
      <section style={{ padding: '8px 20px' }}>
        <div style={{ backgroundColor: M.ink, color: '#fff', border: `2px solid ${M.ink}`, borderRadius: 18, boxShadow: `7px 7px 0 ${M.clay}`, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -80, right: -60, width: 240, height: 240, background: `radial-gradient(circle, rgba(213,88,46,0.4) 0%, transparent 70%)` }} />
          <div style={{ position: 'relative', padding: '16px 18px', borderBottom: '1.5px solid rgba(255,255,255,0.15)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 34, flexShrink: 0 }}><BookCover isbn={s.book.isbn} title={s.book.title} author={s.book.author} hue={s.book.hue} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <MStamp rotate={-2} color={M.butter} size={8} fill>Active session</MStamp>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.05, marginTop: 6 }}>{s.book.title}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Started {s.startedAt} · {s.pace}</div>
            </div>
          </div>
          <div style={{ position: 'relative', padding: 18 }}>
            {/* Rings */}
            <div style={{ display: 'flex', justifyContent: 'space-around', padding: 14, backgroundColor: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 14, marginBottom: 12 }}>
              <MBURing label="You" pct={s.me.pct} page={s.me.page} total={s.book.total} color={M.butter} avatar={s.me.avatar} dark />
              <MBURing label="Alex" pct={s.partner.pct} page={s.partner.page} total={s.book.total} color={M.clay} avatar={s.partner.avatar} />
            </div>
            {/* Chapters */}
            <div style={{ padding: 14, backgroundColor: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Chapters</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {s.chapters.map(ch => (
                  <div key={ch.num} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 8, backgroundColor: ch.current ? 'rgba(241,199,91,0.18)' : 'transparent', border: ch.current ? `1.5px solid ${M.butter}` : '1.5px solid transparent' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: ch.bothRead ? M.success : ch.locked ? 'rgba(255,255,255,0.06)' : M.butter, color: ch.bothRead ? '#fff' : ch.locked ? 'rgba(255,255,255,0.35)' : M.ink, fontSize: 8, fontWeight: 800, border: `1.5px solid ${ch.locked ? 'rgba(255,255,255,0.15)' : M.ink}` }}>
                      {ch.bothRead ? <Icon name="check" size={9} /> : ch.locked ? <Icon name="lock" size={9} /> : ch.num}
                    </div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: ch.locked ? 'rgba(255,255,255,0.35)' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>Ch. {ch.num} · {ch.label}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Discussion preview */}
            <div style={{ padding: 14, backgroundColor: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Discussion</div>
                <MStamp rotate={-3} color={M.success} size={7} fill>Spoiler-safe</MStamp>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {s.messages.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, flexDirection: m.me ? 'row-reverse' : 'row' }}>
                    <MAvatar initial={m.avatar} color={m.color} size={22} />
                    <div style={{ maxWidth: '80%', padding: '7px 10px', borderRadius: 10, backgroundColor: m.me ? M.butter : M.paper, color: M.ink, fontSize: 11, lineHeight: 1.4, border: `1.5px solid ${M.ink}`, boxShadow: `2px 2px 0 ${M.ink}` }}>{m.text}</div>
                  </div>
                ))}
              </div>
              <button style={{ width: '100%', marginTop: 12, padding: '10px', backgroundColor: M.clay, color: '#fff', border: `1.5px solid ${M.ink}`, borderRadius: 99, fontSize: 10, fontWeight: 800, cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Open full session</button>
            </div>
          </div>
        </div>
      </section>

      {/* Pending */}
      <section style={{ padding: '12px 20px 4px' }}>
        <MSection eyebrow="Asking" color={M.clay}>Pending invites</MSection>
        {MBU_PENDING.map((p, i) => <MBUPending key={i} invite={p} />)}
      </section>

      {/* Start new */}
      <section style={{ padding: '12px 20px' }}><MBUStartNew /></section>

      {/* Completed */}
      <section style={{ padding: '4px 20px 8px' }}>
        <MCard shadow={M.ink} pad={16}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
            <MEyebrow color={M.success}>Finished together</MEyebrow>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 600, color: M.ink, margin: 0, letterSpacing: '-0.02em' }}>Past sessions</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MBU_COMPLETED.map(c => (
              <div key={c.isbn} style={{ padding: 10, borderRadius: 10, backgroundColor: M.bg, border: `1.5px solid ${M.ink}`, display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 36, flexShrink: 0 }}><BookCover isbn={c.isbn} title={c.title} author={c.author} hue={c.hue} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: 13, fontWeight: 700, color: M.ink, lineHeight: 1.05 }}>{c.title}</div>
                  <div style={{ fontSize: 9, color: M.ink3, marginTop: 2 }}>with <strong style={{ color: M.ink }}>{c.partner}</strong> · {c.when}</div>
                  <div style={{ marginTop: 4 }}><MStars value={c.rating} size={9} /></div>
                </div>
              </div>
            ))}
          </div>
        </MCard>
      </section>
    </MScreen>
  );
}

// ═══════════════════════════════════════════════════════════
// BUDDY SESSION — dedicated page
// ═══════════════════════════════════════════════════════════
const MSESSION = {
  book: { isbn: '9780525436140', title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', hue: '#1a4858', total: 401, chapters: 7 },
  startedAt: 'May 04', weekNumber: 3, pace: { label: 'Steady', pages: '~35 / wk' },
  me: { name: 'Mia', avatar: 'M', color: M.ocean, pct: 35, page: 142, thisWeek: 31 },
  partner: { name: 'Alex', avatar: 'A', color: M.clay, pct: 47, page: 189, lastSeen: '12m ago', thisWeek: 42 },
  chapters: [
    { num: 1, label: 'Sam & Sadie meet again', pageStart: 1, bothRead: true },
    { num: 2, label: 'Building Ichigo', pageStart: 51, bothRead: true },
    { num: 3, label: 'Marx', pageStart: 92, bothRead: true },
    { num: 4, label: 'NPC', pageStart: 134, current: true },
    { num: 5, label: 'Both Sides', pageStart: 198, locked: true },
  ],
  thread: [
    { day: 'Tue · May 19', messages: [
      { from: 'Alex', kind: 'highlight', page: 142, passage: 'What is a game? It is tomorrow, and tomorrow, and tomorrow.', note: 'Quoting this all year.', time: '11:02 AM', chapter: 4 },
      { from: 'You', text: "Saw your highlight come in. Sat with it on the train.", time: '12:48 PM', chapter: 4 },
    ]},
    { day: 'Today · May 20', messages: [
      { from: 'You', kind: 'progress', from_page: 124, to_page: 142, time: '7:40 AM', chapter: 4 },
      { from: 'You', text: "Reading slow because I know what's coming. The shift in voice is doing things to me.", time: '7:42 AM', chapter: 4 },
      { from: 'Alex', text: "Take all the time. Want me to wait at p.198 so we hit Ch.5 together?", time: '12m', chapter: 4, pin: true },
    ]},
  ],
  highlights: [
    { from: 'Alex', page: 142, passage: 'What is a game? It is tomorrow, and tomorrow, and tomorrow.', note: 'Quoting this all year.', when: '2d' },
    { from: 'You', page: 98, passage: 'To allow yourself to play with another person is no small risk.', note: 'Connecting to how Sadie keeps Sam at a distance.', when: '5d' },
  ],
  activity: [
    { who: 'Alex', kind: 'read', detail: 'p. 142 → 189', time: '12m ago' },
    { who: 'You', kind: 'read', detail: 'p. 124 → 142', time: '5h ago' },
    { who: 'Alex', kind: 'highlight', detail: 'p. 142', time: 'yesterday' },
    { who: 'You', kind: 'started', detail: null, time: 'May 04' },
  ],
};

function MSMessage({ m, isMe }) {
  if (m.kind === 'highlight') {
    return (
      <div style={{ display: 'flex', gap: 10, flexDirection: isMe ? 'row-reverse' : 'row' }}>
        <MAvatar initial={m.from[0]} color={isMe ? M.ocean : M.clay} size={26} />
        <div style={{ maxWidth: '82%', flex: 1 }}>
          <div style={{ fontSize: 9, color: M.ink3, marginBottom: 5, textAlign: isMe ? 'right' : 'left' }}><strong style={{ color: M.ink, fontWeight: 800, fontSize: 10 }}>{m.from}</strong> · highlight · Ch.{m.chapter}</div>
          <div style={{ padding: '14px 12px 12px', borderRadius: 12, backgroundColor: M.butter, border: `1.5px solid ${M.ink}`, boxShadow: `2px 2px 0 ${M.ink}`, position: 'relative' }}>
            <span style={{ position: 'absolute', top: -9, left: 12, padding: '2px 7px', backgroundColor: M.ink, color: M.butter, fontSize: 8, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 4 }}>p. {m.page}</span>
            <p style={{ fontFamily: 'Fraunces, serif', fontSize: 14, fontStyle: 'italic', color: M.ink, lineHeight: 1.4, margin: 0 }}>"{m.passage}"</p>
            {m.note && <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1.5px dashed ${M.ink}`, fontSize: 11, color: M.ink2, fontWeight: 600 }}><strong style={{ color: M.ink }}>{m.from}'s note: </strong>{m.note}</div>}
          </div>
        </div>
      </div>
    );
  }
  if (m.kind === 'progress') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' }} />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, backgroundColor: M.bg, border: `1.5px solid ${M.ink}`, fontSize: 9, fontWeight: 800, color: M.ink, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          <Icon name="book" size={10} stroke={M.clay} /> {m.from} logged p.{m.from_page}→{m.to_page}
        </div>
        <span style={{ flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' }} />
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 10, flexDirection: isMe ? 'row-reverse' : 'row' }}>
      <MAvatar initial={m.from[0]} color={isMe ? M.ocean : M.clay} size={26} />
      <div style={{ maxWidth: '82%' }}>
        <div style={{ fontSize: 9, color: M.ink3, marginBottom: 4, textAlign: isMe ? 'right' : 'left' }}><strong style={{ color: M.ink, fontWeight: 800, fontSize: 10 }}>{m.from}</strong> · Ch.{m.chapter} · {m.time}{m.pin && ' · 📌'}</div>
        <div style={{ padding: '9px 12px', borderRadius: 14, backgroundColor: isMe ? M.ink : M.paper, color: isMe ? '#fff' : M.ink, fontSize: 12.5, lineHeight: 1.45, borderTopLeftRadius: !isMe ? 4 : 14, borderTopRightRadius: isMe ? 4 : 14, border: `1.5px solid ${M.ink}`, boxShadow: `2px 2px 0 ${isMe ? M.clay : M.ink}`, fontWeight: 500 }}>{m.text}</div>
      </div>
    </div>
  );
}

function BuddySessionMobile() {
  const s = MSESSION;
  const [filter, setFilter] = React.useState('all');
  const [spoiler, setSpoiler] = React.useState(true);
  const chapterOpts = ['all', ...s.chapters.filter(c => !c.locked).map(c => c.num)];
  return (
    <MScreen tab="buddies" topBar={<MTopBar title="Session" showBack right={<div style={{ width: 34, height: 34, borderRadius: 99, border: `2px solid ${M.ink}`, backgroundColor: M.paper, color: M.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="bell" size={14} /></div>} />}>
      {/* Session header */}
      <section style={{ padding: '14px 20px 8px' }}>
        <div style={{ backgroundColor: M.ink, color: '#fff', border: `2px solid ${M.ink}`, borderRadius: 18, boxShadow: `6px 6px 0 ${M.clay}`, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -90, right: -70, width: 240, height: 240, background: `radial-gradient(circle, rgba(213,88,46,0.38) 0%, transparent 70%)` }} />
          <div style={{ position: 'relative', display: 'flex', gap: 16, padding: 18 }}>
            <div style={{ width: 76, flexShrink: 0, position: 'relative' }}>
              <BookCover isbn={s.book.isbn} title={s.book.title} author={s.book.author} hue={s.book.hue} style={{ boxShadow: `5px 5px 0 ${M.clay}` }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <MStamp rotate={-4} color={M.butter} size={8} fill>Buddy read</MStamp>
              <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 600, lineHeight: 0.96, margin: '8px 0 4px', letterSpacing: '-0.025em', color: '#fff' }}>{s.book.title}</h1>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Week {s.weekNumber} · {s.pace.label} · {s.pace.pages}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '6px 10px', borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.15)', width: 'fit-content' }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, backgroundColor: M.success }} />
                <span style={{ fontSize: 9, color: M.success, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{s.partner.name} active {s.partner.lastSeen}</span>
              </div>
            </div>
          </div>
          <div style={{ position: 'relative', display: 'flex', gap: 8, padding: '0 18px 16px' }}>
            <button style={{ flex: 1, padding: '10px', backgroundColor: M.butter, color: M.ink, fontSize: 10, fontWeight: 800, border: `1.5px solid ${M.ink}`, borderRadius: 99, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, letterSpacing: '0.06em', textTransform: 'uppercase', boxShadow: `2px 2px 0 ${M.clay}` }}><Icon name="plus" size={11} /> Log progress</button>
            <button style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: '#fff', fontSize: 10, fontWeight: 700, border: `1.5px solid rgba(255,255,255,0.3)`, borderRadius: 99, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}><Icon name="bell" size={11} /> Nudge</button>
          </div>
        </div>
      </section>

      {/* Pacing */}
      <section style={{ padding: '8px 20px' }}>
        <div style={{ backgroundColor: M.ocean, color: '#fff', border: `2px solid ${M.ink}`, borderRadius: 16, padding: 16, boxShadow: `5px 5px 0 ${M.ink}` }}>
          <MEyebrow color={M.butter}>Pacing</MEyebrow>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 12 }}>
            <MBURing label="You" pct={s.me.pct} page={s.me.page} total={s.book.total} color={M.butter} avatar={s.me.avatar} dark />
            <MBURing label="Alex" pct={s.partner.pct} page={s.partner.page} total={s.book.total} color={M.clay} avatar={s.partner.avatar} />
          </div>
          <div style={{ marginTop: 14, padding: '9px 12px', backgroundColor: 'rgba(213,88,46,0.2)', border: '1.5px solid rgba(213,88,46,0.5)', borderRadius: 8, fontSize: 12, color: '#fff', lineHeight: 1.4, fontFamily: 'Fraunces, serif', fontStyle: 'italic' }}>
            {s.partner.name} is <strong style={{ color: M.butter, fontFamily: 'Inter, sans-serif', fontStyle: 'normal' }}>47 pages ahead</strong>. They've offered to wait at p.198.
          </div>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[['You this week', s.me.thisWeek, M.butter], [`${s.partner.name} this week`, s.partner.thisWeek, M.clay]].map(([l, v, c]) => (
              <div key={l} style={{ padding: 10, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 8 }}>
                <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 800 }}>{l}</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 700, color: c, lineHeight: 1, marginTop: 4 }}>{v}<span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 700, marginLeft: 3 }}>pp</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Discussion */}
      <section style={{ padding: '8px 20px' }}>
        <MCard shadow={M.ink} pad={0} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: `2px solid ${M.ink}`, backgroundColor: M.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <MEyebrow color={M.clay}>Discussion</MEyebrow>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 600, color: M.ink, margin: 0, letterSpacing: '-0.02em' }}>With <em style={{ color: M.clay }}>Alex</em></h2>
            </div>
            <MStamp rotate={-3} color={M.success} size={7} fill>Spoiler-safe</MStamp>
          </div>
          <div style={{ padding: '10px 16px', borderBottom: `1.5px solid rgba(0,0,0,0.08)`, display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {chapterOpts.map(opt => (
              <button key={opt} onClick={() => setFilter(opt)} style={{ padding: '5px 11px', borderRadius: 99, backgroundColor: filter === opt ? M.ink : 'transparent', color: filter === opt ? M.bg : M.ink, fontSize: 10, fontWeight: 800, border: `1.5px solid ${M.ink}`, cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>{opt === 'all' ? 'All' : `Ch.${opt}`}</button>
            ))}
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, background: `repeating-linear-gradient(0deg, ${M.paper}, ${M.paper} 31px, rgba(0,0,0,0.025) 32px)` }}>
            {s.thread.map((day, di) => {
              const vis = day.messages.filter(m => filter === 'all' || m.chapter === filter);
              if (!vis.length) return null;
              return (
                <React.Fragment key={di}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ flex: 1, height: 1, backgroundColor: M.ink, opacity: 0.15 }} />
                    <span style={{ padding: '3px 9px', borderRadius: 99, backgroundColor: M.ink, color: M.bg, fontSize: 8.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{day.day}</span>
                    <span style={{ flex: 1, height: 1, backgroundColor: M.ink, opacity: 0.15 }} />
                  </div>
                  {vis.map((m, mi) => <MSMessage key={`${di}-${mi}`} m={m} isMe={m.from === 'You'} />)}
                </React.Fragment>
              );
            })}
          </div>
          <div style={{ padding: 12, borderTop: `2px solid ${M.ink}`, backgroundColor: M.bg }}>
            {spoiler && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 99, backgroundColor: M.butter, color: M.ink, fontSize: 8.5, fontWeight: 800, border: `1.5px solid ${M.ink}`, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>
                <Icon name="lock" size={9} /> Replying about Ch.4 · Alex won't see until they reach it
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, padding: 8, backgroundColor: M.paper, border: `1.5px solid ${M.ink}`, borderRadius: 12 }}>
              <input placeholder="Reply about Ch. 4…" style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 12, color: M.ink, padding: '6px 8px', fontFamily: 'inherit', outline: 'none' }} />
              <button onClick={() => setSpoiler(s => !s)} style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: spoiler ? M.butter : 'transparent', border: `1.5px solid ${M.ink}`, color: M.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="lock" size={13} /></button>
              <button style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: M.clay, border: `1.5px solid ${M.ink}`, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `2px 2px 0 ${M.ink}` }}><Icon name="send" size={13} /></button>
            </div>
          </div>
        </MCard>
      </section>

      {/* Highlights */}
      <section style={{ padding: '8px 20px' }}>
        <MCard shadow={M.butter} pad={16}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <MEyebrow color={M.clay}>Highlights</MEyebrow>
            <span style={{ fontSize: 9, fontWeight: 800, color: M.ink3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.highlights.length} saved</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {s.highlights.map((h, i) => (
              <div key={i} style={{ padding: 12, borderRadius: 10, backgroundColor: i === 0 ? M.butter : M.bg, border: `1.5px solid ${M.ink}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MAvatar initial={h.from === 'You' ? 'M' : 'A'} color={h.from === 'You' ? M.ocean : M.clay} size={18} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: M.ink }}>{h.from}</span>
                  </div>
                  <span style={{ fontSize: 8.5, color: M.ink2, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>p.{h.page} · {h.when}</span>
                </div>
                <p style={{ fontFamily: 'Fraunces, serif', fontSize: 12, fontStyle: 'italic', color: M.ink, lineHeight: 1.4, margin: 0 }}>"{h.passage}"</p>
                {h.note && <div style={{ marginTop: 6, fontSize: 10, color: M.ink2, fontWeight: 600, lineHeight: 1.4 }}><strong style={{ color: M.ink }}>note: </strong>{h.note}</div>}
              </div>
            ))}
          </div>
          <button style={{ width: '100%', marginTop: 12, padding: '9px', borderRadius: 99, backgroundColor: 'transparent', color: M.ink, fontSize: 9, fontWeight: 800, border: `1.5px dashed ${M.ink}`, cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Icon name="plus" size={11} /> Add a highlight</button>
        </MCard>
      </section>

      {/* Activity timeline */}
      <section style={{ padding: '8px 20px 8px' }}>
        <MCard bg={M.bg} shadow={M.ink} pad={16}>
          <MEyebrow color={M.ocean}>Activity</MEyebrow>
          <div style={{ position: 'relative', marginTop: 12, paddingLeft: 16 }}>
            <span style={{ position: 'absolute', left: 6, top: 6, bottom: 6, width: 2, backgroundColor: M.ink }} />
            {s.activity.map((a, i) => {
              const color = a.who === 'You' ? M.ocean : M.clay;
              const verb = a.kind === 'read' ? 'read' : a.kind === 'highlight' ? 'highlighted' : 'started the session';
              return (
                <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 12, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: -16, top: 1, width: 14, height: 14, borderRadius: 99, backgroundColor: color, border: `2px solid ${M.ink}` }} />
                  <div style={{ flex: 1, paddingLeft: 4 }}>
                    <div style={{ fontSize: 11, color: M.ink, lineHeight: 1.35 }}><strong style={{ fontWeight: 800 }}>{a.who}</strong> <span style={{ color: M.ink2 }}>{verb}</span>{a.detail && <> · <span style={{ color, fontWeight: 700 }}>{a.detail}</span></>}</div>
                    <div style={{ fontSize: 8, color: M.ink3, marginTop: 2, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{a.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </MCard>
      </section>
    </MScreen>
  );
}

window.BuddiesMobile = BuddiesMobile;
window.BuddySessionMobile = BuddySessionMobile;
