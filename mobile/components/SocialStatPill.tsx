/**
 * SocialStatPill
 *
 * Displays a numeric social stat (friends, followers, following) as a
 * compact label+value pill. Used on ProfileScreen and UserProfileScreen.
 *
 * Named `SocialStatPill` to avoid collision with the `StatPill` in
 * the book detail screen (which uses string values and different styling).
 */
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'

interface SocialStatPillProps {
  value: number
  label: string
}

export default function SocialStatPill({ value, label }: SocialStatPillProps) {
  return (
    <View style={styles.pill}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill:  { alignItems: 'center', gap: 1 },
  value: { fontSize: 16, fontWeight: '800', color: Colors.lit },
  label: {
    fontSize: 11, fontWeight: '600', letterSpacing: 0.5,
    color: Colors.lit2, textTransform: 'uppercase',
  },
})
