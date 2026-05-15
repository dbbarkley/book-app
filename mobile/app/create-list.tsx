/**
 * app/create-list.tsx — Create a new custom book list.
 */
import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore, apiClient } from '@book-app/shared'
import { ChevronLeft, Globe, Lock } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { Colors } from '@/constants/colors'
import type { ListVisibility } from '@book-app/shared'

export default function CreateListScreen() {
  const router  = useRouter()
  const insets  = useSafeAreaInsets()
  const user    = useAuthStore((s) => s.user)

  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [visibility,  setVisibility]  = useState<ListVisibility>('public')
  const [saving,      setSaving]      = useState(false)

  const canSave = name.trim().length > 0

  const handleCreate = async () => {
    if (!canSave || !user?.id) return
    setSaving(true)
    try {
      const list = await apiClient.createUserList(user.id, {
        list_type: 'custom',
        name: name.trim(),
        description: description.trim() || undefined,
        visibility,
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      // Navigate to the new list's edit screen, replacing this screen so
      // the back button from the list goes straight back to the profile.
      router.replace(`/list/${list.id}`)
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? e?.message ?? 'Failed to create list')
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.canvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={20} color={Colors.lit} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>New List</Text>
        {saving ? (
          <ActivityIndicator size="small" color={Colors.accent} style={{ width: 36 }} />
        ) : (
          <TouchableOpacity
            style={[s.saveBtn, !canSave && s.saveBtnDisabled]}
            onPress={handleCreate}
            disabled={!canSave}
            hitSlop={8}
          >
            <Text style={[s.saveBtnText, !canSave && s.saveBtnTextDisabled]}>Create</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
        <View style={s.field}>
          <Text style={s.label}>List name <Text style={s.required}>*</Text></Text>
          <TextInput
            style={s.input}
            placeholder="e.g. Top 5 Romance, Favourite Series…"
            placeholderTextColor={Colors.lit3}
            value={name}
            onChangeText={setName}
            maxLength={60}
            returnKeyType="next"
            autoFocus
          />
          <Text style={s.charCount}>{name.length}/60</Text>
        </View>

        {/* Description */}
        <View style={s.field}>
          <Text style={s.label}>Description <Text style={s.optional}>(optional)</Text></Text>
          <TextInput
            style={[s.input, s.inputMultiline]}
            placeholder="What's this list about?"
            placeholderTextColor={Colors.lit3}
            value={description}
            onChangeText={setDescription}
            maxLength={200}
            multiline
            numberOfLines={3}
            returnKeyType="done"
            blurOnSubmit
          />
          <Text style={s.charCount}>{description.length}/200</Text>
        </View>

        {/* Visibility */}
        <View style={s.field}>
          <Text style={s.label}>Visibility</Text>
          <View style={s.visRow}>
            <TouchableOpacity
              style={[s.visOption, visibility === 'public' && s.visOptionActive]}
              onPress={() => setVisibility('public')}
              activeOpacity={0.8}
            >
              <Globe size={16} color={visibility === 'public' ? Colors.accentOn : Colors.lit2} />
              <View>
                <Text style={[s.visLabel, visibility === 'public' && s.visLabelActive]}>Public</Text>
                <Text style={[s.visDesc, visibility === 'public' && s.visDescActive]}>
                  Anyone can see this list
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.visOption, visibility === 'private' && s.visOptionActive]}
              onPress={() => setVisibility('private')}
              activeOpacity={0.8}
            >
              <Lock size={16} color={visibility === 'private' ? Colors.accentOn : Colors.lit2} />
              <View>
                <Text style={[s.visLabel, visibility === 'private' && s.visLabelActive]}>Private</Text>
                <Text style={[s.visDesc, visibility === 'private' && s.visDescActive]}>
                  Only you can see this list
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.rim,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.lit },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.grove,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
    backgroundColor: Colors.accent,
  },
  saveBtnDisabled: { backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim },
  saveBtnText:         { fontSize: 13, fontWeight: '700', color: Colors.accentOn },
  saveBtnTextDisabled: { color: Colors.lit3 },

  scroll:  { flex: 1 },
  content: { padding: 20, gap: 24 },

  field:     { gap: 8 },
  label:     { fontSize: 13, fontWeight: '600', color: Colors.lit2, letterSpacing: 0.3 },
  required:  { color: Colors.accent },
  optional:  { fontWeight: '400', color: Colors.lit3 },
  charCount: { fontSize: 11, color: Colors.lit3, textAlign: 'right' },

  input: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.rim,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: Colors.lit,
  },
  inputMultiline: { minHeight: 88, textAlignVertical: 'top', paddingTop: 12 },

  visRow:    { gap: 10 },
  visOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.rim,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  visOptionActive:  { backgroundColor: Colors.accent, borderColor: Colors.accent },
  visLabel:         { fontSize: 14, fontWeight: '700', color: Colors.lit },
  visLabelActive:   { color: Colors.accentOn },
  visDesc:          { fontSize: 12, color: Colors.lit3, marginTop: 2 },
  visDescActive:    { color: Colors.accentOn },
})
