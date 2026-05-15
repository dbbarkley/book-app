import { View, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'

interface ProgressBarProps {
  percent: number   // 0–100
  height?: number
}

export default function ProgressBar({ percent, height = 6 }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent))

  return (
    <View style={[styles.track, { height }]}>
      <View
        style={[
          styles.fill,
          { width: `${clamped}%`, height },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: 99,
    backgroundColor: Colors.grove,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 99,
    backgroundColor: Colors.accent,
  },
})
