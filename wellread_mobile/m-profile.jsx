/* ============================================================
   MOBILE · PROFILE — own + another reader. Mirrors ProfileBold.
   Friend requests (own), header, stats charts, favourite authors,
   Top 10, custom lists, library snapshot, social tabs. Tab: you.
   ============================================================ */

const MP_USER = { name: 'Mira Okafor', handle: 'miraok', bio: "Re-reading more than I'm finishing lately. Big on translated fiction, anti-hype, and books with maps in the front.", initial: 'M', color: M.ocean, joined: 'March 2026', loc: 'Brooklyn, NY' };
const MP_OTHER = { name: 'Alex Tanaka', handle: 'alextan', bio: "Software person. Slow reader on purpose. DNFs are a love language.", initial: 'A', color: M.clay, joined: 'January 2026', loc: 'Oakland, CA' };
const MP_STATS_OWN = { friends: 18, followers: 124, following: 67 };
const MP_STATS_OTHER = { friends: 9, followers: 42, following: 31 };
const MP_REQUESTS = [
  { name: 'Priya Shah', handle: 'priya', initial: 'P', color: M.ocean, mutual: 4, when: '2d' },
  { name: 'James Mercer', handle: 'james', initial: 'J', color: M.butter, dark: true, mutual: 1, when: '5d' },
];
const MP_GENRES = [
  { name: 'Literary fiction', count: 28 }, { name: 'Sci-fi', count: 19 }, { name: 'Memoir', count: 14 },
  { name: 'Translated', count: 11 }, { name: 'Mystery', count: 8 },
];
const MP_AUTHORS = [
  { name: 'Gabrielle Zevin', count: 4 }, { name: 'Kazuo Ishiguro', count: 4 },
  { name: 'Ursula K. Le Guin', count: 3 }, { name: 'Sally Rooney', count: 2 },
];
const MP_FAV = ['Gabrielle Zevin', 'Ursula K. Le Guin', 'Kazuo Ishiguro', 'Tana French', 'Han Kang', 'Italo Calvino'];
const MP_TOP10 = [
  { isbn: '9780525436140', title: 'Tomorrow³', hue: '#1a4858' },
  { isbn: '9780571334650', title: 'Normal People', hue: '#234a5a' },
  { isbn: '9780525559474', title: 'The Midnight Library', hue: '#0e3b2a' },
  { isbn: '9781501156700', title: 'Educated', hue: '#3b2a14' },
  { isbn: '9780062315007', title: 'The Alchemist', hue: '#5a3c1b' },
  { isbn: '9780441013593', title: 'Dune', hue: '#2c1810' },
];
const MP_LISTS = [
  { name: 'Reread in 2026', emoji: '↻', accent: M.clay, count: 7, books: MP_TOP10.slice(0, 3) },
  { name: 'Bought at Strand', emoji: '◇', accent: M.ocean, count: 12, books: MP_TOP10.slice(2, 5) },
];
const MP_FRIENDS = [
  { name: 'Alex Tanaka', handle: 'alextan', initial: 'A', color: M.clay, bio: 'DNFs are a love language.' },
  { name: 'Priya Shah', handle: 'priya', initial: 'P', color: M.ocean, bio: 'Reads only at the laundromat.' },
  { name: 'Sam Liu', handle: 'samliu', initial: 'S', color: M.success, bio: 'Fantasy completist.' },
  { name: 'Margaret Vance', handle: 'mvance', initial: 'M', color: M.butter, dark: true, bio: 'Used-bookstore owner.' },
];

function MPChartBar({ label, value, max, color }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
        <span style={{ fontWeight: 700, color: M.ink }}>{label}</span>
        <span style={{ fontWeight: 800, color }}>{value}</span>
      </div>
      <div style={{ height: 14, backgroundColor: '#fff', border: `1.5px solid ${M.ink}`, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${(value / max) * 100}%`, height: '100%', backgroundColor: color }} />
      </div>
    </div>
  );
}

function MPSocialTabs({ isOwn, name }) {
  const [tab, setTab] = React.useState('friends');
  const tabs = [
    { id: 'friends', label: 'Friends', count: MP_FRIENDS.length, color: M.clay },
    { id: 'following', label: 'Following', count: 67, color: M.ocean },
    { id: 'followers', label: 'Followers', count: 124, color: M.success },
  ];
  return (
    <MCard shadow={M.ocean} pad={16}>
      <MEyebrow color={M.clay}>Social</MEyebrow>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 600, color: M.ink, margin: '6px 0 14px', letterSpacing: '-0.02em' }}>{isOwn ? 'People in your stacks' : `Who ${name.split(' ')[0]} reads with`}</h2>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, padding: 4, border: `2px solid ${M.ink}`, borderRadius: 99, backgroundColor: M.bg, width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '7px 13px', borderRadius: 99, border: 'none', backgroundColor: tab === t.id ? M.ink : 'transparent', color: tab === t.id ? M.bg : M.ink, fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {t.label}<span style={{ padding: '1px 6px', borderRadius: 99, backgroundColor: tab === t.id ? t.color : '#fff', color: tab === t.id ? '#fff' : M.ink, fontSize: 9, fontWeight: 900, border: tab === t.id ? 'none' : `1px solid ${M.ink}` }}>{t.count}</span>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {MP_FRIENDS.map(f => (
          <div key={f.handle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: `2px solid ${M.ink}`, borderRadius: 12, backgroundColor: M.bg, boxShadow: `3px 3px 0 ${M.ink}` }}>
            <MAvatar initial={f.initial} color={f.color} dark={f.dark} size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 15, fontWeight: 700, color: M.ink, letterSpacing: '-0.01em' }}>{f.name}</div>
              <div style={{ fontSize: 10, color: M.ink2, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{f.handle} · {f.bio}</div>
            </div>
            <button style={{ padding: '6px 12px', borderRadius: 99, backgroundColor: 'transparent', color: M.ink, border: `2px solid ${M.ink}`, fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: `2px 2px 0 ${M.ink}` }}>View</button>
          </div>
        ))}
      </div>
    </MCard>
  );
}

function ProfileMobile({ isOwn = true }) {
  const u = isOwn ? MP_USER : MP_OTHER;
  const stats = isOwn ? MP_STATS_OWN : MP_STATS_OTHER;
  const gMax = Math.max(...MP_GENRES.map(g => g.count));
  const aMax = Math.max(...MP_AUTHORS.map(a => a.count));
  const [libFilter, setLibFilter] = React.useState('all');
  const libFilters = [{ id: 'all', label: 'All', count: 92 }, { id: 'reading', label: 'Reading', count: 3 }, { id: 'finished', label: 'Finished', count: 81 }, { id: 'dnf', label: 'DNF', count: 8 }];
  return (
    <MScreen tab="you" topBar={<MTopBar title={isOwn ? 'You' : 'Profile'} showBack={!isOwn} right={isOwn ? <div style={{ width: 34, height: 34, borderRadius: 99, border: `2px solid ${M.ink}`, backgroundColor: M.paper, color: M.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="layers" size={14} /></div> : null} />}>
      <div style={{ padding: '16px 20px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Friend requests (own only) */}
        {isOwn && (
          <div style={{ backgroundColor: M.butter, border: `2px solid ${M.ink}`, borderRadius: 14, padding: 16, boxShadow: `5px 5px 0 ${M.ink}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Icon name="bell" size={16} stroke={M.ink} />
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 700, color: M.ink, letterSpacing: '-0.01em' }}>{MP_REQUESTS.length} new friend requests</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MP_REQUESTS.map(r => (
                <div key={r.handle} style={{ display: 'flex', alignItems: 'center', gap: 12, backgroundColor: M.paper, border: `2px solid ${M.ink}`, borderRadius: 10, padding: '8px 12px' }}>
                  <MAvatar initial={r.initial} color={r.color} dark={r.dark} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: 14, fontWeight: 700, color: M.ink }}>{r.name}</div>
                    <div style={{ fontSize: 9.5, color: M.ink2, fontWeight: 600 }}>{r.mutual} mutual · {r.when}</div>
                  </div>
                  <button style={{ padding: '6px 11px', borderRadius: 99, backgroundColor: M.ink, color: '#fff', border: `2px solid ${M.ink}`, fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>Accept</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Header card */}
        <div style={{ backgroundColor: M.paper, border: `2px solid ${M.ink}`, borderRadius: 18, boxShadow: `6px 6px 0 ${M.ink}`, overflow: 'hidden' }}>
          <div style={{ position: 'relative', height: 90, backgroundColor: M.clay, borderBottom: `2px solid ${M.ink}`, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', backgroundColor: M.butter, border: `2px solid ${M.ink}` }} />
            <div style={{ position: 'absolute', top: 16, left: 16 }}><MStamp rotate={-3} color="#fff" size={8}>{isOwn ? 'Your shelf · Public' : 'A reader at Libraio'}</MStamp></div>
          </div>
          <div style={{ padding: '0 18px 18px' }}>
            <div style={{ marginTop: -42, marginBottom: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
              <MAvatar initial={u.initial} color={u.color} size={84} />
            </div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 700, color: M.ink, margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>{u.name}</h1>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: M.ink2, fontWeight: 600 }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', color: M.clay, fontSize: 14 }}>@{u.handle}</span>
              <span style={{ width: 4, height: 4, backgroundColor: M.ink3, borderRadius: 99 }} />
              <span>{u.loc}</span>
            </div>
            <p style={{ fontFamily: 'Fraunces, serif', fontSize: 14, lineHeight: 1.5, color: M.ink, margin: '14px 0 16px', fontStyle: 'italic' }}>"{u.bio}"</p>
            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {isOwn ? (
                <MPill bg={M.ink} shadow={M.ink} icon="pen" style={{ flex: 1 }}>Edit profile</MPill>
              ) : (
                <>
                  <MPill bg={M.clay} shadow={M.ink} icon="plus" style={{ flex: 1 }}>Add friend</MPill>
                  <MPill bg="transparent" color={M.ink} shadow={M.ink} icon="check" style={{ flex: 1 }}>Following</MPill>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[['Friends', stats.friends, M.clay], ['Followers', stats.followers, M.ocean], ['Following', stats.following, M.success]].map(([l, v, c]) => (
                <div key={l} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px 6px', backgroundColor: M.bg, border: `2px solid ${M.ink}`, borderRadius: 99, boxShadow: `2px 2px 0 ${c}` }}>
                  <span style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 800, color: c, lineHeight: 1 }}>{v}</span>
                  <span style={{ fontSize: 8, fontWeight: 800, color: M.ink, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Genres chart */}
        <MCard shadow={M.clay} pad={16}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: M.clay, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Reading mix</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 700, color: M.ink, letterSpacing: '-0.02em' }}>Where the hours go</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 800, color: M.ink, lineHeight: 1 }}>92</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: M.ink3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>read</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {MP_GENRES.map((g, i) => <MPChartBar key={g.name} label={g.name} value={g.count} max={gMax} color={[M.clay, M.ocean, M.butter, M.success, M.clayDeep][i % 5]} />)}
          </div>
        </MCard>

        {/* Favourite authors */}
        <MCard shadow={M.butter} pad={16}>
          <div style={{ fontSize: 9, fontWeight: 800, color: M.clay, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Favourites</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 700, color: M.ink, letterSpacing: '-0.02em', marginBottom: 14 }}>Writers I'd <span style={{ fontStyle: 'italic', color: M.clay }}>defend</span> in a bar fight</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MP_FAV.map((a, i) => (
              <span key={a} style={{ padding: '7px 13px', backgroundColor: i % 3 === 0 ? M.bg : (i % 3 === 1 ? M.paper : '#fff'), border: `2px solid ${M.ink}`, borderRadius: 99, fontSize: 12, fontWeight: 700, color: M.ink, boxShadow: `2px 2px 0 ${M.ink}`, transform: `rotate(${i % 2 === 0 ? -1 : 1}deg)`, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, backgroundColor: i % 2 === 0 ? M.clay : M.ocean }} />{a}
              </span>
            ))}
          </div>
        </MCard>

        {/* Top 10 */}
        <MCard shadow={M.clay} pad={16}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: M.clay, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>My Top 10</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 700, color: M.ink, letterSpacing: '-0.025em', lineHeight: 1.05 }}>The shelf I'd save<br /><span style={{ fontStyle: 'italic', color: M.clay }}>from a fire.</span></div>
            </div>
            <button style={{ padding: '6px 11px', borderRadius: 99, backgroundColor: '#fff', border: `2px solid ${M.ink}`, fontSize: 10, fontWeight: 800, color: M.ink, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, boxShadow: `2px 2px 0 ${M.ink}` }}><Icon name="heart" size={10} stroke={M.clay} /> 47</button>
          </div>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingTop: 10, paddingBottom: 4, scrollbarWidth: 'none' }}>
            {MP_TOP10.map((b, i) => (
              <div key={b.isbn} style={{ width: 84, flexShrink: 0, position: 'relative', transform: `rotate(${i % 2 === 0 ? -1 : 1}deg)` }}>
                <div style={{ position: 'absolute', top: -8, left: -8, zIndex: 2, width: 28, height: 28, borderRadius: 99, backgroundColor: i === 0 ? M.butter : (i < 3 ? M.clay : M.ink), color: i === 0 ? M.ink : '#fff', fontFamily: 'Fraunces, serif', fontSize: 14, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${M.ink}`, boxShadow: `2px 2px 0 ${M.ink}` }}>{i + 1}</div>
                <div style={{ border: `2px solid ${M.ink}`, boxShadow: `4px 4px 0 ${i % 2 === 0 ? M.clay : M.ocean}`, borderRadius: 4, overflow: 'hidden' }}>
                  <BookCover isbn={b.isbn} title={b.title} author="" hue={b.hue} style={{ width: '100%', display: 'block' }} />
                </div>
              </div>
            ))}
          </div>
        </MCard>

        {/* Custom lists */}
        <div>
          <MSection eyebrow="Custom lists" color={M.ocean}>Other shelves <em style={{ color: M.ocean }}>in rotation</em></MSection>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {MP_LISTS.map(l => (
              <MCard key={l.name} shadow={l.accent} pad={14} style={{ width: 220, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: l.accent, color: '#fff', border: `2px solid ${M.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 900 }}>{l.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 700, color: M.ink, lineHeight: 1.05 }}>{l.name}</div>
                    <div style={{ fontSize: 9, color: M.ink2, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l.count} books</div>
                  </div>
                </div>
                <div style={{ position: 'relative', height: 80 }}>
                  {l.books.map((b, i) => (
                    <div key={b.isbn} style={{ position: 'absolute', left: i * 34, top: 0, width: 54, border: `2px solid ${M.ink}`, borderRadius: 3, overflow: 'hidden', transform: `rotate(${(i - 1) * 2}deg)`, boxShadow: `2px 2px 0 ${M.ink}`, zIndex: 3 - i }}>
                      <BookCover isbn={b.isbn} title="" author="" hue={b.hue} style={{ width: '100%', display: 'block' }} />
                    </div>
                  ))}
                </div>
              </MCard>
            ))}
          </div>
        </div>

        {/* Library snapshot */}
        <MCard shadow={M.ink} pad={16}>
          <div style={{ fontSize: 9, fontWeight: 800, color: M.clay, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Library</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 19, fontWeight: 700, color: M.ink, letterSpacing: '-0.02em', marginBottom: 14 }}>{isOwn ? 'Your shelf' : `${u.name.split(' ')[0]}'s shelf`} <span style={{ color: M.ink3, fontStyle: 'italic', fontWeight: 500 }}>— 92 books</span></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
            {libFilters.map(f => (
              <button key={f.id} onClick={() => setLibFilter(f.id)} style={{ padding: '5px 12px', borderRadius: 99, backgroundColor: libFilter === f.id ? M.ink : 'transparent', color: libFilter === f.id ? M.bg : M.ink, border: `1.5px solid ${M.ink}`, fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                {f.label}<span style={{ padding: '1px 5px', borderRadius: 99, backgroundColor: libFilter === f.id ? M.clay : M.bg, color: libFilter === f.id ? '#fff' : M.ink, fontSize: 8, fontWeight: 900, border: libFilter === f.id ? 'none' : `1px solid ${M.ink}` }}>{f.count}</span>
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {MP_TOP10.slice(0, 8).concat(MP_TOP10).slice(0, 8).map((b, i) => (
              <div key={i} style={{ border: `2px solid ${M.ink}`, boxShadow: `3px 3px 0 ${M.ink}`, borderRadius: 3, overflow: 'hidden' }}>
                <BookCover isbn={b.isbn} title="" author="" hue={b.hue} style={{ width: '100%', display: 'block' }} />
              </div>
            ))}
          </div>
        </MCard>

        {/* Social tabs */}
        <MPSocialTabs isOwn={isOwn} name={u.name} />
      </div>
    </MScreen>
  );
}

function ProfileMobileOwn() { return <ProfileMobile isOwn={true} />; }
function ProfileMobileOther() { return <ProfileMobile isOwn={false} />; }

window.ProfileMobileOwn = ProfileMobileOwn;
window.ProfileMobileOther = ProfileMobileOther;
