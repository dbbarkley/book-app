/**
 * ScreenWrapper
 *
 * Consistent full-screen container used by every top-level screen.
 * Handles:
 *  - Safe area insets (top / bottom)
 *  - Optional scroll (default: true)
 *  - Canvas background
 */

import {
  View,
  ScrollView,
  StyleSheet,
  type ViewStyle,
  type ScrollViewProps,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '@/constants/colors'

interface ScreenWrapperProps {
  children: React.ReactNode
  /** Set false to skip the ScrollView wrapper (use for screens with FlatList/SectionList) */
  scrollable?: boolean
  /** Extra style applied to the inner content container */
  contentStyle?: ViewStyle
  scrollViewProps?: Omit<ScrollViewProps, 'contentContainerStyle' | 'style'>
}

export default function ScreenWrapper({
  children,
  scrollable = true,
  contentStyle,
  scrollViewProps,
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets()

  const innerStyle: ViewStyle = {
    paddingTop:    insets.top + 16,
    paddingBottom: insets.bottom + 24,
    paddingHorizontal: 20,
    flexGrow: 1,
    ...(contentStyle ?? {}),
  }

  if (!scrollable) {
    return (
      <View style={[styles.container, innerStyle]}>
        {children}
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={innerStyle}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
})
