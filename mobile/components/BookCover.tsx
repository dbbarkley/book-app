/**
 * BookCover — Image with a styled text-based fallback.
 * Accepts any width; height is derived from 2:3 aspect ratio.
 *
 * Uses expo-image instead of RN's Image for:
 * - Disk + memory caching (survives navigation, app restarts)
 * - Automatic retry on transient network failures
 * - Fade-in transition so covers never "pop" in abruptly
 * - Priority hints so hero covers load before thumbnails
 */
import { useState } from 'react'
import { View, Text, StyleSheet, type ViewStyle } from 'react-native'
import { Image } from 'expo-image'
import { Colors } from '@/constants/colors'

interface BookCoverProps {
  uri?: string | null
  title: string
  author?: string | null
  width: number
  style?: ViewStyle
  borderRadius?: number
  /** Load priority — use 'high' for hero/above-the-fold covers */
  priority?: 'low' | 'normal' | 'high'
}

export default function BookCover({
  uri,
  title,
  author,
  width,
  style,
  borderRadius = 10,
  priority = 'normal',
}: BookCoverProps) {
  const [imgError, setImgError] = useState(false)
  const height = Math.round(width * 1.5)

  const containerStyle: ViewStyle = {
    width,
    height,
    borderRadius,
    overflow: 'hidden',
    backgroundColor: Colors.grove,
    ...(style ?? {}),
  }

  const a11yLabel = author ? `${title} by ${author}` : title

  if (uri && !imgError) {
    return (
      <Image
        source={{ uri }}
        style={containerStyle}
        contentFit="cover"
        // Disk + memory cache — survives back-navigation and app restarts
        cachePolicy="disk"
        // Smooth 200ms fade so covers never pop in abruptly
        transition={200}
        priority={priority}
        accessibilityLabel={a11yLabel}
        onError={() => setImgError(true)}
      />
    )
  }

  // Fallback: initials on gradient-ish background
  const initials = title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <View
      style={[containerStyle, styles.fallback]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={a11yLabel}
    >
      <Text style={[styles.initials, { fontSize: width * 0.22 }]}>{initials}</Text>
      <Text
        style={[styles.fallbackTitle, { fontSize: Math.max(9, width * 0.08) }]}
        numberOfLines={3}
      >
        {title}
      </Text>
      {author && (
        <Text
          style={[styles.fallbackAuthor, { fontSize: Math.max(8, width * 0.07) }]}
          numberOfLines={1}
        >
          {author}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.rim,
  },
  initials: {
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 2,
  },
  fallbackTitle: {
    fontWeight: '700',
    color: Colors.lit2,
    textAlign: 'center',
    lineHeight: 14,
  },
  fallbackAuthor: {
    color: Colors.lit3,
    textAlign: 'center',
  },
})
