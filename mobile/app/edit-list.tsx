/**
 * app/edit-list.tsx — Edit the current user's Top 10 list.
 *
 * Drag-to-reorder:
 *   - Items stay in their original layout positions throughout the drag.
 *   - `hoverIdx` (shared value) tracks which slot the dragged card is over.
 *   - Each bystander card owns a `useDerivedValue` that returns
 *     `withSpring(±ITEM_STRIDE or 0)` based on hoverIdx. This gives smooth,
 *     spring-animated slot shifts with zero React re-renders mid-drag.
 *   - On release, the final order is committed via `reorder()`.
 */
import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
  Alert, FlatList, Modal, KeyboardAvoidingView, Platform,
} from 'react-native'
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withSpring,
  runOnJS,
} from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'
import { Gesture, GestureDetector, Swipeable } from 'react-native-gesture-handler'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore, useUserList, apiClient } from '@book-app/shared'
import {
  ChevronLeft, Search, X, ChevronUp, ChevronDown, Plus, BookOpen, Trash2,
} from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import BookCover from '@/components/BookCover'
import { Colors } from '@/constants/colors'
import type { UserBook, UserListItem } from '@book-app/shared'

// ── Constants ─────────────────────────────────────────────────────────────────
const ITEM_HEIGHT = 72   // cover 52px + paddingVertical 20px
const ITEM_GAP    = 10
const ITEM_STRIDE = ITEM_HEIGHT + ITEM_GAP
const SPRING      = { damping: 20, stiffness: 260, mass: 0.8 }

// ── DraggableItem ─────────────────────────────────────────────────────────────

type DraggableItemProps = {
  item:           UserListItem
  index:          number          // stable — we never reorder during drag
  total:          number
  // Shared values
  draggingItemId: SharedValue<number>   // item.id being dragged, -1 = none
  dragStartIdx:   SharedValue<number>   // index when drag began
  hoverIdx:       SharedValue<number>   // slot the dragged card is currently over
  dragTranslateY: SharedValue<number>   // Y offset of the dragged card
  // Stable JS callbacks
  onDragBegin:    (index: number, itemId: number) => void
  onHoverChange:  () => void            // for haptics only
  onDragEnd:      (startIdx: number, finalIdx: number) => void
  // Other
  saving:         boolean
  onDelete:       (itemId: number, title: string) => void
  onMoveUp:       (index: number) => void
  onMoveDown:     (index: number) => void
  swipeRef:       (ref: Swipeable | null) => void
  onSwipeOpen:    (index: number) => void
}

function DraggableItem({
  item, index, total,
  draggingItemId, dragStartIdx, hoverIdx, dragTranslateY,
  onDragBegin, onHoverChange, onDragEnd,
  saving,
  onDelete, onMoveUp, onMoveDown,
  swipeRef, onSwipeOpen,
}: DraggableItemProps) {

  // Spring offset for bystander cards.
  // useDerivedValue runs on the UI thread — zero JS bridge, zero re-renders.
  const bystanderOffset = useDerivedValue(() => {
    const start = dragStartIdx.value
    const hover = hoverIdx.value
    // This is the dragged card, or nothing is dragging → no shift
    if (start === -1 || start === index) return withSpring(0, SPRING)
    if (start < index && hover >= index) return withSpring(-ITEM_STRIDE, SPRING)
    if (start > index && hover <= index) return withSpring( ITEM_STRIDE, SPRING)
    return withSpring(0, SPRING)
  })

  // ALL animation lives on the OUTER Animated.View (outside Swipeable).
  // This avoids Swipeable / container clipping the card as it moves.
  const outerStyle = useAnimatedStyle(() => {
    if (draggingItemId.value === item.id) {
      return {
        transform: [{ translateY: dragTranslateY.value }, { scale: 1.04 }],
        zIndex: 100,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 7 },
        elevation: 14,
      }
    }
    return {
      transform: [{ translateY: bystanderOffset.value }],
      zIndex: 1,
      shadowOpacity: 0,
      elevation: 0,
    }
  })

  // Vertical-only pan — activates from the drag handle only.
  const dragGesture = Gesture.Pan()
    .activeOffsetY([-4, 4])
    .failOffsetX([-15, 15])
    .onBegin(() => {
      dragStartIdx.value    = index
      hoverIdx.value        = index
      dragTranslateY.value  = 0
      draggingItemId.value  = item.id
      runOnJS(onDragBegin)(index, item.id)
    })
    .onUpdate((e) => {
      // Simple: card hasn't moved in layout, so translation == finger offset
      dragTranslateY.value = e.translationY

      // Convert finger position to a slot index
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
      // Do NOT reset shared values here. If we reset on the UI thread before
      // the JS callback runs, cards snap back to their original positions for
      // 1-2 frames before the optimistic reorder re-render arrives — that's
      // the visible "flash". Instead we reset inside onDragEnd (JS side) so
      // the reset is batched with the setList optimistic update.
      runOnJS(onDragEnd)(start, end)
    })
    .onFinalize((_e, success) => {
      // Only reset on cancellation (success=false). Normal drag-ends are
      // handled by the JS-side onDragEnd callback.
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
      <Text style={s.deleteActionText}>Delete</Text>
    </TouchableOpacity>
  ), [item.id, item.book.title, onDelete])

  // Outer Animated.View is intentionally OUTSIDE Swipeable.
  // overflow: 'visible' lets the card render beyond its layout box when it
  // translates, preventing the "disappearing" clip caused by Swipeable's
  // internal container clipping translated children.
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

          {/* ── Drag handle ── */}
          <GestureDetector gesture={dragGesture}>
            <View style={s.dragHandle}>
              <View style={s.dragLine} />
              <View style={s.dragLine} />
            </View>
          </GestureDetector>

          {/* ── Rank badge ── */}
          <View style={[s.rankBadge, item.position === 1 && s.rankBadgeGold]}>
            <Text style={[s.rankText, item.position === 1 && s.rankTextGold]}>
              #{item.position}
            </Text>
          </View>

          {/* ── Cover ── */}
          <BookCover
            uri={item.book.cover_image_url}
            title={item.book.title}
            author={item.book.author_name}
            width={52}
            borderRadius={8}
          />

          {/* ── Info ── */}
          <View style={s.itemInfo}>
            <Text style={s.itemTitle} numberOfLines={2}>{item.book.title}</Text>
            <Text style={s.itemAuthor} numberOfLines={1}>{item.book.author_name}</Text>
          </View>

          {/* ── Arrows ── */}
          <View style={s.itemControls}>
            <TouchableOpacity
              style={[s.arrowBtn, index === 0 && s.arrowBtnDisabled]}
              onPress={() => onMoveUp(index)}
              disabled={index === 0 || saving}
              hitSlop={{ top: 10, bottom: 6, left: 10, right: 10 }}
            >
              <ChevronUp size={22} color={index === 0 ? Colors.lit3 : Colors.lit2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.arrowBtn, index === total - 1 && s.arrowBtnDisabled]}
              onPress={() => onMoveDown(index)}
              disabled={index === total - 1 || saving}
              hitSlop={{ top: 6, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronDown size={22} color={index === total - 1 ? Colors.lit3 : Colors.lit2} />
            </TouchableOpacity>
          </View>

        </View>
      </Swipeable>
    </Animated.View>
  )
}

// ── CompletedBooksModal ───────────────────────────────────────────────────────

function CompletedBooksModal({
  visible, onClose, onSelect, excludeBookIds,
}: {
  visible: boolean
  onClose: () => void
  onSelect: (userBook: UserBook) => void
  excludeBookIds: number[]
}) {
  const [completedBooks, setCompletedBooks] = useState<UserBook[]>([])
  const [loadingBooks, setLoadingBooks]     = useState(false)
  const [query, setQuery]                   = useState('')

  useEffect(() => {
    if (!visible) return
    setQuery('')
    if (completedBooks.length > 0) return
    setLoadingBooks(true)
    apiClient.getUserBooks({ shelf: 'read' })
      .then(({ user_books }) => setCompletedBooks(user_books))
      .catch(() => {})
      .finally(() => setLoadingBooks(false))
  }, [visible])

  const q        = query.toLowerCase().trim()
  const filtered = q
    ? completedBooks.filter(
        (ub) =>
          ub.book?.title?.toLowerCase().includes(q) ||
          ub.book?.author_name?.toLowerCase().includes(q),
      )
    : completedBooks

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={modal.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={modal.container}>
          <View style={modal.header}>
            <View style={modal.headerLeft}>
              <BookOpen size={16} color={Colors.accent} />
              <Text style={modal.title}>Add from Read Books</Text>
            </View>
            <TouchableOpacity style={modal.closeBtn} onPress={onClose} hitSlop={8}>
              <X size={18} color={Colors.lit2} />
            </TouchableOpacity>
          </View>

          <View style={modal.searchWrap}>
            <Search size={16} color={Colors.lit3} />
            <TextInput
              style={modal.searchInput}
              placeholder="Filter by title or author…"
              placeholderTextColor={Colors.lit3}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>

          {loadingBooks ? (
            <View style={modal.loadingWrap}>
              <ActivityIndicator color={Colors.accent} />
              <Text style={modal.loadingText}>Loading your read books…</Text>
            </View>
          ) : completedBooks.length === 0 ? (
            <View style={modal.loadingWrap}>
              <BookOpen size={32} color={Colors.lit3} />
              <Text style={modal.emptyText}>
                No completed books yet.{'\n'}Mark some books as Read in your library first!
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={modal.results}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={modal.emptyText}>No books match "{query}"</Text>
              }
              renderItem={({ item }) => {
                const book = item.book
                if (!book) return null
                const alreadyAdded = excludeBookIds.includes(book.id)
                return (
                  <TouchableOpacity
                    style={[modal.resultRow, alreadyAdded && modal.resultRowDisabled]}
                    onPress={() => {
                      if (alreadyAdded) return
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      onSelect(item)
                    }}
                    activeOpacity={alreadyAdded ? 1 : 0.8}
                  >
                    <BookCover
                      uri={book.cover_image_url}
                      title={book.title}
                      author={book.author_name}
                      width={44}
                      borderRadius={7}
                    />
                    <View style={modal.resultInfo}>
                      <Text style={modal.resultTitle} numberOfLines={2}>{book.title}</Text>
                      <Text style={modal.resultAuthor} numberOfLines={1}>{book.author_name}</Text>
                      {item.rating ? (
                        <Text style={modal.resultRating}>
                          {'★'.repeat(Math.round(item.rating))}
                          {'☆'.repeat(5 - Math.round(item.rating))}
                        </Text>
                      ) : null}
                    </View>
                    {alreadyAdded ? (
                      <View style={modal.addedBadge}>
                        <Text style={modal.addedBadgeText}>In list</Text>
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

// ── EditListScreen ─────────────────────────────────────────────────────────────

export default function EditListScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const user   = useAuthStore((s) => s.user)

  const { list, loading, saving, error, addBook, removeBook, reorder } =
    useUserList(user?.id, 'top_10')

  const [searchVisible, setSearchVisible] = useState(false)
  const [addingBook,    setAddingBook]    = useState(false)
  const [isDragging,    setIsDragging]    = useState(false)

  // Local copy of the item order — updated optimistically on drag-end so the
  // correct new order is committed to layout before we clear the drag animation
  // state. Synced back from list.items whenever the server state changes.
  const [localItems, setLocalItems] = useState<UserListItem[]>(list?.items ?? [])
  useEffect(() => {
    setLocalItems(list?.items ?? [])
  }, [list?.items])

  // Shared values for drag — all animation runs on the UI thread
  const draggingItemId = useSharedValue(-1)   // item.id currently being dragged
  const dragStartIdx   = useSharedValue(-1)   // original index of dragged card
  const hoverIdx       = useSharedValue(-1)   // slot the dragged card is over
  const dragTranslateY = useSharedValue(0)

  // Mirror isDragging to JS for ScrollView.scrollEnabled
  useAnimatedReaction(
    () => draggingItemId.value,
    (val) => runOnJS(setIsDragging)(val !== -1),
  )

  // ── Stable callback refs (avoid stale closures in gesture worklets) ──────
  const cbRef = useRef({
    onDragEnd: (_start: number, _end: number) => {},
  })

  // True when we've updated localItems after a drag and are waiting for
  // useLayoutEffect to reset the shared animation values.
  const pendingDragReset = useRef(false)

  // Reset shared values AFTER React has committed the re-ordered layout.
  // useLayoutEffect fires synchronously post-commit (before paint), and with
  // JSI / new arch the value writes reach the UI thread in the same frame as
  // the layout update — eliminating the flash where cards snap to their old
  // positions between animation reset and re-render.
  useLayoutEffect(() => {
    if (!pendingDragReset.current) return
    pendingDragReset.current = false
    draggingItemId.value = -1
    dragTranslateY.value = 0
    hoverIdx.value       = -1
    dragStartIdx.value   = -1
  }, [localItems, draggingItemId, dragTranslateY, hoverIdx, dragStartIdx])

  const stableDragBegin = useCallback((idx: number, id: number) => {
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

  // ── Swipeable refs ───────────────────────────────────────────────────────
  const swipeableRefs = useRef<(Swipeable | null)[]>([])
  const closeAllSwipeables = useCallback(() => {
    swipeableRefs.current.forEach((r) => r?.close())
  }, [])
  const handleSwipeOpen = useCallback((openedIdx: number) => {
    swipeableRefs.current.forEach((r, i) => { if (i !== openedIdx) r?.close() })
  }, [])

  const excludeIds = localItems.map((i) => i.book.id)
  const remaining  = 10 - localItems.length

  // ── Add / remove ─────────────────────────────────────────────────────────
  const handleAddBook = useCallback(async (userBook: UserBook) => {
    setSearchVisible(false)
    if (!userBook.book) return
    setAddingBook(true)
    try {
      await addBook(userBook.book.id)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? e?.message ?? 'Failed to add book')
    } finally {
      setAddingBook(false)
    }
  }, [addBook])

  const handleDelete = useCallback((itemId: number, _title: string) => {
    removeBook(itemId).catch((e: any) => {
      Alert.alert('Error', e?.message ?? 'Failed to remove book')
    })
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }, [removeBook])

  const handleMoveUp = useCallback(async (index: number) => {
    const above = localItems[index - 1]
    const cur   = localItems[index]
    if (!above) return
    await reorder([
      { id: cur.id,   position: above.position },
      { id: above.id, position: cur.position },
    ])
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [localItems, reorder])

  const handleMoveDown = useCallback(async (index: number) => {
    const below = localItems[index + 1]
    const cur   = localItems[index]
    if (!below) return
    await reorder([
      { id: cur.id,   position: below.position },
      { id: below.id, position: cur.position },
    ])
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [localItems, reorder])

  // ── Drag end — kept in cbRef so gesture always calls the latest version ──
  useEffect(() => {
    cbRef.current.onDragEnd = (startIdx: number, finalIdx: number) => {
      if (startIdx === finalIdx) {
        // No move — safe to reset immediately (no layout change pending)
        draggingItemId.value = -1
        dragTranslateY.value = withSpring(0, SPRING)
        hoverIdx.value       = -1
        dragStartIdx.value   = -1
        return
      }

      // Build the new order by moving the dragged card to its final slot.
      const next = [...localItems]
      const [moved] = next.splice(startIdx, 1)
      next.splice(finalIdx, 0, moved)

      // Commit the new order to local state FIRST. This triggers a React
      // re-render that moves the items to their new layout positions.
      // useLayoutEffect fires after that commit (before the next paint) and
      // resets the shared values — so the animation reset and the layout
      // change reach the UI thread together, with no in-between flash.
      pendingDragReset.current = true
      setLocalItems(next)

      // Sync to the server (optimistic update in the hook keeps list.items
      // consistent; localItems is re-synced via the useEffect above).
      const payload = next.map((it, i) => ({ id: it.id, position: i + 1 }))
      reorder(payload).catch((e: any) => {
        Alert.alert('Error', e?.message ?? 'Failed to reorder')
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localItems, reorder])

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[s.flex, s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    )
  }

  return (
    <View style={[s.flex, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={20} color={Colors.lit} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Top 10</Text>
        {addingBook ? (
          <ActivityIndicator size="small" color={Colors.accent} />
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
        <View style={s.infoBar}>
          <Text style={s.infoText}>
            {localItems.length}/10 books · Drag ☰ to reorder, swipe ← to delete
          </Text>
        </View>

        {error ? <Text style={s.errorText}>{error}</Text> : null}

        {localItems.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>Your Top 10 is empty</Text>
            <Text style={s.emptySubtitle}>
              Add your all-time favourite books — they'll show on your profile for others to see.
            </Text>
            <TouchableOpacity style={s.emptyAddBtn} onPress={() => setSearchVisible(true)}>
              <Plus size={16} color={Colors.accentOn} />
              <Text style={s.emptyAddBtnText}>Add Your First Book</Text>
            </TouchableOpacity>
          </View>
        ) : (
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
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                swipeRef={(ref) => { swipeableRefs.current[index] = ref }}
                onSwipeOpen={handleSwipeOpen}
              />
            ))}
          </View>
        )}

        {localItems.length > 0 && localItems.length < 10 && (
          <TouchableOpacity
            style={[s.addMoreBtn, (saving || addingBook) && s.addMoreBtnDisabled]}
            onPress={() => setSearchVisible(true)}
            disabled={saving || addingBook}
            activeOpacity={0.85}
          >
            <Plus size={18} color={Colors.accentOn} />
            <Text style={s.addMoreBtnText}>
              Add {remaining} more book{remaining !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <CompletedBooksModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        onSelect={handleAddBook}
        excludeBookIds={excludeIds}
      />
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: Colors.canvas },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },

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

  content:   { padding: 16, gap: 16 },
  infoBar:   { paddingVertical: 4 },
  infoText:  { fontSize: 12, color: Colors.lit3 },
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

  // overflow: 'visible' on itemList lets translated cards render beyond the
  // container's bounds (both iOS and Android need this).
  itemList: { gap: ITEM_GAP, overflow: 'visible' },

  // Each item's outer animated wrapper — overflow: 'visible' is the critical fix.
  // Without it, the Swipeable (or the platform compositor) clips the card when
  // it translates outside its own layout box.
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
  dragLine: {
    width: 18, height: 2,
    backgroundColor: Colors.lit3, borderRadius: 1,
  },

  rankBadge: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Colors.grove, borderWidth: 1, borderColor: Colors.rim,
    alignItems: 'center', justifyContent: 'center',
  },
  rankBadgeGold: { backgroundColor: '#3A2800', borderColor: Colors.accent },
  rankText:      { fontSize: 12, fontWeight: '800', color: Colors.lit2 },
  rankTextGold:  { color: Colors.accent },

  itemInfo:   { flex: 1, gap: 2 },
  itemTitle:  { fontSize: 13, fontWeight: '600', color: Colors.lit, lineHeight: 17 },
  itemAuthor: { fontSize: 12, color: Colors.lit3 },

  itemControls:     { flexDirection: 'column', alignItems: 'center', gap: 2 },
  arrowBtn:         { padding: 5, borderRadius: 8 },
  arrowBtnDisabled: { opacity: 0.3 },

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

// ── Modal styles ──────────────────────────────────────────────────────────────
const modal = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: Colors.canvas },
  container: { flex: 1, backgroundColor: Colors.canvas },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.rim,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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

  loadingWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 12, paddingBottom: 48,
  },
  loadingText: { fontSize: 13, color: Colors.lit3 },
  results:     { paddingHorizontal: 16, paddingBottom: 32, gap: 2 },

  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 2,
    borderBottomWidth: 1, borderBottomColor: Colors.rim,
  },
  resultRowDisabled: { opacity: 0.5 },
  resultInfo:   { flex: 1, gap: 2 },
  resultTitle:  { fontSize: 13, fontWeight: '600', color: Colors.lit, lineHeight: 17 },
  resultAuthor: { fontSize: 12, color: Colors.lit3 },
  resultRating: { fontSize: 11, color: Colors.accent, letterSpacing: 1 },

  addedBadge: {
    backgroundColor: Colors.grove, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.rim,
  },
  addedBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.lit3 },

  emptyText: {
    fontSize: 13, color: Colors.lit3, textAlign: 'center',
    paddingVertical: 32, lineHeight: 20,
  },
})
