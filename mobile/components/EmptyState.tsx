import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  body?: string
  action?: { label: string; onPress: () => void }
}

export default function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {body && <Text style={styles.body}>{body}</Text>}
      {action && (
        <TouchableOpacity style={styles.btn} onPress={action.onPress} activeOpacity={0.85}>
          <Text style={styles.btnText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center', gap: 10,
    padding: 28, margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.rim,
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  title: { fontSize: 16, fontWeight: '700', color: Colors.lit, textAlign: 'center' },
  body:  { fontSize: 13, color: Colors.lit2, textAlign: 'center', lineHeight: 19 },
  btn: {
    marginTop: 4, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, backgroundColor: Colors.accent,
  },
  btnText: { fontSize: 13, fontWeight: '700', color: Colors.accentOn },
})
