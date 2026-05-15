import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Modal, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useFriends, apiClient } from '@book-app/shared'
import type { User } from '@book-app/shared'
import { X, Send, Users, Check, MessageSquare } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { Colors } from '@/constants/colors'

interface Props {
  visible: boolean
  bookId: number
  bookTitle: string
  onClose: () => void
}

export default function SuggestToFriendModal({ visible, bookId, bookTitle, onClose }: Props) {
  const { friends, loading: friendsLoading } = useFriends()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [message,  setMessage]  = useState('')
  const [sending,  setSending]  = useState(false)
  const [sent,     setSent]     = useState(false)
  const [sentMsg,  setSentMsg]  = useState('')
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setSelected(new Set())
      setMessage('')
      setSent(false)
      setError(null)
    }
  }, [visible])

  const toggleFriend = (id: number) => {
    Haptics.selectionAsync()
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSend = async () => {
    if (selected.size === 0 || sending) return
    setSending(true)
    setError(null)
    try {
      const result = await apiClient.suggestBook(bookId, Array.from(selected), message.trim() || undefined)
      setSentMsg(result.message)
      setSent(true)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setTimeout(onClose, 1800)
    } catch (err: any) {
      setError(err?.message || 'Failed to send suggestion')
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: Colors.canvas }}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Suggest to a Friend</Text>
            <Text style={s.subtitle} numberOfLines={1}>{bookTitle}</Text>
          </View>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} hitSlop={8}>
            <X size={18} color={Colors.lit3} />
          </TouchableOpacity>
        </View>

        {sent ? (
          <View style={s.successWrap}>
            <View style={s.successIcon}>
              <Check size={28} color={Colors.accentOn} />
            </View>
            <Text style={s.successText}>{sentMsg}</Text>
          </View>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={s.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {friendsLoading ? (
                <View style={s.loadingWrap}>
                  <ActivityIndicator size="large" color={Colors.accent} />
                </View>
              ) : friends.length === 0 ? (
                <View style={s.emptyWrap}>
                  <Users size={28} color={Colors.lit3} />
                  <Text style={s.emptyTitle}>No friends yet</Text>
                  <Text style={s.emptyBody}>Add friends to suggest books to them</Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  <Text style={s.sectionLabel}>Select friends</Text>
                  {friends.map((friend: User) => {
                    const isSelected = selected.has(friend.id)
                    return (
                      <TouchableOpacity
                        key={friend.id}
                        style={[s.friendRow, isSelected && s.friendRowSelected]}
                        onPress={() => toggleFriend(friend.id)}
                        activeOpacity={0.8}
                      >
                        <View style={s.avatar}>
                          <Text style={s.avatarText}>
                            {(friend.display_name || friend.username).slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.friendName}>{friend.display_name || friend.username}</Text>
                          {friend.display_name && (
                            <Text style={s.friendHandle}>@{friend.username}</Text>
                          )}
                        </View>
                        <View style={[s.checkCircle, isSelected && s.checkCircleSelected]}>
                          {isSelected && <Check size={11} color={Colors.accentOn} />}
                        </View>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              )}

              {friends.length > 0 && (
                <View style={s.messageSection}>
                  <View style={s.messageLabelRow}>
                    <MessageSquare size={12} color={Colors.lit3} />
                    <Text style={s.sectionLabel}>
                      Add a note{' '}
                      <Text style={s.optional}>(optional)</Text>
                    </Text>
                  </View>
                  <TextInput
                    style={s.messageInput}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="You have to read this one…"
                    placeholderTextColor={Colors.lit3}
                    multiline
                    numberOfLines={3}
                    maxLength={280}
                  />
                  {message.length > 0 && (
                    <Text style={s.charCount}>{message.length}/280</Text>
                  )}
                </View>
              )}

              {!!error && <Text style={s.errorText}>{error}</Text>}
            </ScrollView>

            {friends.length > 0 && (
              <View style={s.footer}>
                <TouchableOpacity
                  style={[s.sendBtn, (selected.size === 0 || sending) && s.sendBtnDisabled]}
                  onPress={handleSend}
                  disabled={selected.size === 0 || sending}
                  activeOpacity={0.85}
                >
                  {sending
                    ? <ActivityIndicator size="small" color={Colors.accentOn} />
                    : <Send size={15} color={Colors.accentOn} />
                  }
                  <Text style={s.sendBtnText}>
                    {sending
                      ? 'Sending…'
                      : selected.size === 0
                        ? 'Select at least one friend'
                        : `Send to ${selected.size} friend${selected.size > 1 ? 's' : ''}`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </KeyboardAvoidingView>
    </Modal>
  )
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.rim,
  },
  title:    { fontSize: 20, fontWeight: '700', color: Colors.lit },
  subtitle: { fontSize: 13, color: Colors.lit3, marginTop: 3, maxWidth: 260 },
  closeBtn: { padding: 6, backgroundColor: Colors.grove, borderRadius: 20, marginTop: 2 },

  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 },
  successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  successText: { fontSize: 16, fontWeight: '700', color: Colors.lit, textAlign: 'center' },

  content: { padding: 20, gap: 20 },

  loadingWrap: { paddingVertical: 40, alignItems: 'center' },

  emptyWrap:  { paddingVertical: 40, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.lit2 },
  emptyBody:  { fontSize: 13, color: Colors.lit3, textAlign: 'center' },

  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: Colors.lit3 },
  optional:     { fontSize: 11, fontWeight: '400', textTransform: 'none', letterSpacing: 0, color: Colors.lit3 },

  friendRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: Colors.grove, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.rim,
  },
  friendRowSelected: {
    backgroundColor: 'rgba(201,168,76,0.07)',
    borderColor: 'rgba(201,168,76,0.35)',
  },
  avatar:     { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '800', color: Colors.lit2 },
  friendName: { fontSize: 14, fontWeight: '700', color: Colors.lit },
  friendHandle:{ fontSize: 12, color: Colors.lit3, marginTop: 1 },
  checkCircle: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.rim,
    alignItems: 'center', justifyContent: 'center',
  },
  checkCircleSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },

  messageSection:  { gap: 8 },
  messageLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  messageInput: {
    backgroundColor: Colors.grove, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.rim,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: Colors.lit, lineHeight: 20,
    minHeight: 80, textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, color: Colors.lit3, textAlign: 'right' },
  errorText: { fontSize: 13, color: Colors.error },

  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.rim },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 16,
    backgroundColor: Colors.accent,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { fontSize: 15, fontWeight: '700', color: Colors.accentOn },
})
