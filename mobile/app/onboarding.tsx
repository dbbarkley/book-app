/**
 * app/onboarding.tsx
 * New-user setup: Welcome → Import → Genres → Authors
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import * as Haptics from 'expo-haptics'
import {
  useAuth, useOnboarding, useImportStatus, apiClient,
} from '@book-app/shared'
import type { Author } from '@book-app/shared'
import {
  BookOpen, Upload, Star, ArrowRight, Check, ArrowLeft,
  FileText, X, Search,
} from 'lucide-react-native'
import Avatar from '@/components/Avatar'
import { Colors } from '@/constants/colors'

// ── Constants ─────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4

const GENRES = [
  { id: 'fiction',      name: 'Fiction' },
  { id: 'non-fiction',  name: 'Non-Fiction' },
  { id: 'mystery',      name: 'Mystery' },
  { id: 'thriller',     name: 'Thriller' },
  { id: 'romance',      name: 'Romance' },
  { id: 'sci-fi',       name: 'Science Fiction' },
  { id: 'fantasy',      name: 'Fantasy' },
  { id: 'horror',       name: 'Horror' },
  { id: 'historical',   name: 'Historical Fiction' },
  { id: 'biography',    name: 'Biography' },
  { id: 'memoir',       name: 'Memoir' },
  { id: 'self-help',    name: 'Self-Help' },
  { id: 'business',     name: 'Business' },
  { id: 'philosophy',   name: 'Philosophy' },
  { id: 'poetry',       name: 'Poetry' },
  { id: 'young-adult',  name: 'Young Adult' },
  { id: 'graphic-novel',name: 'Graphic Novels' },
  { id: 'children',     name: "Children's" },
]

// ── CSV parsing ───────────────────────────────────────────────────────────────

interface CsvPreview {
  totalBooks: number
  booksByShelf: { read: number; reading: number; toRead: number }
  sampleBooks: Array<{ title: string; author: string; shelf: string }>
}

function parseCsv(text: string): CsvPreview {
  const lines = text.split('\n')
  const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))

  const titleIdx  = headers.findIndex((h) => h === 'Title')
  const authorIdx = headers.findIndex((h) => h === 'Author')
  const shelfIdx  = headers.findIndex((h) => h === 'Exclusive Shelf')

  const counts = { read: 0, reading: 0, toRead: 0 }
  const sample: CsvPreview['sampleBooks'] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Simple CSV parse that handles quoted fields
    const values: string[] = []
    let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { values.push(cur.trim()); cur = '' }
      else { cur += ch }
    }
    values.push(cur.trim())

    const title  = values[titleIdx]?.replace(/"/g, '').trim()
    const author = values[authorIdx]?.replace(/"/g, '').trim()
    const raw    = values[shelfIdx]?.replace(/"/g, '').trim().toLowerCase() ?? ''

    if (!title || !author) continue

    let shelf: string
    if (raw === 'read') { shelf = 'read'; counts.read++ }
    else if (raw === 'currently-reading') { shelf = 'reading'; counts.reading++ }
    else { shelf = 'to-read'; counts.toRead++ }

    if (sample.length < 5) sample.push({ title, author, shelf })
  }

  return {
    totalBooks: counts.read + counts.reading + counts.toRead,
    booksByShelf: counts,
    sampleBooks: sample,
  }
}

// ── Progress dots ─────────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={dotStyles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            dotStyles.dot,
            i === current  && dotStyles.active,
            i < current    && dotStyles.done,
          ]}
        />
      ))}
    </View>
  )
}

const dotStyles = StyleSheet.create({
  row:    { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.rim },
  active: { width: 24, backgroundColor: Colors.accent },
  done:   { backgroundColor: Colors.accent, opacity: 0.45 },
})

// ── Step 0: Welcome ───────────────────────────────────────────────────────────

function WelcomeStep() {
  const items = [
    {
      icon: <Upload size={18} color={Colors.accent} />,
      title: 'Import your Goodreads library',
      sub: 'Bring over your books, ratings & shelves instantly',
    },
    {
      icon: <BookOpen size={18} color={Colors.accent} />,
      title: 'Pick genres you love',
      sub: "We'll personalise your recommendations",
    },
    {
      icon: <Star size={18} color={Colors.accent} />,
      title: 'Add your favourite authors',
      sub: 'Get notified when they release new books',
    },
  ]

  return (
    <View style={styles.stepPad}>
      <View style={welcomeStyles.hero}>
        <View style={welcomeStyles.iconRing}>
          <BookOpen size={36} color={Colors.accent} />
        </View>
        <Text style={welcomeStyles.title}>Welcome to WellRead</Text>
        <Text style={welcomeStyles.sub}>
          Your personal library — private by default, always yours.
          This quick setup takes about 2 minutes.
        </Text>
      </View>

      <View style={welcomeStyles.cards}>
        {items.map((item) => (
          <View key={item.title} style={welcomeStyles.card}>
            <View style={welcomeStyles.cardIcon}>{item.icon}</View>
            <View style={{ flex: 1 }}>
              <Text style={welcomeStyles.cardTitle}>{item.title}</Text>
              <Text style={welcomeStyles.cardSub}>{item.sub}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

const welcomeStyles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: 8, gap: 12, marginBottom: 24 },
  iconRing: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.lit, textAlign: 'center', letterSpacing: -0.5 },
  sub: { fontSize: 14, color: Colors.lit2, textAlign: 'center', lineHeight: 21, paddingHorizontal: 8 },
  cards: { gap: 10 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
    borderRadius: 16, padding: 16,
  },
  cardIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.grove,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.lit, marginBottom: 2 },
  cardSub:   { fontSize: 12, color: Colors.lit3, lineHeight: 17 },
})

// ── Step 1: Import ────────────────────────────────────────────────────────────

type ImportPhase = 'idle' | 'parsing' | 'preview' | 'uploading' | 'tracking' | 'done'

interface PickedFile {
  uri: string
  name: string
  size?: number
}

function ImportStep({ onSkip, onDone }: { onSkip: () => void; onDone: () => void }) {
  const [phase,     setPhase]     = useState<ImportPhase>('idle')
  const [picked,    setPicked]    = useState<PickedFile | null>(null)
  const [preview,   setPreview]   = useState<CsvPreview | null>(null)
  const [parseErr,  setParseErr]  = useState<string | null>(null)
  const [importId,  setImportId]  = useState<number | null>(null)
  const [uploadErr, setUploadErr] = useState<string | null>(null)

  const { status } = useImportStatus(importId, phase === 'tracking')

  // Advance to done once tracking completes
  useEffect(() => {
    if (phase === 'tracking' && (status?.status === 'completed' || status?.status === 'failed')) {
      setPhase('done')
      onDone()
    }
  }, [phase, status, onDone])

  const handlePick = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'public.comma-separated-values-text'],
        copyToCacheDirectory: true,
      })
      if (result.canceled) return

      const asset = result.assets[0]
      setPicked({ uri: asset.uri, name: asset.name, size: asset.size })
      setParseErr(null)
      setPhase('parsing')

      try {
        const text = await FileSystem.readAsStringAsync(asset.uri)
        const parsed = parseCsv(text)
        if (parsed.totalBooks === 0) {
          setParseErr('No books found — make sure this is a Goodreads CSV export.')
          setPhase('idle')
          return
        }
        setPreview(parsed)
        setPhase('preview')
      } catch {
        setParseErr('Could not read the file. Please try again.')
        setPhase('idle')
      }
    } catch {
      // user cancelled or picker error — stay idle
    }
  }, [])

  const handleUpload = useCallback(async () => {
    if (!picked) return
    setUploadErr(null)
    setPhase('uploading')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    try {
      const response = await apiClient.uploadGoodreadsCsv({
        uri:  picked.uri,
        name: picked.name,
        type: 'text/csv',
      })
      setImportId(response.import.id)
      setPhase('tracking')
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Upload failed'
      setUploadErr(msg)
      setPhase('preview')
    }
  }, [picked])

  const handleReset = () => {
    setPicked(null)
    setPreview(null)
    setParseErr(null)
    setUploadErr(null)
    setImportId(null)
    setPhase('idle')
  }

  // ── Idle ───────────────────────────────────────────────────────────────────
  if (phase === 'idle' || phase === 'parsing') {
    return (
      <View style={styles.stepPad}>
        {/* Instructions */}
        <View style={importStyles.instructionCard}>
          <Text style={importStyles.instructionHeader}>How it works</Text>
          {[
            'Open goodreads.com in your browser and sign in',
            'Go to My Books → Tools → Export Library',
            'Download the CSV file Goodreads emails you',
            'Come back here and tap "Select CSV file" below',
          ].map((step, i) => (
            <View key={i} style={importStyles.instructionRow}>
              <View style={importStyles.stepNum}>
                <Text style={importStyles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={importStyles.instructionText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Platform note */}
        <View style={importStyles.noteCard}>
          <Text style={importStyles.noteText}>
            💡 On iPhone, the CSV will land in your Files app or Mail. On Android it goes to Downloads.
          </Text>
        </View>

        {parseErr && (
          <View style={importStyles.errorCard}>
            <Text style={importStyles.errorText}>{parseErr}</Text>
          </View>
        )}

        <TouchableOpacity
          style={importStyles.pickBtn}
          onPress={handlePick}
          disabled={phase === 'parsing'}
          activeOpacity={0.8}
        >
          {phase === 'parsing' ? (
            <ActivityIndicator color={Colors.accentOn} />
          ) : (
            <>
              <FileText size={18} color={Colors.accentOn} />
              <Text style={importStyles.pickBtnText}>Select CSV file</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onSkip} style={importStyles.skipLink} activeOpacity={0.7}>
          <Text style={importStyles.skipLinkText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // ── Preview ────────────────────────────────────────────────────────────────
  if (phase === 'preview' && preview) {
    return (
      <View style={styles.stepPad}>
        {/* File badge */}
        <View style={importStyles.fileBadge}>
          <FileText size={16} color={Colors.accent} />
          <Text style={importStyles.fileName} numberOfLines={1}>{picked?.name}</Text>
          <TouchableOpacity onPress={handleReset} hitSlop={8}>
            <X size={16} color={Colors.lit3} />
          </TouchableOpacity>
        </View>

        {/* Counts */}
        <View style={importStyles.countsRow}>
          <View style={importStyles.countCard}>
            <Text style={importStyles.countNum}>{preview.totalBooks}</Text>
            <Text style={importStyles.countLabel}>Total books</Text>
          </View>
          <View style={importStyles.countCard}>
            <Text style={importStyles.countNum}>{preview.booksByShelf.read}</Text>
            <Text style={importStyles.countLabel}>Read</Text>
          </View>
          <View style={importStyles.countCard}>
            <Text style={importStyles.countNum}>{preview.booksByShelf.toRead}</Text>
            <Text style={importStyles.countLabel}>Want to read</Text>
          </View>
        </View>

        {/* Sample books */}
        {preview.sampleBooks.length > 0 && (
          <View style={importStyles.sampleCard}>
            <Text style={importStyles.sampleHeader}>Sample books</Text>
            {preview.sampleBooks.map((b, i) => (
              <View key={i} style={importStyles.sampleRow}>
                <BookOpen size={13} color={Colors.lit3} />
                <Text style={importStyles.sampleTitle} numberOfLines={1}>{b.title}</Text>
                <Text style={importStyles.sampleAuthor} numberOfLines={1}>— {b.author}</Text>
              </View>
            ))}
          </View>
        )}

        {uploadErr && (
          <View style={importStyles.errorCard}>
            <Text style={importStyles.errorText}>{uploadErr}</Text>
          </View>
        )}

        <TouchableOpacity style={importStyles.pickBtn} onPress={handleUpload} activeOpacity={0.8}>
          <Upload size={18} color={Colors.accentOn} />
          <Text style={importStyles.pickBtnText}>Import {preview.totalBooks} books</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleReset} style={importStyles.skipLink} activeOpacity={0.7}>
          <Text style={importStyles.skipLinkText}>Choose a different file</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // ── Uploading ──────────────────────────────────────────────────────────────
  if (phase === 'uploading') {
    return (
      <View style={[styles.stepPad, importStyles.centred]}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={importStyles.trackingLabel}>Uploading your library…</Text>
      </View>
    )
  }

  // ── Tracking ───────────────────────────────────────────────────────────────
  if (phase === 'tracking') {
    const pct   = status?.progress_percentage ?? 0
    const done  = status?.processed_books ?? 0
    const total = status?.total_books ?? 0

    return (
      <View style={[styles.stepPad, importStyles.centred]}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={importStyles.trackingLabel}>Importing your books…</Text>
        {total > 0 && (
          <>
            <View style={importStyles.progressTrack}>
              <View style={[importStyles.progressFill, { width: `${pct}%` }]} />
            </View>
            <Text style={importStyles.trackingCount}>{done} / {total} books</Text>
          </>
        )}
      </View>
    )
  }

  // ── Done ───────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    const succeeded = status?.successful_imports ?? 0
    const failed    = status?.failed_imports ?? 0
    const wasFailed = status?.status === 'failed'

    return (
      <View style={[styles.stepPad, importStyles.centred]}>
        <View style={[importStyles.doneIcon, wasFailed && importStyles.doneIconError]}>
          <Check size={28} color={wasFailed ? Colors.error : Colors.accentOn} />
        </View>
        <Text style={importStyles.doneTitle}>
          {wasFailed ? 'Import failed' : 'Import complete!'}
        </Text>
        {!wasFailed && (
          <Text style={importStyles.doneSub}>
            {succeeded} book{succeeded !== 1 ? 's' : ''} added to your library
            {failed > 0 ? ` (${failed} skipped)` : ''}
          </Text>
        )}
        {wasFailed && status?.error_message && (
          <Text style={importStyles.doneSub}>{status.error_message}</Text>
        )}
      </View>
    )
  }

  return null
}

const importStyles = StyleSheet.create({
  instructionCard: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
    borderRadius: 16, padding: 16, gap: 12,
  },
  instructionHeader: { fontSize: 11, fontWeight: '700', color: Colors.lit3, letterSpacing: 0.8, textTransform: 'uppercase' },
  instructionRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNum: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepNumText:       { fontSize: 11, fontWeight: '800', color: Colors.accentOn },
  instructionText:   { flex: 1, fontSize: 13, color: Colors.lit2, lineHeight: 19 },

  noteCard: {
    backgroundColor: `${Colors.accent}18`,
    borderWidth: 1, borderColor: `${Colors.accent}35`,
    borderRadius: 12, padding: 12, marginTop: 4,
  },
  noteText: { fontSize: 12, color: Colors.lit2, lineHeight: 18 },

  errorCard: {
    backgroundColor: 'rgba(217,83,79,0.12)', borderWidth: 1,
    borderColor: 'rgba(217,83,79,0.35)', borderRadius: 12, padding: 12,
  },
  errorText: { fontSize: 13, color: Colors.error },

  pickBtn: {
    height: 52, borderRadius: 14, backgroundColor: Colors.accent,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginTop: 8,
  },
  pickBtnText: { fontSize: 15, fontWeight: '700', color: Colors.accentOn },

  skipLink:     { alignItems: 'center', paddingVertical: 14 },
  skipLinkText: { fontSize: 13, color: Colors.lit3 },

  fileBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
    borderRadius: 12, padding: 12,
  },
  fileName: { flex: 1, fontSize: 13, color: Colors.lit2 },

  countsRow: { flexDirection: 'row', gap: 10 },
  countCard: {
    flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
    borderRadius: 12, padding: 14, alignItems: 'center', gap: 2,
  },
  countNum:   { fontSize: 22, fontWeight: '800', color: Colors.lit },
  countLabel: { fontSize: 11, color: Colors.lit3 },

  sampleCard: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
    borderRadius: 14, padding: 14, gap: 8,
  },
  sampleHeader: { fontSize: 11, fontWeight: '700', color: Colors.lit3, textTransform: 'uppercase', letterSpacing: 0.6 },
  sampleRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sampleTitle:  { flex: 1, fontSize: 13, color: Colors.lit, fontWeight: '600' },
  sampleAuthor: { fontSize: 12, color: Colors.lit3, flexShrink: 1 },

  centred:        { alignItems: 'center', justifyContent: 'center', gap: 16, minHeight: 220 },
  trackingLabel:  { fontSize: 15, fontWeight: '600', color: Colors.lit },
  trackingCount:  { fontSize: 13, color: Colors.lit3 },
  progressTrack: {
    width: '100%', height: 6, borderRadius: 3,
    backgroundColor: Colors.grove, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 3, backgroundColor: Colors.accent,
  },
  doneIcon: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  doneIconError: { backgroundColor: 'rgba(217,83,79,0.2)' },
  doneTitle:     { fontSize: 18, fontWeight: '800', color: Colors.lit },
  doneSub:       { fontSize: 13, color: Colors.lit2, textAlign: 'center' },
})

// ── Step 2: Genres ────────────────────────────────────────────────────────────

function GenresStep({
  selected,
  onToggle,
}: {
  selected: string[]
  onToggle: (id: string) => void
}) {
  return (
    <View style={styles.stepPad}>
      <Text style={genreStyles.hint}>Pick at least one to continue</Text>
      <View style={genreStyles.grid}>
        {GENRES.map((g) => {
          const isOn = selected.includes(g.id)
          return (
            <TouchableOpacity
              key={g.id}
              style={[genreStyles.chip, isOn && genreStyles.chipOn]}
              onPress={() => {
                Haptics.selectionAsync()
                onToggle(g.id)
              }}
              activeOpacity={0.75}
            >
              {isOn && <Check size={12} color={Colors.accentOn} strokeWidth={3} />}
              <Text style={[genreStyles.chipText, isOn && genreStyles.chipTextOn]}>
                {g.name}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const genreStyles = StyleSheet.create({
  hint: { fontSize: 13, color: Colors.lit3, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 50, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.rim,
  },
  chipOn:     { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText:   { fontSize: 13, fontWeight: '600', color: Colors.lit2 },
  chipTextOn: { color: Colors.accentOn },
})

// ── Step 3: Authors ───────────────────────────────────────────────────────────

function AuthorsStep({
  selected,
  onToggle,
}: {
  selected: number[]
  onToggle: (id: number) => void
}) {
  const [authors,  setAuthors]  = useState<Author[]>([])
  const [query,    setQuery]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const searchRef = useRef(0)

  const loadAuthors = useCallback(async (q: string) => {
    const id = ++searchRef.current
    setLoading(true)
    try {
      const res = q
        ? await apiClient.searchAuthors(q, 1, 50)
        : await apiClient.getAuthors({ per_page: 80 })
      if (id !== searchRef.current) return
      setAuthors(Array.isArray(res) ? res : (res as any).authors ?? [])
    } catch {}
    finally { if (id === searchRef.current) setLoading(false) }
  }, [])

  useEffect(() => { loadAuthors('') }, [loadAuthors])

  useEffect(() => {
    const t = setTimeout(() => loadAuthors(query), 300)
    return () => clearTimeout(t)
  }, [query, loadAuthors])

  return (
    <View style={[styles.stepPad, { flex: 1 }]}>
      <Text style={authorStyles.hint}>Pick at least one to continue</Text>

      {/* Search */}
      <View style={authorStyles.searchWrap}>
        <Search size={16} color={Colors.lit3} style={{ flexShrink: 0 }} />
        <TextInput
          style={authorStyles.searchInput}
          placeholder="Search authors…"
          placeholderTextColor={Colors.lit3}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
            <X size={15} color={Colors.lit3} />
          </TouchableOpacity>
        )}
      </View>

      {loading && authors.length === 0 ? (
        <View style={authorStyles.loader}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : authors.length === 0 ? (
        <Text style={authorStyles.empty}>No authors found</Text>
      ) : (
        <View>
          {authors.map((a, idx) => {
            const isOn = selected.includes(a.id)
            return (
              <View key={String(a.id)}>
                {idx > 0 && <View style={authorStyles.sep} />}
                <TouchableOpacity
                  style={authorStyles.row}
                  onPress={() => {
                    Haptics.selectionAsync()
                    onToggle(a.id)
                  }}
                  activeOpacity={0.8}
                >
                  <Avatar
                    uri={a.avatar_url}
                    name={a.name}
                    size={40}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={authorStyles.name} numberOfLines={1}>{a.name}</Text>
                    {a.books_count != null && (
                      <Text style={authorStyles.meta}>{a.books_count} book{a.books_count !== 1 ? 's' : ''}</Text>
                    )}
                  </View>
                  <View style={[authorStyles.followBtn, isOn && authorStyles.followBtnOn]}>
                    <Star size={14} color={isOn ? Colors.accentOn : Colors.lit2} />
                    <Text style={[authorStyles.followText, isOn && authorStyles.followTextOn]}>
                      {isOn ? 'Favourited' : 'Favourite'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}

const authorStyles = StyleSheet.create({
  hint: { fontSize: 13, color: Colors.lit3, marginBottom: 12 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
    borderRadius: 14, paddingHorizontal: 14, height: 44,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.lit },
  loader: { paddingVertical: 40, alignItems: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
  },
  sep:    { height: 1, backgroundColor: Colors.rim },
  name:   { fontSize: 14, fontWeight: '600', color: Colors.lit },
  meta:   { fontSize: 12, color: Colors.lit3, marginTop: 1 },
  followBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
  },
  followBtnOn:  { backgroundColor: Colors.accent, borderColor: Colors.accent },
  followText:   { fontSize: 12, fontWeight: '700', color: Colors.lit2 },
  followTextOn: { color: Colors.accentOn },
  empty: { textAlign: 'center', color: Colors.lit3, paddingVertical: 24, fontSize: 13 },
})

// ── Screen ────────────────────────────────────────────────────────────────────

const STEPS = [
  { title: 'Welcome',           sub: "Let's get your library set up" },
  { title: 'Import Your Books', sub: 'Bring your reading history over in seconds' },
  { title: 'Your Genres',       sub: "We'll use these to personalise your recommendations" },
  { title: 'Favourite Authors',  sub: 'Add authors you love to personalise your recommendations' },
]

export default function OnboardingScreen() {
  const router  = useRouter()
  const insets  = useSafeAreaInsets()
  const { refreshUser } = useAuth()
  const {
    selectedGenres, selectedAuthorIds,
    toggleGenre, toggleAuthor,
    submitPreferences, skipOnboarding,
    isLoading, error,
  } = useOnboarding()

  const [step,       setStep]       = useState(0)
  const [importDone, setImportDone] = useState(false)

  const isLastStep   = step === TOTAL_STEPS - 1
  const isImportStep = step === 1

  const nextDisabled =
    (step === 2 && selectedGenres.length === 0) ||
    (step === 3 && selectedAuthorIds.length === 0)

  const handleNext = async () => {
    if (isLastStep) {
      const result = await submitPreferences()
      if (result.success) {
        router.replace('/(tabs)')
        refreshUser().catch(() => {})
      }
      return
    }
    setStep((s) => s + 1)
  }

  const handleBack = () => setStep((s) => Math.max(0, s - 1))

  const handleSkipImport = () => setStep(2)

  const handleSkipAll = async () => {
    Alert.alert(
      'Skip setup?',
      'You can always set your preferences later from your profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: async () => {
            const result = await skipOnboarding()
            if (result.success) {
              router.replace('/(tabs)')
              refreshUser().catch(() => {})
            }
          },
        },
      ]
    )
  }

  const nextLabel = isLastStep ? 'Finish Setup'
    : isImportStep && !importDone ? 'Skip import'
    : 'Next'

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.canvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[headerStyles.wrap, { paddingTop: insets.top + 12 }]}>
        <View style={headerStyles.left}>
          {step > 0 && (
            <TouchableOpacity onPress={handleBack} style={headerStyles.back} hitSlop={8}>
              <ArrowLeft size={20} color={Colors.lit2} />
            </TouchableOpacity>
          )}
        </View>

        <StepDots current={step} total={TOTAL_STEPS} />

        <TouchableOpacity onPress={handleSkipAll} style={headerStyles.right} hitSlop={8}>
          <Text style={headerStyles.skipAll}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Step title */}
      <View style={titleStyles.wrap}>
        <Text style={titleStyles.title}>{STEPS[step].title}</Text>
        <Text style={titleStyles.sub}>{STEPS[step].sub}</Text>
      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {/* Step content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && <WelcomeStep />}
        {step === 1 && (
          <ImportStep
            onSkip={handleSkipImport}
            onDone={() => setImportDone(true)}
          />
        )}
        {step === 2 && (
          <GenresStep selected={selectedGenres} onToggle={toggleGenre} />
        )}
        {step === 3 && (
          <AuthorsStep selected={selectedAuthorIds} onToggle={toggleAuthor} />
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[footerStyles.wrap, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[footerStyles.btn, nextDisabled && footerStyles.btnDisabled]}
          onPress={handleNext}
          disabled={isLoading || nextDisabled}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.accentOn} />
          ) : (
            <>
              <Text style={footerStyles.btnText}>{nextLabel}</Text>
              {!isLastStep && !isImportStep && (
                <ArrowRight size={16} color={Colors.accentOn} />
              )}
              {isLastStep && <Check size={16} color={Colors.accentOn} />}
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  stepPad:         { paddingHorizontal: 20, paddingTop: 4, gap: 14 },
  errorBanner: {
    marginHorizontal: 20, marginBottom: 8,
    backgroundColor: 'rgba(217,83,79,0.12)', borderWidth: 1,
    borderColor: 'rgba(217,83,79,0.35)', borderRadius: 12, padding: 12,
  },
  errorBannerText: { fontSize: 13, color: Colors.error },
})

const headerStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 8,
  },
  left:  { width: 40 },
  right: { width: 40, alignItems: 'flex-end' },
  back:  { padding: 4 },
  skipAll: { fontSize: 13, color: Colors.lit3 },
})

const titleStyles = StyleSheet.create({
  wrap:  { paddingHorizontal: 20, paddingBottom: 16, gap: 4 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.lit, letterSpacing: -0.4 },
  sub:   { fontSize: 13, color: Colors.lit2 },
})

const footerStyles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.rim },
  btn: {
    height: 52, borderRadius: 14,
    backgroundColor: Colors.accent,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnDisabled: { opacity: 0.4 },
  btnText:     { fontSize: 15, fontWeight: '700', color: Colors.accentOn },
})
