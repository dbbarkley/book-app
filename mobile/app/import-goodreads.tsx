import { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as DocumentPicker from 'expo-document-picker'
import { useImportStatus, apiClient } from '@book-app/shared'
import { Upload, CheckCircle, XCircle, FileText, BookOpen } from 'lucide-react-native'
import ScreenHeader from '@/components/ScreenHeader'
import { Colors } from '@/constants/colors'

export default function ImportGoodreadsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [uploading,  setUploading]  = useState(false)
  const [importId,   setImportId]   = useState<number | null>(null)
  const [uploadErr,  setUploadErr]  = useState<string | null>(null)
  const [fileName,   setFileName]   = useState<string | null>(null)

  const { status, isCompleted, isFailed, isProcessing, isPending } = useImportStatus(importId)

  const pickAndUpload = async () => {
    setUploadErr(null)
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
        copyToCacheDirectory: true,
      })

      if (result.canceled || !result.assets?.length) return

      const asset = result.assets[0]
      if (!asset.name.toLowerCase().endsWith('.csv')) {
        setUploadErr('Please select a CSV file exported from Goodreads.')
        return
      }

      setFileName(asset.name)
      setUploading(true)

      const response = await apiClient.uploadGoodreadsCsv({
        uri:  asset.uri,
        name: asset.name,
        type: asset.mimeType ?? 'text/csv',
      })

      setImportId(response.import.id)
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Upload failed'
      setUploadErr(msg)
    } finally {
      setUploading(false)
    }
  }

  const reset = () => {
    setImportId(null)
    setFileName(null)
    setUploadErr(null)
    setUploading(false)
  }

  const progressPct = status?.progress_percentage ?? 0

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Import from Goodreads" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>How to export from Goodreads</Text>
          <Text style={styles.instructionStep}>1. Go to goodreads.com → My Books</Text>
          <Text style={styles.instructionStep}>2. Tap "Import and export" at the bottom left</Text>
          <Text style={styles.instructionStep}>3. Choose "Export Library" and download the CSV</Text>
          <Text style={styles.instructionStep}>4. Come back here and tap the button below</Text>
        </View>

        {/* Upload area */}
        {!importId && (
          <>
            <TouchableOpacity
              style={[styles.uploadBtn, uploading && { opacity: 0.6 }]}
              onPress={pickAndUpload}
              disabled={uploading}
              activeOpacity={0.8}
            >
              {uploading
                ? <ActivityIndicator size="small" color={Colors.accentOn} />
                : <Upload size={18} color={Colors.accentOn} />
              }
              <Text style={styles.uploadBtnText}>
                {uploading ? 'Uploading…' : 'Choose Goodreads CSV'}
              </Text>
            </TouchableOpacity>

            {!!uploadErr && (
              <View style={styles.errorBanner}>
                <XCircle size={14} color={Colors.error} />
                <Text style={styles.errorText}>{uploadErr}</Text>
              </View>
            )}
          </>
        )}

        {/* Progress */}
        {importId && status && (
          <View style={styles.progressCard}>
            {fileName && (
              <View style={styles.fileRow}>
                <FileText size={14} color={Colors.lit2} />
                <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
              </View>
            )}

            {/* Status icon + label */}
            <View style={styles.statusRow}>
              {isCompleted && <CheckCircle size={20} color={Colors.success} />}
              {isFailed    && <XCircle     size={20} color={Colors.error} />}
              {(isProcessing || isPending) && (
                <ActivityIndicator size="small" color={Colors.accent} />
              )}
              <Text style={[
                styles.statusLabel,
                isCompleted && { color: Colors.success },
                isFailed    && { color: Colors.error },
              ]}>
                {isCompleted  ? 'Import complete!'
                 : isFailed   ? 'Import failed'
                 : isPending  ? 'Queued…'
                 : 'Importing…'}
              </Text>
            </View>

            {/* Progress bar */}
            {(isProcessing || isPending) && (
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${progressPct}%` as any }]} />
              </View>
            )}

            {/* Counts */}
            {isCompleted && (
              <View style={styles.countsRow}>
                <View style={styles.countPill}>
                  <Text style={styles.countNum}>{status.successful_imports}</Text>
                  <Text style={styles.countLabel}>imported</Text>
                </View>
                {status.failed_imports > 0 && (
                  <View style={styles.countPill}>
                    <Text style={[styles.countNum, { color: Colors.lit3 }]}>{status.failed_imports}</Text>
                    <Text style={styles.countLabel}>skipped</Text>
                  </View>
                )}
                <View style={styles.countPill}>
                  <Text style={styles.countNum}>{status.total_books}</Text>
                  <Text style={styles.countLabel}>total</Text>
                </View>
              </View>
            )}

            {isFailed && status.error_message && (
              <Text style={styles.errorText}>{status.error_message}</Text>
            )}

            {isCompleted && (
              <TouchableOpacity
                style={styles.goLibraryBtn}
                onPress={() => router.replace('/(tabs)/library')}
                activeOpacity={0.85}
              >
                <BookOpen size={16} color={Colors.accentOn} />
                <Text style={styles.goLibraryBtnText}>Go to My Library</Text>
              </TouchableOpacity>
            )}

            {(isCompleted || isFailed) && (
              <TouchableOpacity style={styles.resetBtn} onPress={reset} activeOpacity={0.8}>
                <Text style={styles.resetBtnText}>
                  {isCompleted ? 'Import another file' : 'Try again'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.canvas },

  content: { padding: 20, gap: 16 },

  instructionCard: {
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.rim,
    padding: 18, gap: 8,
  },
  instructionTitle: { fontSize: 14, fontWeight: '700', color: Colors.lit, marginBottom: 4 },
  instructionStep:  { fontSize: 13, color: Colors.lit2, lineHeight: 20 },

  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.accent, borderRadius: 14,
    paddingVertical: 16,
  },
  uploadBtnText: { fontSize: 15, fontWeight: '700', color: Colors.accentOn },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: { fontSize: 13, color: Colors.error, flex: 1 },

  progressCard: {
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.rim,
    padding: 20, gap: 14,
  },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fileName: { fontSize: 13, color: Colors.lit2, flex: 1 },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusLabel: { fontSize: 15, fontWeight: '700', color: Colors.lit },

  barTrack: {
    height: 6, borderRadius: 3,
    backgroundColor: Colors.grove, overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3, backgroundColor: Colors.accent },

  countsRow: { flexDirection: 'row', gap: 10 },
  countPill: {
    flex: 1, backgroundColor: Colors.canvas, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.rim,
    paddingVertical: 10, alignItems: 'center', gap: 2,
  },
  countNum:   { fontSize: 18, fontWeight: '800', color: Colors.accent },
  countLabel: { fontSize: 11, fontWeight: '600', color: Colors.lit3, textTransform: 'uppercase', letterSpacing: 0.5 },

  goLibraryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 14,
  },
  goLibraryBtnText: { fontSize: 15, fontWeight: '700', color: Colors.accentOn },

  resetBtn: {
    alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.rim,
    backgroundColor: Colors.canvas,
  },
  resetBtnText: { fontSize: 13, fontWeight: '600', color: Colors.lit2 },
})
