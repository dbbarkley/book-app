/**
 * SocialTabBar
 *
 * Pill-style tab bar for Friends / Following / Followers.
 * Used on ProfileScreen (own profile) and UserProfileScreen (other user).
 *
 * `count` is optional — own profile shows it, other-user profile omits it.
 */
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'

export interface SocialTab<T extends string = string> {
  key:    T
  label:  string
  count?: number
}

interface SocialTabBarProps<T extends string = string> {
  tabs:      SocialTab<T>[]
  activeTab: T
  onSelect:  (key: T) => void
}

export default function SocialTabBar<T extends string = string>({
  tabs, activeTab, onSelect,
}: SocialTabBarProps<T>) {
  return (
    <View style={styles.tabRow}>
      {tabs.map(({ key, label, count }) => {
        const active = activeTab === key
        return (
          <TouchableOpacity
            key={key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onSelect(key)}
            activeOpacity={0.75}
            accessibilityLabel={label}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {label}
            </Text>
            {count !== undefined && (
              <Text style={[styles.tabCount, active && styles.tabCountActive]}>
                {count}
              </Text>
            )}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  tab: {
    flex: 1, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    borderRadius: 10, backgroundColor: Colors.grove,
    borderWidth: 1, borderColor: Colors.rim,
  },
  tabActive:      { backgroundColor: Colors.surface, borderColor: Colors.accent },
  tabText:        { fontSize: 12, fontWeight: '600', color: Colors.lit2 },
  tabTextActive:  { color: Colors.accent },
  tabCount:       { fontSize: 11, fontWeight: '700', color: Colors.lit2 },
  tabCountActive: { color: Colors.accent },
})
