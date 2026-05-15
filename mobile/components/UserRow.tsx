/**
 * UserRow — a single user in a friends/followers/following list.
 * Shows avatar, display name, username, and an optional action button.
 */
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '@/constants/colors'
import type { User } from '@book-app/shared'

interface UserRowProps {
  user: User
  /** Label for the right-side action button. Omit to hide it. */
  actionLabel?: string
  onAction?: () => void
  actionLoading?: boolean
  /** Override the tap target (default: push /users/:id) */
  onPress?: () => void
}

function Avatar({ uri, name, size = 40 }: { uri?: string; name: string; size?: number }) {
  const initial = (name || '?').charAt(0).toUpperCase()
  const r = size / 2
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: r, backgroundColor: Colors.grove }}
      />
    )
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: r,
      backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: size * 0.4, fontWeight: '700', color: Colors.accent }}>{initial}</Text>
    </View>
  )
}

export default function UserRow({ user, actionLabel, onAction, onPress }: UserRowProps) {
  const router = useRouter()
  const go = onPress ?? (() => router.push(`/users/${user.id}`))
  const name = user.display_name || user.username

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={go}
      activeOpacity={0.75}
      accessibilityLabel={`View profile of ${name}`}
      accessibilityRole="button"
    >
      <Avatar uri={user.avatar_url} name={name} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {user.display_name && (
          <Text style={styles.username} numberOfLines={1}>@{user.username}</Text>
        )}
        {user.bio && !user.display_name && (
          <Text style={styles.bio} numberOfLines={1}>{user.bio}</Text>
        )}
      </View>
      {actionLabel && (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onAction}
          hitSlop={8}
          accessibilityLabel={`${actionLabel} ${name}`}
          accessibilityRole="button"
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.grove, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.rim,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  info:     { flex: 1, gap: 1 },
  name:     { fontSize: 14, fontWeight: '700', color: Colors.lit },
  username: { fontSize: 12, color: Colors.lit2 },
  bio:      { fontSize: 12, color: Colors.lit2 },
  actionBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.rim,
  },
  actionText: { fontSize: 12, fontWeight: '600', color: Colors.lit2 },
})
