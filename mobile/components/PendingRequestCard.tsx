/**
 * PendingRequestCard — shows an incoming friend request with Accept / Decline buttons.
 */
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { UserPlus } from 'lucide-react-native'
import { Colors } from '@/constants/colors'
import type { FriendRequest } from '@book-app/shared'

interface PendingRequestCardProps {
  request:  FriendRequest
  onAccept: (id: number) => Promise<void>
  onDecline: (id: number) => Promise<void>
  accepting?: boolean
  declining?: boolean
}

function MiniAvatar({ uri, name }: { uri?: string; name: string }) {
  const initial = (name || '?').charAt(0).toUpperCase()
  if (uri) {
    return <Image source={{ uri }} style={styles.avatar} />
  }
  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarInitial}>{initial}</Text>
    </View>
  )
}

export default function PendingRequestCard({
  request, onAccept, onDecline, accepting, declining,
}: PendingRequestCardProps) {
  const router  = useRouter()
  const { requester } = request
  const name = requester.display_name || requester.username
  const busy = accepting || declining

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <UserPlus size={14} color={Colors.accent} />
      </View>
      <TouchableOpacity
        style={styles.userInfo}
        onPress={() => router.push(`/users/${requester.id}`)}
        activeOpacity={0.75}
        accessibilityLabel={`View ${name}'s profile`}
        accessibilityRole="button"
      >
        <MiniAvatar uri={requester.avatar_url} name={name} />
        <View style={styles.textWrap}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.sub}>sent you a friend request</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.acceptBtn, busy && styles.btnDisabled]}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            onAccept(request.id)
          }}
          disabled={busy}
          accessibilityLabel={`Accept friend request from ${name}`}
          accessibilityRole="button"
        >
          {accepting
            ? <ActivityIndicator size="small" color={Colors.accentOn} />
            : <Text style={styles.acceptText}>Accept</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.declineBtn, busy && styles.btnDisabled]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            onDecline(request.id)
          }}
          disabled={busy}
          accessibilityLabel={`Decline friend request from ${name}`}
          accessibilityRole="button"
        >
          {declining
            ? <ActivityIndicator size="small" color={Colors.lit2} />
            : <Text style={styles.declineText}>Decline</Text>}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.accent,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  iconWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.grove,
  },
  avatarFallback: {
    borderWidth: 1, borderColor: Colors.rim,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  textWrap: { flex: 1 },
  name: { fontSize: 13, fontWeight: '700', color: Colors.lit },
  sub:  { fontSize: 11, color: Colors.lit2 },
  actions: { flexDirection: 'row', gap: 6, flexShrink: 0 },
  btn: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, minWidth: 60, alignItems: 'center',
  },
  acceptBtn:   { backgroundColor: Colors.accent },
  declineBtn:  { backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim },
  btnDisabled: { opacity: 0.55 },
  acceptText:  { fontSize: 12, fontWeight: '700', color: Colors.accentOn },
  declineText: { fontSize: 12, fontWeight: '600', color: Colors.lit2 },
})
