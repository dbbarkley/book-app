import { View, Text, StyleSheet } from 'react-native'
import { Link } from 'expo-router'
import { Colors } from '@/constants/colors'

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.code}>404</Text>
      <Text style={styles.message}>This page doesn&apos;t exist.</Text>
      <Link href="/(tabs)" style={styles.link}>
        Go home
      </Link>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  code: {
    fontSize: 64,
    fontWeight: '700',
    color: Colors.accent,
  },
  message: {
    fontSize: 16,
    color: Colors.lit2,
  },
  link: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.accent,
  },
})
