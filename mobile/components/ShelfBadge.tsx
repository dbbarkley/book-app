import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'
import type { ShelfStatus } from '@book-app/shared'
import { SHELF_LABELS } from '@/constants/shelf-labels'

interface ShelfBadgeProps {
  status: ShelfStatus
}

export default function ShelfBadge({ status }: ShelfBadgeProps) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{SHELF_LABELS[status] ?? status}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: Colors.grove,
    borderWidth: 1,
    borderColor: Colors.accent,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.accent,
  },
})
