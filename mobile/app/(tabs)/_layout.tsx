import { Platform } from 'react-native'
import { Tabs } from 'expo-router'
import { Home, BookOpen, Compass, Users, User } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useReadingBuddy, useAuth } from '@book-app/shared'
import { Colors } from '@/constants/colors'

const TAB_HEIGHT = 56

export default function TabLayout() {
  const insets = useSafeAreaInsets()
  const tabBarHeight = TAB_HEIGHT + insets.bottom

  const { user }     = useAuth()
  const { sessions } = useReadingBuddy()
  const pendingCount = sessions.filter(
    (s) => s.status === 'pending' && s.invited.id === user?.id
  ).length

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor:  Colors.surface,
          borderTopColor:   Colors.rim,
          borderTopWidth:   1,
          height:           tabBarHeight,
          paddingTop:       8,
          paddingBottom:    insets.bottom > 0 ? insets.bottom : 8,
          // Subtle elevation on Android
          ...Platform.select({
            android: { elevation: 8 },
            ios:     {},
          }),
        },
        tabBarActiveTintColor:   Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: {
          fontSize:   10,
          fontWeight: '600',
          marginTop:  2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home color={color} size={22} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color }) => <BookOpen color={color} size={22} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <Compass color={color} size={22} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="buddies"
        options={{
          title: 'Buddies',
          tabBarIcon: ({ color }) => <Users color={color} size={22} strokeWidth={1.75} />,
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User color={color} size={22} strokeWidth={1.75} />,
        }}
      />
    </Tabs>
  )
}
