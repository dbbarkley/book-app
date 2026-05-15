/**
 * app/edit-profile.tsx — Edit own profile
 * Stack route accessible from Profile header and Settings.
 * Updates display_name, bio, and avatar_url via apiClient.updateUser.
 * Calls authStore.refreshUser() on success so changes propagate instantly.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
  Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore, useUserLists, apiClient } from '@book-app/shared'
import { ChevronLeft, User, FileText, Camera, Heart, X, Search, List, ChevronRight } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { Colors } from '@/constants/colors'

type FavAuthor = { id: number; name: string }

// NOTE: Run `npx expo install expo-image-picker` to enable native photo picking.
// The import below is guarded so the app still builds without it.
let ImagePicker: typeof import('expo-image-picker') | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ImagePicker = require('expo-image-picker')
} catch {
  // Package not yet installed — photo picker button will show URL input instead
}

// ── Field row ──────────────────────────────────────────────────────────────────

function FieldLabel({ label, optional }: { label: string; optional?: boolean }) {
  return (
    <View style={styles.fieldLabelRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {optional && <Text style={styles.fieldOptional}>optional</Text>}
    </View>
  )
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const router  = useRouter()
  const insets  = useSafeAreaInsets()
  const user    = useAuthStore((s) => s.user)
  const refresh = useAuthStore((s) => s.refreshUser)
  const { top10 } = useUserLists(user?.id)

  const [displayName,       setDisplayName]       = useState(user?.display_name ?? '')
  const [bio,               setBio]               = useState(user?.bio          ?? '')
  // Holds the local device URI for a newly picked photo; null means no change.
  const [pickedAvatarUri,   setPickedAvatarUri]   = useState<string | null>(null)
  const [favAuthors,        setFavAuthors]        = useState<FavAuthor[]>(user?.favourite_authors ?? [])
  const [authorQuery,       setAuthorQuery]       = useState('')
  const [authorResults,     setAuthorResults]     = useState<FavAuthor[]>([])
  const [authorSearching,   setAuthorSearching]   = useState(false)
  const [saving, setSaving] = useState(false)

  const searchTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Tracks the last-saved fav authors so isDirty resets correctly after save,
  // regardless of whether refresh() updates user.favourite_authors.
  const savedFavIdsRef = useRef<string>(
    (user?.favourite_authors ?? []).map((a) => a.id).sort().join(',')
  )

  // Re-sync favAuthors if user.favourite_authors changes (e.g. on re-entry after
  // a previous save updated the auth store correctly).
  useEffect(() => {
    setFavAuthors(user?.favourite_authors ?? [])
    savedFavIdsRef.current = (user?.favourite_authors ?? []).map((a) => a.id).sort().join(',')
  }, [user?.favourite_authors])

  // Debounced author search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    const q = authorQuery.trim()
    if (!q) { setAuthorResults([]); return }
    searchTimerRef.current = setTimeout(async () => {
      setAuthorSearching(true)
      try {
        const { authors } = await apiClient.searchAuthors(q, 1, 8)
        // Filter out already-added authors
        setAuthorResults(
          authors
            .filter((a) => !favAuthors.some((f) => f.id === a.id))
            .map((a) => ({ id: a.id, name: a.name }))
        )
      } catch { setAuthorResults([]) }
      finally { setAuthorSearching(false) }
    }, 350)
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [authorQuery, favAuthors])

  const currentFavIds = [...favAuthors].map((a) => a.id).sort().join(',')

  const isDirty =
    (displayName.trim() || '') !== (user?.display_name ?? '') ||
    (bio.trim()         || '') !== (user?.bio          ?? '') ||
    pickedAvatarUri !== null ||
    currentFavIds !== savedFavIdsRef.current

  const handleBack = useCallback(() => {
    if (isDirty) {
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes that will be lost.',
        [
          { text: 'Keep editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      )
    } else {
      router.back()
    }
  }, [isDirty, router])

  const handleSave = async () => {
    if (!user?.id || !isDirty) return
    setSaving(true)
    try {
      const authorsChanged = currentFavIds !== savedFavIdsRef.current
      await Promise.all([
        apiClient.updateUser(user.id, {
          display_name: displayName.trim() || undefined,
          bio:          bio.trim()         || undefined,
          // Pass as RN file object so the client uses multipart upload
          avatar: pickedAvatarUri
            ? { uri: pickedAvatarUri, type: 'image/jpeg', name: 'avatar.jpg' }
            : undefined,
        }),
        authorsChanged
          ? apiClient.savePreferences({ author_ids: favAuthors.map((a) => a.id) })
          : Promise.resolve(),
      ])
      // Stamp the baseline so isDirty resets even if /auth/me doesn't
      // return favourite_authors populated from the preferences table.
      savedFavIdsRef.current = currentFavIds
      // Sync updated profile fields into global auth store
      await refresh()
      // Patch favourite_authors directly — /auth/me may not join them from
      // preferences.author_ids, so we write the known-good saved value.
      if (authorsChanged) {
        const saved = [...favAuthors]
        useAuthStore.setState((state) => ({
          user: state.user ? { ...state.user, favourite_authors: saved } : state.user,
        }))
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.back()
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert(
        'Save failed',
        err instanceof Error ? err.message : 'Could not save profile. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  const addFavAuthor = useCallback((author: FavAuthor) => {
    setFavAuthors((prev) => prev.some((a) => a.id === author.id) ? prev : [...prev, author])
    setAuthorResults((prev) => prev.filter((a) => a.id !== author.id))
    setAuthorQuery('')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [])

  const removeFavAuthor = useCallback((id: number) => {
    setFavAuthors((prev) => prev.filter((a) => a.id !== id))
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [])

  // Show newly picked local image immediately; fall back to what the server has.
  const avatarPreviewUri = pickedAvatarUri || user?.avatar_url
  const initial = ((displayName || user?.display_name || user?.username || '?')
    .charAt(0)
    .toUpperCase())

  const handlePickPhoto = async () => {
    if (!ImagePicker) {
      // Package not installed — fall through to URL field
      Alert.alert(
        'Photo picker unavailable',
        'Run `npx expo install expo-image-picker` to enable native photo picking. You can also paste a direct image URL in the Avatar URL field below.'
      )
      return
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library in Settings.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: false,
    })
    if (!result.canceled && result.assets[0]?.uri) {
      setPickedAvatarUri(result.assets[0].uri)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>

        {/* ── Header bar ── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            hitSlop={8}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ChevronLeft size={20} color={Colors.lit2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              (!isDirty || saving) && styles.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={!isDirty || saving}
            hitSlop={8}
            accessibilityLabel="Save profile changes"
            accessibilityRole="button"
          >
            {saving
              ? <ActivityIndicator size="small" color={Colors.accentOn} />
              : <Text style={styles.saveBtnText}>Save</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
        >
          {/* ── Avatar preview — tap to pick from library ── */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={handlePickPhoto}
              activeOpacity={0.8}
              accessibilityLabel="Change profile photo"
              accessibilityRole="button"
              style={styles.avatarTapTarget}
            >
              {avatarPreviewUri ? (
                <Image
                  source={{ uri: avatarPreviewUri }}
                  style={styles.avatarImg}
                  accessibilityLabel="Profile photo preview"
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>{initial}</Text>
                </View>
              )}
              {/* Camera badge */}
              <View style={styles.cameraBadge}>
                <Camera size={14} color={Colors.accentOn} />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
          </View>

          {/* ── Display name ── */}
          <View style={styles.field}>
            <FieldLabel label="Display Name" />
            <View style={styles.inputWrap}>
              <User size={15} color={Colors.lit3} />
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={user?.username ?? 'Your name'}
                placeholderTextColor={Colors.lit3}
                selectionColor={Colors.accent}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={60}
                returnKeyType="next"
                accessibilityLabel="Display name"
              />
            </View>
            <Text style={styles.hint}>
              This is the name other users see. Defaults to your username.
            </Text>
          </View>

          {/* ── Bio ── */}
          <View style={styles.field}>
            <FieldLabel label="Bio" optional />
            <View style={[styles.inputWrap, styles.inputWrapMulti]}>
              <FileText size={15} color={Colors.lit3} style={styles.multilineIcon} />
              <TextInput
                style={[styles.input, styles.inputMulti]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell people a little about yourself…"
                placeholderTextColor={Colors.lit3}
                selectionColor={Colors.accent}
                multiline
                numberOfLines={4}
                maxLength={280}
                textAlignVertical="top"
                returnKeyType="default"
                accessibilityLabel="Bio"
              />
            </View>
            <Text style={styles.hint}>{bio.length}/280</Text>
          </View>

          {/* ── Favourite Authors ── */}
          <View style={styles.field}>
            <FieldLabel label="Favourite Authors" optional />

            {/* Current chips */}
            {favAuthors.length > 0 && (
              <View style={styles.authorChips}>
                {favAuthors.map((a) => (
                  <View key={a.id} style={styles.authorChip}>
                    <Text style={styles.authorChipText}>{a.name}</Text>
                    <TouchableOpacity
                      onPress={() => removeFavAuthor(a.id)}
                      hitSlop={6}
                      accessibilityLabel={`Remove ${a.name}`}
                      accessibilityRole="button"
                    >
                      <X size={13} color={Colors.lit3} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Search input */}
            <View style={styles.inputWrap}>
              <Search size={15} color={Colors.lit3} />
              <TextInput
                style={styles.input}
                value={authorQuery}
                onChangeText={setAuthorQuery}
                placeholder="Search for an author…"
                placeholderTextColor={Colors.lit3}
                selectionColor={Colors.accent}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="search"
                accessibilityLabel="Search favourite authors"
              />
              {authorSearching && <ActivityIndicator size="small" color={Colors.accent} />}
            </View>

            {/* Search results dropdown */}
            {authorResults.length > 0 && (
              <View style={styles.authorResults}>
                {authorResults.map((a, idx) => (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.authorResultRow, idx === authorResults.length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => addFavAuthor(a)}
                    activeOpacity={0.7}
                    accessibilityLabel={`Add ${a.name} to favourites`}
                    accessibilityRole="button"
                  >
                    <Heart size={13} color={Colors.accent} />
                    <Text style={styles.authorResultText}>{a.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.hint}>
              Shown on your profile. Search and tap to add, tap × to remove.
            </Text>
          </View>

          {/* ── My Top 10 ── */}
          <View style={styles.field}>
            <FieldLabel label="My Top 10" />
            <TouchableOpacity
              style={styles.top10Row}
              onPress={() => router.push('/edit-list')}
              activeOpacity={0.8}
            >
              <List size={18} color={Colors.accent} />
              <View style={styles.top10Info}>
                <Text style={styles.top10Label}>My Top 10 Books</Text>
                <Text style={styles.top10Sub}>
                  {top10?.items?.length
                    ? `${top10.items.length} of 10 books added`
                    : 'No books added yet'}
                </Text>
              </View>
              <ChevronRight size={16} color={Colors.lit3} />
            </TouchableOpacity>
            <Text style={styles.hint}>
              Displayed on your profile. Other users can like your list.
            </Text>
          </View>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: Colors.canvas },
  container: { flex: 1, backgroundColor: Colors.canvas },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.rim,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.lit },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.grove,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
    backgroundColor: Colors.accent, minWidth: 60, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText:     { fontSize: 13, fontWeight: '700', color: Colors.accentOn },

  // Content
  content: { padding: 20, gap: 24 },

  // Avatar preview
  avatarSection: { alignItems: 'center', gap: 12, paddingBottom: 4 },
  avatarTapTarget: { position: 'relative' },
  avatarImg: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 2, borderColor: Colors.accent,
  },
  avatarFallback: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.grove, borderWidth: 2, borderColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 36, fontWeight: '800', color: Colors.accent },
  avatarHint:    { fontSize: 12, color: Colors.lit3, textAlign: 'center' },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.canvas,
  },

  // Fields
  field:      { gap: 8 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.lit2, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldOptional: { fontSize: 11, color: Colors.lit3, fontStyle: 'italic' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, height: 48, borderRadius: 14,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.rim,
  },
  inputWrapMulti: { height: 'auto', alignItems: 'flex-start', paddingVertical: 12 },
  multilineIcon:  { marginTop: 2 },
  input: { flex: 1, fontSize: 14, color: Colors.lit, height: 48 },
  inputMulti: { height: 'auto', minHeight: 80, lineHeight: 20 },
  hint: { fontSize: 11, color: Colors.lit3, lineHeight: 15 },

  // My Top 10 entry row
  top10Row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.rim,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  top10Info:  { flex: 1 },
  top10Label: { fontSize: 14, fontWeight: '600', color: Colors.lit },
  top10Sub:   { fontSize: 12, color: Colors.lit3, marginTop: 2 },

  // Favourite authors
  authorChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  authorChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.grove, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.accent,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  authorChipText: { fontSize: 13, fontWeight: '600', color: Colors.accent },
  authorResults: {
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.rim,
    overflow: 'hidden',
  },
  authorResultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: Colors.rim,
  },
  authorResultText: { fontSize: 14, color: Colors.lit, flex: 1 },

})
