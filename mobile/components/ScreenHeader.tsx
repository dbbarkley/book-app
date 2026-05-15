import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { Colors } from '@/constants/colors'

interface ScreenHeaderProps {
  title: string
  onBack?: () => void
  right?: React.ReactNode
}

export default function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  const router = useRouter()
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onBack ?? (() => router.back())}
        style={styles.backBtn}
        hitSlop={8}
      >
        <ChevronLeft size={20} color={Colors.lit2} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.rightSlot}>{right ?? null}</View>
    </View>
  )
}

export const screenHeaderStyles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.rim,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.grove,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '700', color: Colors.lit },
  rightSlot: { width: 36, alignItems: 'flex-end' },
})

const styles = screenHeaderStyles
