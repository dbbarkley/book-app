/**
 * app/list/[id].tsx — View / edit a custom book list.
 *
 * Drag-to-reorder uses the same pattern as edit-list.tsx:
 * shared values animate on the UI thread, reset happens in useLayoutEffect
 * after React commits the new order — no flash on drop.
 */
import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, FlatList, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import Animated, {
  useSharedValue, useDerivedValue, useAnimatedStyle,
  useAnimatedReaction, withSpring, runOnJS,
} from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'
import { Gesture, GestureDetector, Swipeable } from 'react-native-gesture-handler'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore, useUserList, apiClient } from '@book-app/shared'
import {
  ChevronLeft, Search, X, Plus, Trash2, Globe, Lock, Pencil, Check,
} from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import BookCover from '@/components/BookCover'
import { Colors } from '@/constants/colors'
import type { UserListItem, Book, ListVisibility } from '@book-app/shared'

// ── Constants ──────────────────────────────────────────────────────────────────
const ITEM_HEIGHT = 72
const ITEM_GAP    = 10
const ITEM_STRIDE = ITEM_HEIGHT + ITEM_GAP
const SPRING      = { damping: 20, stiffness: 260, mass: 0.8 }

// ── DraggableItem ──────────────────────────────────────────────────────────────
type DraggableItemProps = {
  item:           UserListItem
  index:          number
  total:          number
  draggingItemId: SharedValue<number>
  dragStartIdx:   SharedValue<number>
  hoverIdx:       SharedValue<number>
  dragTranslateY: SharedValue<number>
  onDragBegin:    (index: number, itemId: number) => void
  onHoverChange:  () => void
  onDragEnd:      (startIdx: number, finalIdx: number) => void
  saving:         boolean
  onDelete:       (itemId: number, title: string) => void
  swipeRef:       (ref: Swipeable | null) => void
  onSwipeOpen:    (index: number) => void
}

function DraggableItem({
  item, index, total,
  draggingItemId, dragStartIdx, hoverIdx, dragTranslateY,
  onDragBegin, onHoverChange, onDragEnd,
  saving, onDelete, swipeRef, onSwipeOpen,
}: DraggableItemProps) {

  const bystanderOffset = useDerivedValue(() => {
    const start = dragStartIdx.value
    const hover = hoverIdx.value
    if (start === -1 || start === index) return withSpring(0, SPRING)
    if (start < index && hover >= index) return withSpring(-ITEM_STRIDE, SPRING)
    if (start > index && hover <= index) return withSpring( ITEM_STRIDE, SPRING)
    return withSpring(0, SPRING)
  })

  const outerStyle = useAnimatedStyle(() => {
    if (draggingItemId.value === item.id) {
      return {
        transform: [{ translateY: dragTranslateY.value }, { scale: 1.04 }],
        zIndex: 100,
        shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 14,
        shadowOffset: { width: 0, height: 7 }, elevation: 14,
      }
    }
    return {
      transform: [{ translateY: bystanderOffset.value }],
      zIndex: 1, shadowOpacity: 0, elevation: 0,
    }
  })

  const dragGesture = Gesture.Pan()
    .activeOffsetY([-4, 4])
    .failOffsetX([-15, 15])
    .onBegin(() => {
      dragStartIdx.value   = index
      hoverIdx.value       = index
      dragTranslateY.value = 0
      draggingItemId.value = item.id
      runOnJS(onDragBegin)(index, item.id)
    })
    .onUpdate((e) => {
      dragTranslateY.value = e.translationY
      const fingerAbsY = index * ITEM_STRIDE + e.translationY
      const next = Math.max(0, Math.min(total - 1, Math.round(fingerAbsY / ITEM_STRIDE)))
      if (next !== hoverIdx.value) {
        hoverIdx.value = next
        runOnJS(onHoverChange)()
      }
    })
    .onEnd(() => {
      const start = dragStartIdx.value
      const end   = hoverIdx.value
      runOnJS(onDragEnd)(start, end)
    })
    .onFinalize((_e, success) => {
      if (!success) {
        draggingItemId.value = -1
        dragTranslateY.value = withSpring(0, SPRING)
        hoverIdx.value       = -1
        dragStartIdx.value   = -1
      }
    })

  const renderRightActions = useCallback(() => (
    <TouchableOpacity
      style={s.deleteAction}
      onPress={() => onDelete(item.id, item.book.title)}
      activeOpacity={0.8}
    >
      <Trash2 size={20} color="#fff" />
      <Text style={s.deleteActionText}>Remove</Text>
    </TouchableOpacity>
  ), [item.id, item.book.title, onDelete])

  return (
    <Animated.View style={[s.itemOuter, outerStyle]}>
      <Swipeable
        ref={swipeRef}
        renderRightActions={renderRightActions}
        rightThreshold={60}
        onSwipeableOpen={() => onSwipeOpen(index)}
        friction={2}
        overshootRight={false}
      >
        <View style={s.itemRow}>
          {/* Drag handle */}
          <GestureDetector gesture={dragGesture}>
            <View style={s.dragHandle}>
              <View style={s.dragLine} />
              <View style={s.dragLine} />
            </View>
          </GestureDetector>

          {/* Position number */}
          <View style={s.posBadge}>
            <Text style={s.posText}>{index + 1}</Text>
          </View>

          <BookCover
            uri={item.book.cover_image_url}
            title={item.book.title}
            author={item.book.author_name}
            width={52}
            borderRadius={8}
          />

          <View style={s.itemInfo}>
            <Text style={s.itemTitle} numberOfLines={2}>{item.book.title}</Text>
            <Text style={s.itemAuthor} numberOfLines={1}>{item.book.author_name}</Text>
          </View>
        </View>
      </Swipeable>
    </Animated.View>
  )
}

// ── Book Search Modal ──────────────────────────────────────────────────────────
function BookSearchModal({
  visible, onClose, onSelect, excludeBookIds,
}: {
  visible: boolean
  onClose: () => void
  onSelect: (book: Book) => void
  excludeBookIds: number[]
}) {
  const [query,   setQuery]   = useState('')
  const [books,   setBooks]   = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!visible) { setQuery(''); setBooks([]); return }
  }, [visible])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!query.trim()) { setBooks([]); return }
    setLoading(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const { books: results } = await apiClient.searchBooks(query.trim())
        setBooks(results)
      } catch { setBooks([]) }
      finally { setLoading(false) }
    }, 350)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [query])

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={modal.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={modal.container}>
          <View style={modal.header}>
            <Text style={modal.title}>Add a Book</Text>
            <TouchableOpacity style={modal.closeBtn} onPress={onClose} hitSlop={8}>
              <X size={18} color={Colors.lit2} />
            </TouchableOpacity>
          </View>

          <View style={modal.searchWrap}>
            <Search size={16} color={Colors.lit3} />
            <TextInput
              style={modal.searchInput}
              placeholder="Search by title or author…"
              placeholderTextColor={Colors.lit3}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
              autoFocus
            />
            {loading && <ActivityIndicator size="small" color={Colors.accent} />}
          </View>

          {books.length === 0 && !loading ? (
            <View style={modal.empty}>
              <Text style={modal.emptyText}>
                {query.trim() ? `No results for "${query}"` : 'Start typing to search…'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={books}
              keyExtractor={(b) => String(b.id ?? b.google_books_id)}
              contentContainerStyle={modal.results}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                if (!item.id) return null
                const alreadyAdded = excludeBookIds.includes(item.id)
                return (
                  <TouchableOpacity
                    style={[modal.resultRow, alreadyAdded && modal.resultRowDisabled]}
                    onPress={() => {
                      if (alreadyAdded || !item.id) return
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      onSelect(item)
                    }}
                    activeOpacity={alreadyAdded ? 1 : 0.8}
                  >
                    <BookCover
                      uri={item.cover_image_url}
                      title={item.title}
                      author={item.author_name ?? item.author?.name}
                      width={44}
                      borderRadius={7}
                    />
                    <View style={modal.resultInfo}>
                      <Text style={modal.resultTitle} numberOfLines={2}>{item.title}</Text>
                      <Text style={modal.resultAuthor} numberOfLines={1}>
                        {item.author_name ?? item.author?.name}
                      </Text>
                    </View>
                    {alreadyAdded ? (
                      <View style={modal.addedBadge}>
                        <Text style={modal.addedBadgeText}>Added</Text>
                      </View>
                    ) : (
                      <Plus size={18} color={Colors.accent} />
                    )}
                  </TouchableOpacity>
                )
              }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ── Edit Name Modal ────────────────────────────────────────────────────────────
function EditMetaModal({
  visible, name, description, visibility, onClose, onSave,
}: {
  visible: boolean
  name: string
  description: string
  visibility: ListVisibility
  onClose: () => void
  onSave: (name: string, description: string, visibility: ListVisibility) => Promise<void>
}) {
  const [n, setN] = useState(name)
  const [d, setD] = useState(description)
  const [v, setV] = useState<ListVisibility>(visibility)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (visible) { setN(name); setD(description); setV(visibility) } }, [visible])

  const handle = async () => {
    if (!n.trim()) return
    setSaving(true)
    try { await onSave(n.trim(), d.trim(), v); onClose() }
    finally { setSaving(false) }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={meta.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={meta.container}>
          <View style={meta.header}>
            <TouchableOpacity onPress={onClose} hitSlop={8}><Text style={meta.cancel}>Cancel</Text></TouchableOpacity>
            <Text style={meta.title}>Edit List</Text>
            {saving
              ? <ActivityIndicator size="small" color={Colors.accent} style={{ width: 44 }} />
              : <TouchableOpacity onPress={handle} disabled={!n.trim()} hitSlop={8}>
                  <Text style={[meta.save, !n.trim() && meta.saveDisabled]}>Save</Text>
                </TouchableOpacity>
            }
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={meta.content} keyboardShouldPersistTaps="handled">
            <View style={meta.field}>
              <Text style={meta.label}>Name</Text>
              <TextInput
                style={meta.input} value={n} onChangeText={setN}
                placeholder="List name" placeholderTextColor={Colors.lit3}
                maxLength={60} autoFocus
              />
            </View>
            <View style={meta.field}>
              <Text style={meta.label}>Description</Text>
              <TextInput
                style={[meta.input, meta.inputMulti]} value={d} onChangeText={setD}
                placeholder="Optional description" placeholderTextColor={Colors.lit3}
                maxLength={200} multiline blurOnSubmit
              />
            </View>
            <View style={meta.field}>
              <Text style={meta.label}>Visibility</Text>
              <View style={meta.visRow}>
                {(['public', 'private'] as ListVisibility[]).map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[meta.visOpt, v === opt && meta.visOptActive]}
                    onPress={() => setV(opt)}
                    activeOpacity={0.8}
                  >
                    {opt === 'public'
                      ? <Globe size={14} color={v === opt ? Colors.accentOn : Colors.lit2} />
                      : <Lock  size={14} color={v === opt ? Colors.accentOn : Colors.lit2} />
                    }
                    <Text style={[meta.visLabel, v === opt && meta.visLabelActive]}>
                      {opt === 'public' ? 'Public' : 'Private'}
                    </Text>
                    {v === opt && <Check size={14} color={Colors.accentOn} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ── List Screen ────────────────────────────────────────────────────────────────
export default function ListScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const user   = useAuthStore((s) => s.user)
  const listId = Number(id)

  const { list, loading, saving, error, addBook, removeBook, reorder } =
    useUserList(user?.id, listId)

  const isOwner = list ? list.user_id === user?.id : false

  const [searchVisible, setSearchVisible] = useState(false)
  const [editVisible,   setEditVisible]   = useState(false)
  const [addingBook,    setAddingBook]    = useState(false)
  const [isDragging,    setIsDragging]    = useState(false)

  // Local item order — updated optimistically on drag-end to avoid flash
  const [localItems, setLocalItems] = useState<UserListItem[]>(list?.items ?? [])
  useEffect(() => { setLocalItems(list?.items ?? []) }, [list?.items])

  const draggingItemId = useSharedValue(-1)
  const dragStartIdx   = useSharedValue(-1)
  const hoverIdx       = useSharedValue(-1)
  const dragTranslateY = useSharedValue(0)

  useAnimatedReaction(
    () => draggingItemId.value,
    (val) => runOnJS(setIsDragging)(val !== -1),
  )

  const cbRef             = useRef({ onDragEnd: (_s: number, _e: number) => {} })
  const pendingDragReset  = useRef(false)

  useLayoutEffect(() => {
    if (!pendingDragReset.current) return
    pendingDragReset.current = false
    draggingItemId.value = -1
    dragTranslateY.value = 0
    hoverIdx.value       = -1
    dragStartIdx.value   = -1
  }, [localItems, draggingItemId, dragTranslateY, hoverIdx, dragStartIdx])

  const stableDragBegin = useCallback(() => {
    closeAllSwipeables()
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stableHoverChange = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [])

  const stableDragEnd = useCallback(
    (start: number, end: number) => cbRef.current.onDragEnd(start, end),
    [],
  )

  const swipeableRefs = useRef<(Swipeable | null)[]>([])
  const closeAllSwipeables = useCallback(() => {
    swipeableRefs.current.forEach((r) => r?.close())
  }, [])
  const handleSwipeOpen = useCallback((openedIdx: number) => {
    swipeableRefs.current.forEach((r, i) => { if (i !== openedIdx) r?.close() })
  }, [])

  const excludeIds = localItems.map((i) => i.book.id)

  const handleAddBook = useCallback(async (book: Book) => {
    if (!book.id) return
    setSearchVisible(false)
    setAddingBook(true)
    try {
      await addBook(book.id)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? e?.message ?? 'Failed to add book')
    } finally {
      setAddingBook(false)
    }
  }, [addBook])

  const handleDelete = useCallback((itemId: number) => {
    removeBook(itemId).catch((e: any) => {
      Alert.alert('Error', e?.message ?? 'Failed to remove book')
    })
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }, [removeBook])

  const handleSaveMeta = useCallback(async (
    name: string, description: string, visibility: ListVisibility,
  ) => {
    if (!user?.id || !list) return
    await apiClient.updateUserList(user.id, list.id, { name, description, visibility })
    // Refresh the list
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }, [user?.id, list])

  useEffect(() => {
    cbRef.current.onDragEnd = (startIdx: number, finalIdx: number) => {
      if (startIdx === finalIdx) {
        draggingItemId.value = -1
        dragTranslateY.value = withSpring(0, SPRING)
        hoverIdx.value       = -1
        dragStartIdx.value   = -1
        return
      }
      const next = [...localItems]
      const [moved] = next.splice(startIdx, 1)
      next.splice(finalIdx, 0, moved)
      pendingDragReset.current = true
      setLocalItems(next)
      const payload = next.map((it, i) => ({ id: it.id, position: i + 1 }))
      reorder(payload).catch((e: any) => {
        Alert.alert('Error', e?.message ?? 'Failed to reorder')
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localItems, reorder])

  if (loading) {
    return (
      <View style={[s.flex, s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    )
  }

  const listName = list?.name ?? 'My List'
  const visIcon  = list?.visibility === 'private'
    ? <Lock size={12} color={Colors.lit3} />
    : <Globe size={12} color={Colors.lit3} />

  return (
    <View style={[s.flex, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={20} color={Colors.lit} />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <Text style={s.headerTitle} numberOfLines={1}>{listName}</Text>
          {list && (
            <View style={s.headerMeta}>
              {visIcon}
              <Text style={s.headerMetaText}>
                {list.visibility === 'private' ? 'Private' : 'Public'} · {localItems.length} book{localItems.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {isOwner ? (
          addingBook
            ? <ActivityIndicator size="small" color={Colors.accent} style={{ width: 36 }} />
            : <TouchableOpacity style={s.editMetaBtn} onPress={() => setEditVisible(true)} hitSlop={8}>
                <Pencil size={15} color={Colors.lit2} />
              </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!isDragging}
      >
        {error ? <Text style={s.errorText}>{error}</Text> : null}

        {localItems.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>No books yet</Text>
            <Text style={s.emptySubtitle}>
              {isOwner
                ? 'Add books to start building your list.'
                : 'This list has no books yet.'}
            </Text>
            {isOwner && (
              <TouchableOpacity style={s.emptyAddBtn} onPress={() => setSearchVisible(true)}>
                <Plus size={16} color={Colors.accentOn} />
                <Text style={s.emptyAddBtnText}>Add Your First Book</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {isOwner && (
              <Text style={s.hint}>Drag ☰ to reorder · swipe ← to remove</Text>
            )}
            <View style={s.itemList}>
              {localItems.map((item, index) => (
                <DraggableItem
                  key={item.id}
                  item={item}
                  index={index}
                  total={localItems.length}
                  draggingItemId={draggingItemId}
                  dragStartIdx={dragStartIdx}
                  hoverIdx={hoverIdx}
                  dragTranslateY={dragTranslateY}
                  onDragBegin={stableDragBegin}
                  onHoverChange={stableHoverChange}
                  onDragEnd={stableDragEnd}
                  saving={saving}
                  onDelete={handleDelete}
                  swipeRef={(ref) => { swipeableRefs.current[index] = ref }}
                  onSwipeOpen={handleSwipeOpen}
                />
              ))}
            </View>
          </>
        )}

        {isOwner && localItems.length > 0 && (
          <TouchableOpacity
            style={[s.addMoreBtn, (saving || addingBook) && s.addMoreBtnDisabled]}
            onPress={() => setSearchVisible(true)}
            disabled={saving || addingBook}
            activeOpacity={0.85}
          >
            <Plus size={18} color={Colors.accentOn} />
            <Text style={s.addMoreBtnText}>Add a Book</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <BookSearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        onSelect={handleAddBook}
        excludeBookIds={excludeIds}
      />

      {list && (
        <EditMetaModal
          visible={editVisible}
          name={list.name}
          description={list.description ?? ''}
          visibility={list.visibility}
          onClose={() => setEditVisible(false)}
          onSave={handleSaveMeta}
        />
      )}
    </View>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: Colors.canvas },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.rim, gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.grove,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, gap: 2 },
  headerTitle:  { fontSize: 16, fontWeight: '700', color: Colors.lit },
  headerMeta:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerMetaText: { fontSize: 11, color: Colors.lit3 },
  editMetaBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.grove,
    alignItems: 'center', justifyContent: 'center',
  },

  content:   { padding: 16, gap: 12 },
  hint:      { fontSize: 12, color: Colors.lit3 },
  errorText: { fontSize: 13, color: Colors.error, textAlign: 'center' },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.lit },
  emptySubtitle: {
    fontSize: 13, color: Colors.lit3, textAlign: 'center',
    lineHeight: 19, paddingHorizontal: 24,
  },
  emptyAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.accent, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12, marginTop: 8,
  },
  emptyAddBtnText: { fontSize: 14, fontWeight: '700', color: Colors.accentOn },

  itemList:  { gap: ITEM_GAP, overflow: 'visible' },
  itemOuter: { overflow: 'visible' },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.rim,
    paddingRight: 10, paddingVertical: 10,
  },

  dragHandle: {
    width: 36, alignSelf: 'stretch',
    alignItems: 'center', justifyContent: 'center', gap: 5,
  },
  dragLine: { width: 18, height: 2, backgroundColor: Colors.lit3, borderRadius: 1 },

  posBadge: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim,
    alignItems: 'center', justifyContent: 'center',
  },
  posText: { fontSize: 12, fontWeight: '800', color: Colors.lit2 },

  itemInfo:   { flex: 1, gap: 2 },
  itemTitle:  { fontSize: 13, fontWeight: '600', color: Colors.lit, lineHeight: 17 },
  itemAuthor: { fontSize: 12, color: Colors.lit3 },

  deleteAction: {
    backgroundColor: '#E53935', borderRadius: 14,
    marginLeft: 8, width: 80,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  deleteActionText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  addMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.accent, borderRadius: 14,
    paddingVertical: 16, marginTop: 4,
  },
  addMoreBtnDisabled: { opacity: 0.5 },
  addMoreBtnText: { fontSize: 15, fontWeight: '700', color: Colors.accentOn },
})

const modal = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: Colors.canvas },
  container: { flex: 1, backgroundColor: Colors.canvas },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.rim,
  },
  title:    { fontSize: 16, fontWeight: '700', color: Colors.lit },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.grove, alignItems: 'center', justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: 16, paddingHorizontal: 14, height: 46,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.rim,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.lit, height: 46 },
  results: { paddingHorizontal: 16, paddingBottom: 32, gap: 2 },
  empty:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyText: { fontSize: 13, color: Colors.lit3 },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 2,
    borderBottomWidth: 1, borderBottomColor: Colors.rim,
  },
  resultRowDisabled: { opacity: 0.5 },
  resultInfo:   { flex: 1, gap: 2 },
  resultTitle:  { fontSize: 13, fontWeight: '600', color: Colors.lit, lineHeight: 17 },
  resultAuthor: { fontSize: 12, color: Colors.lit3 },
  addedBadge: {
    backgroundColor: Colors.grove, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.rim,
  },
  addedBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.lit3 },
})

const meta = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: Colors.canvas },
  container: { flex: 1, backgroundColor: Colors.canvas },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.rim,
  },
  title:       { fontSize: 16, fontWeight: '700', color: Colors.lit },
  cancel:      { fontSize: 14, color: Colors.lit2 },
  save:        { fontSize: 14, fontWeight: '700', color: Colors.accent },
  saveDisabled:{ color: Colors.lit3 },
  content:     { padding: 20, gap: 20 },
  field:       { gap: 8 },
  label:       { fontSize: 13, fontWeight: '600', color: Colors.lit2 },
  input: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.rim,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.lit,
  },
  inputMulti:    { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
  visRow:        { gap: 8 },
  visOpt: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.rim,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  visOptActive:  { backgroundColor: Colors.accent, borderColor: Colors.accent },
  visLabel:      { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.lit },
  visLabelActive:{ color: Colors.accentOn },
})
