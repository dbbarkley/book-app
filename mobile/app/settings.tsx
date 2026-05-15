/**
 * app/settings.tsx — app settings & account management
 * Stack route (not a tab). Accessible from profile screen.
 */
import { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Switch, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import Constants from 'expo-constants'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth, useAuthStore, useMilestones, apiClient } from '@book-app/shared'
import {
  LogOut, Bell, Info, User,
  ChevronRight, Mail, Target, List, Upload,
} from 'lucide-react-native'
import ReadingGoalModal from '@/components/ReadingGoalModal'
import ScreenHeader from '@/components/ScreenHeader'
import { Colors } from '@/constants/colors'

// ── Row helpers ────────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return <Text style={styles.sectionHeader}>{label}</Text>
}

function SettingRow({
  icon, label, value, onPress, toggle, toggled, last,
}: {
  icon:     React.ReactNode
  label:    string
  value?:   string
  onPress?: () => void
  toggle?:  boolean
  toggled?: boolean
  last?:    boolean
}) {
  return (
    <TouchableOpacity
      style={[styles.row, last && styles.rowLast]}
      onPress={onPress}
      disabled={!onPress && !toggle}
      activeOpacity={0.7}
    >
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {toggle !== undefined
          ? <Switch
              value={toggled}
              onValueChange={onPress as any}
              trackColor={{ false: Colors.grove, true: Colors.accent }}
              thumbColor={Colors.canvas}
            />
          : value
            ? <Text style={styles.rowValue}>{value}</Text>
            : <ChevronRight size={16} color={Colors.lit3} />
        }
      </View>
    </TouchableOpacity>
  )
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { logout } = useAuth()
  const user = useAuthStore((s) => s.user)
  const { readingGoal, setGoal, isLoading: goalSaving } = useMilestones()

  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [goalInput,     setGoalInput]     = useState('')
  const [top10Loading,  setTop10Loading]  = useState(false)

  const handleOpenGoalModal = () => {
    setGoalInput(readingGoal ? String(readingGoal) : '')
    setGoalModalOpen(true)
  }

  const handleSaveGoal = async () => {
    const n = parseInt(goalInput, 10)
    if (isNaN(n) || n < 1) {
      Alert.alert('Invalid goal', 'Please enter a number greater than 0.')
      return
    }
    await setGoal(n)
    setGoalModalOpen(false)
  }

  const handleTop10 = async () => {
    if (!user?.id) return
    setTop10Loading(true)
    try {
      const list = await apiClient.getOrCreateTop10List(user.id)
      router.push(`/list/${list.id}` as any)
    } catch {
      Alert.alert('Error', 'Could not open your Top 10 list.')
    } finally {
      setTop10Loading(false)
    }
  }

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Settings" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Account */}
        <SectionHeader label="Account" />
        <View style={styles.card}>
          <SettingRow
            icon={<User size={16} color={Colors.lit2} />}
            label="Edit Profile"
            onPress={() => router.push('/edit-profile')}
          />
          <SettingRow
            icon={<Mail size={16} color={Colors.lit2} />}
            label="Email"
            value={user?.email ?? '—'}
          />
          <SettingRow
            icon={<User size={16} color={Colors.lit2} />}
            label="Username"
            value={user?.username ?? '—'}
            last
          />
        </View>

        {/* Reading */}
        <SectionHeader label="Reading" />
        <View style={styles.card}>
          <SettingRow
            icon={<Target size={16} color={Colors.lit2} />}
            label="Reading Goal"
            value={readingGoal ? `${readingGoal} books/year` : 'Not set'}
            onPress={handleOpenGoalModal}
            last
          />
        </View>

        {/* Lists */}
        <SectionHeader label="Lists" />
        <View style={styles.card}>
          <SettingRow
            icon={top10Loading
              ? <ActivityIndicator size="small" color={Colors.lit2} />
              : <List size={16} color={Colors.lit2} />
            }
            label="My Top 10 Books"
            onPress={handleTop10}
            last
          />
        </View>

        {/* Import */}
        <SectionHeader label="Import" />
        <View style={styles.card}>
          <SettingRow
            icon={<Upload size={16} color={Colors.lit2} />}
            label="Import from Goodreads"
            onPress={() => router.push('/import-goodreads' as any)}
            last
          />
        </View>

        {/* Notifications */}
        <SectionHeader label="Notifications" />
        <View style={styles.card}>
          <SettingRow
            icon={<Bell size={16} color={Colors.lit3} />}
            label="Push notifications"
            value="Coming soon"
            last
          />
        </View>

        {/* About */}
        <SectionHeader label="About" />
        <View style={styles.card}>
          <SettingRow
            icon={<Info size={16} color={Colors.lit2} />}
            label="Version"
            value={Constants.expoConfig?.version ?? Constants.manifest?.version ?? '1.0.0'}
            last
          />
        </View>

        {/* Danger zone */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={16} color={Colors.error} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      <ReadingGoalModal
        visible={goalModalOpen}
        value={goalInput}
        onChangeValue={setGoalInput}
        onSave={handleSaveGoal}
        onClose={() => setGoalModalOpen(false)}
        saving={goalSaving}
        title="Set Reading Goal"
      />
    </View>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.canvas },

  content: { padding: 16, gap: 4 },

  sectionHeader: {
    fontSize: 11, fontWeight: '700', color: Colors.lit3,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 4, paddingTop: 16, paddingBottom: 6,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.rim,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: Colors.rim,
  },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.grove,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 14, color: Colors.lit },
  rowRight: { alignItems: 'flex-end' },
  rowValue: { fontSize: 13, color: Colors.lit2 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 24, paddingVertical: 14, borderRadius: 14,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: Colors.error },

})
