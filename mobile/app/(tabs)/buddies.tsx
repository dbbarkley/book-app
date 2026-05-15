import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useReadingBuddy, useAuth } from '@book-app/shared'
import type { ReadingBuddySession } from '@book-app/shared'
import { Clock, Users, ArrowDownLeft, Plus } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { Colors } from '@/constants/colors'
import BookCover from '@/components/BookCover'

// ─── Compare bars ─────────────────────────────────────────────────────────────
function CompareBar({
  myPct,
  partnerPct,
  partnerFirstName,
}: {
  myPct: number
  partnerPct: number
  partnerFirstName: string
}) {
  return (
    <View style={cb.wrap}>
      <View style={cb.row}>
        <Text style={[cb.label, { color: Colors.accent }]}>You</Text>
        <View style={cb.track}>
          <View style={[cb.fill, { width: `${Math.max(myPct, 1)}%`, backgroundColor: Colors.accent }]} />
        </View>
        <Text style={[cb.pct, { color: Colors.accent }]}>{myPct}%</Text>
      </View>
      <View style={cb.row}>
        <Text style={[cb.label, { color: Colors.partner }]} numberOfLines={1}>{partnerFirstName}</Text>
        <View style={cb.track}>
          <View style={[cb.fill, { width: `${Math.max(partnerPct, 1)}%`, backgroundColor: Colors.partner }]} />
        </View>
        <Text style={[cb.pct, { color: Colors.partner }]}>{partnerPct}%</Text>
      </View>
    </View>
  )
}
const cb = StyleSheet.create({
  wrap:  { gap: 5, marginTop: 4 },
  row:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase', width: 38 },
  track: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(237,228,220,0.1)', overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 2 },
  pct:   { fontSize: 11, fontWeight: '700', width: 28, textAlign: 'right' },
})

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  active:   { label: 'Reading',        dotColor: Colors.success,           textColor: Colors.success },
  pending:  { label: 'Awaiting',       dotColor: 'rgba(237,228,220,0.35)', textColor: 'rgba(237,228,220,0.5)' },
  declined: { label: 'Declined',       dotColor: 'rgba(237,228,220,0.25)', textColor: 'rgba(237,228,220,0.38)' },
  dnf:      { label: 'Did Not Finish', dotColor: 'rgba(237,228,220,0.25)', textColor: 'rgba(237,228,220,0.38)' },
}

// ─── Session card ─────────────────────────────────────────────────────────────
function SessionCard({
  session,
  userId,
  onPress,
}: {
  session: ReadingBuddySession
  userId:  number | undefined
  onPress: () => void
}) {
  const isInitiator = session.initiator.id === userId
  const partner     = isInitiator ? session.invited   : session.initiator
  const me          = isInitiator ? session.initiator : session.invited

  const cfg = session.status === 'pending'
    ? isInitiator
      ? { label: 'Sent',    dotColor: 'rgba(237,228,220,0.35)', textColor: 'rgba(237,228,220,0.5)' }
      : { label: 'Respond', dotColor: Colors.accent,            textColor: Colors.accent }
    : (STATUS_CFG[session.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending)

  const myPct        = me.progress?.completion_percentage      ?? 0
  const ptnPct       = partner.progress?.completion_percentage ?? 0
  const partnerName  = partner.display_name || partner.username
  const partnerFirst = partnerName.split(' ')[0]
  const isActive     = session.status === 'active'

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
      activeOpacity={0.8}
      style={[sc.card, isActive && sc.cardActive]}
      accessibilityRole="button"
      accessibilityLabel={`${session.book.title} with ${partnerName}, ${cfg.label}`}
    >
      {/* Book cover */}
      <View style={sc.coverWrap}>
        <BookCover
          uri={session.book.cover_image_url}
          title={session.book.title}
          author={session.book.author_name ?? undefined}
          width={50}
          borderRadius={6}
        />
      </View>

      {/* Body */}
      <View style={sc.body}>
        <View style={sc.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={sc.title} numberOfLines={1}>{session.book.title}</Text>
            {session.book.author_name && (
              <Text style={sc.author} numberOfLines={1}>{session.book.author_name}</Text>
            )}
          </View>
          <View style={sc.statusPill}>
            <View style={[sc.statusDot, { backgroundColor: cfg.dotColor as string }]} />
            <Text style={[sc.statusText, { color: cfg.textColor as string }]}>{cfg.label}</Text>
          </View>
        </View>

        <Text style={sc.partnerText}>
          with <Text style={sc.partnerName}>{partnerName}</Text>
        </Text>

        {isActive && (
          <CompareBar myPct={myPct} partnerPct={ptnPct} partnerFirstName={partnerFirst} />
        )}
      </View>
    </TouchableOpacity>
  )
}

const sc = StyleSheet.create({
  card: {
    borderRadius: 16, borderWidth: 1, borderColor: Colors.rim,
    backgroundColor: Colors.surface,
    padding: 12, flexDirection: 'row', gap: 12,
  },
  cardActive: {
    borderColor: 'rgba(201,168,76,0.28)',
    backgroundColor: 'rgba(201,168,76,0.04)',
  },
  coverWrap: {
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  body:      { flex: 1, gap: 4 },
  titleRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title:     { fontSize: 14, fontWeight: '700', color: Colors.lit, flex: 1, lineHeight: 19 },
  author:    { fontSize: 11, color: Colors.lit2, marginTop: 1 },
  statusPill:{
    flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0,
    paddingHorizontal: 7, paddingVertical: 3,
    backgroundColor: 'rgba(237,228,220,0.05)',
    borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(237,228,220,0.08)',
  },
  statusDot:  { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  partnerText:{ fontSize: 11, color: Colors.lit2 },
  partnerName:{ fontWeight: '600', color: Colors.lit },
})

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <View style={sk.outer}>
      <View style={sk.inner}>
        <View style={sk.cover} />
        <View style={{ flex: 1, gap: 9, paddingTop: 2 }}>
          <View style={[sk.line, { width: '72%' }]} />
          <View style={[sk.line, { width: '40%' }]} />
          <View style={[sk.line, { width: '55%' }]} />
        </View>
      </View>
    </View>
  )
}
const sk = StyleSheet.create({
  outer: { borderRadius: 22, borderWidth: 1, borderColor: 'rgba(237,228,220,0.06)', padding: 5, backgroundColor: 'rgba(237,228,220,0.02)' },
  inner: { backgroundColor: Colors.surface, borderRadius: 18, padding: 12, flexDirection: 'row', gap: 12 },
  cover: { width: 50, height: 75, borderRadius: 5, backgroundColor: Colors.grove, flexShrink: 0 },
  line:  { height: 10, borderRadius: 5, backgroundColor: Colors.grove },
})

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ icon, label, count }: { icon: React.ReactNode; label: string; count: number }) {
  return (
    <View style={sl.row}>
      {icon}
      <Text style={sl.text}>{label}</Text>
      <View style={sl.countWrap}>
        <Text style={sl.count}>{count}</Text>
      </View>
      <View style={sl.line} />
    </View>
  )
}
const sl = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  text:     { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: Colors.lit3 },
  countWrap:{ paddingHorizontal: 6, paddingVertical: 2, backgroundColor: 'rgba(237,228,220,0.06)', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(237,228,220,0.09)' },
  count:    { fontSize: 11, fontWeight: '700', color: Colors.lit3 },
  line:     { flex: 1, height: 1, backgroundColor: Colors.rim },
})

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onPress }: { onPress: () => void }) {
  return (
    <View style={es.wrap}>
      <View style={es.cluster}>
        <View style={[es.bookL, { transform: [{ rotate: '-7deg' }] }]} />
        <View style={es.bookC} />
        <View style={[es.bookR, { transform: [{ rotate: '6deg' }] }]} />
        <View style={es.badge}>
          <Users size={11} color={Colors.accentOn} />
        </View>
      </View>
      <Text style={es.title}>No reading buddies yet</Text>
      <Text style={es.body}>Find a book, then invite a friend to read it alongside you.</Text>
      <TouchableOpacity
        style={es.btn}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Browse books"
      >
        <Text style={es.btnText}>Browse books</Text>
        <View style={es.btnArrow}>
          <Text style={{ color: Colors.accentOn, fontSize: 12, fontWeight: '700' }}>→</Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}
const es = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  cluster: { width: 120, height: 90, marginBottom: 8 },
  bookL: {
    position: 'absolute', left: 0, bottom: 0, width: 44, height: 64,
    borderRadius: 5, borderTopRightRadius: 2, borderBottomRightRadius: 2,
    backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim,
    shadowColor: '#000', shadowOffset: { width: 3, height: 5 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 4,
  },
  bookC: {
    position: 'absolute', left: 35, bottom: 0, width: 50, height: 74,
    borderRadius: 5, borderTopRightRadius: 2, borderBottomRightRadius: 2,
    backgroundColor: 'rgba(201,168,76,0.14)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6, zIndex: 2,
  },
  bookR: {
    position: 'absolute', right: 0, bottom: 0, width: 40, height: 58,
    borderRadius: 5, borderTopRightRadius: 2, borderBottomRightRadius: 2,
    backgroundColor: 'rgba(76,175,80,0.1)',
    borderWidth: 1, borderColor: 'rgba(76,175,80,0.18)',
    shadowColor: '#000', shadowOffset: { width: 3, height: 5 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
  },
  badge: {
    position: 'absolute', top: 0, left: 47, zIndex: 3,
    backgroundColor: Colors.accent, borderRadius: 999, padding: 5,
    shadowColor: Colors.accent, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, shadowOffset: { width: 0, height: 2 },
  },
  title:    { fontSize: 18, fontWeight: '700', color: Colors.lit, textAlign: 'center' },
  body:     { fontSize: 13, color: Colors.lit3, textAlign: 'center', lineHeight: 20, maxWidth: 240 },
  btn:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Colors.accent, borderRadius: 999, marginTop: 4 },
  btnText:  { fontSize: 14, fontWeight: '700', color: Colors.accentOn },
  btnArrow: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(13,26,15,0.22)', alignItems: 'center', justifyContent: 'center' },
})

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BuddiesScreen() {
  const router   = useRouter()
  const insets   = useSafeAreaInsets()
  const { user } = useAuth()
  const { sessions, sessionsLoading, fetchSessions } = useReadingBuddy()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try { await fetchSessions() } finally { setRefreshing(false) }
  }, [fetchSessions])

  const active          = sessions.filter(s => s.status === 'active')
  const pendingIncoming = sessions.filter(s => s.status === 'pending' && s.invited.id    === user?.id)
  const pendingOutgoing = sessions.filter(s => s.status === 'pending' && s.initiator.id  === user?.id)
  const closed          = sessions.filter(s => s.status === 'declined' || s.status === 'dnf')

  const goToSession = (id: number) => router.push(`/reading-buddy/${id}` as any)

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heading}>Reading Buddies</Text>
            <Text style={styles.subheading}>Read alongside friends. Track progress and discuss as you go.</Text>
          </View>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => router.push('/reading-buddy/invite' as any)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Invite a friend to read together"
          >
            <Plus size={18} color={Colors.accentOn} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {sessionsLoading && !refreshing ? (
        <View style={styles.skeletonList}>
          {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
        </View>
      ) : sessions.length === 0 ? (
        <EmptyState onPress={() => router.push('/reading-buddy/invite' as any)} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 28 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.accent}
              colors={[Colors.accent]}
            />
          }
        >
          {active.length > 0 && (
            <View style={styles.section}>
              {active.map(s => (
                <SessionCard key={s.id} session={s} userId={user?.id} onPress={() => goToSession(s.id)} />
              ))}
            </View>
          )}

          {pendingIncoming.length > 0 && (
            <View style={styles.section}>
              <SectionLabel
                icon={<ArrowDownLeft size={10} color={Colors.accent} />}
                label="Respond"
                count={pendingIncoming.length}
              />
              {pendingIncoming.map(s => (
                <SessionCard key={s.id} session={s} userId={user?.id} onPress={() => goToSession(s.id)} />
              ))}
            </View>
          )}

          {pendingOutgoing.length > 0 && (
            <View style={styles.section}>
              <SectionLabel
                icon={<Clock size={10} color={Colors.lit3} />}
                label="Waiting on them"
                count={pendingOutgoing.length}
              />
              {pendingOutgoing.map(s => (
                <SessionCard key={s.id} session={s} userId={user?.id} onPress={() => goToSession(s.id)} />
              ))}
            </View>
          )}

          {closed.length > 0 && (
            <View style={styles.section}>
              {closed.map(s => (
                <SessionCard key={s.id} session={s} userId={user?.id} onPress={() => goToSession(s.id)} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.canvas },
  header:     { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: Colors.rim },
  headerRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  heading:    { fontSize: 26, fontWeight: '800', color: Colors.lit, letterSpacing: -0.5, marginBottom: 4 },
  subheading: { fontSize: 12, color: Colors.lit3, lineHeight: 17 },
  newBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  skeletonList: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  list:       { paddingHorizontal: 16, paddingTop: 16, gap: 20 },
  section:    { gap: 10 },
})
