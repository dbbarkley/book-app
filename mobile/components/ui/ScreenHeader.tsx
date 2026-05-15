/**
 * ScreenHeader — minimal top-of-screen heading used by tab screens.
 * Safe area is handled by the parent ScreenWrapper.
 */

import { View, Text, StyleSheet, type ViewStyle } from 'react-native'
import { Colors } from '@/constants/colors'

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  right?: React.ReactNode
  style?: ViewStyle
}

export default function ScreenHeader({ title, subtitle, right, style }: ScreenHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {right && <View style={styles.right}>{right}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 16,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.rim,
  },
  left: {
    gap: 2,
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.lit,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.lit2,
  },
  right: {
    flexShrink: 0,
  },
})
