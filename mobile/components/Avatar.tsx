/**
 * Shared Avatar component
 *
 * Renders a circular avatar from a URI, or a coloured initial placeholder.
 * Used on ProfileScreen, UserProfileScreen, and wherever a user avatar appears.
 */
import { View, Text, Image, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'

interface AvatarProps {
  uri?:  string
  name:  string
  size?: number
}

export default function Avatar({ uri, name, size = 72 }: AvatarProps) {
  const r       = size / 2
  const initial = (name || '?').charAt(0).toUpperCase()

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: r }}
      />
    )
  }

  return (
    <View style={[
      styles.placeholder,
      { width: size, height: size, borderRadius: r },
    ]}>
      <Text style={[styles.initial, { fontSize: size * 0.38 }]}>
        {initial}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: Colors.grove,
    borderWidth: 2,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontWeight: '800',
    color: Colors.accent,
  },
})
