import { View, StyleSheet } from 'react-native'
import { Star } from 'lucide-react-native'
import { Colors } from '@/constants/colors'

interface StarRatingProps {
  rating: number  // 0–5, quarter increments
  size?: number
}

export default function StarRating({ rating, size = 12 }: StarRatingProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < Math.floor(rating)
        const half   = !filled && i === Math.floor(rating) && rating % 1 >= 0.5
        return (
          <Star
            key={i}
            size={size}
            color={Colors.accent}
            fill={filled || half ? Colors.accent : 'transparent'}
            style={{ opacity: filled || half ? 1 : 0.3 }}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
})
