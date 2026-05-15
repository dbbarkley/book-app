import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { Colors } from '@/constants/colors'

interface ReadingGoalModalProps {
  visible:       boolean
  value:         string
  onChangeValue: (v: string) => void
  onSave:        () => void
  onClose:       () => void
  saving?:       boolean
  title?:        string
}

export default function ReadingGoalModal({
  visible, value, onChangeValue, onSave, onClose,
  saving = false,
  title = 'Reading Goal',
}: ReadingGoalModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>How many books do you want to read this year?</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeValue}
            keyboardType="number-pad"
            placeholder="e.g. 12"
            placeholderTextColor={Colors.lit3}
            autoFocus
            selectTextOnFocus
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={onSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color={Colors.accentOn} />
                : <Text style={styles.saveText}>Save</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: Colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.rim,
    padding: 24, width: '100%', gap: 12,
  },
  title:      { fontSize: 18, fontWeight: '700', color: Colors.lit },
  sub:        { fontSize: 13, color: Colors.lit2, lineHeight: 18, marginTop: -4 },
  input: {
    backgroundColor: Colors.canvas, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.rim,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 18, fontWeight: '700', color: Colors.lit, textAlign: 'center',
  },
  actions:    { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn:  { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.rim, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600', color: Colors.lit2 },
  saveBtn:    { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.accent, alignItems: 'center' },
  saveText:   { fontSize: 14, fontWeight: '700', color: Colors.accentOn },
})
