/**
 * BookSplash — logo reveal + slide-up transition into the auth screen.
 *
 * Flow:
 *  1. Logo fades in centred on the dark canvas (FADE_IN_MS)
 *  2. Holds briefly (HOLD_MS)
 *  3. Logo slides up toward the auth screen's logo position while the dark
 *     background fades out, revealing the auth screen underneath (SLIDE_MS)
 *  4. Logo fades out as it arrives, then onFinish() is called
 */
import { useEffect } from 'react'
import { View, Image, Dimensions, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import { Colors } from '@/constants/colors'

const { width: W, height: H } = Dimensions.get('window')

const FADE_IN_MS = 350
const HOLD_MS    = 700
const SLIDE_MS   = 500   // logo slides while bg is still dark
const REVEAL_MS  = 350   // bg + logo fade together after slide completes
const EASING     = Easing.bezier(0.4, 0, 0.2, 1)

// How far up the logo travels from centre — lands near the auth screen logo
const SLIDE_OFFSET = H * 0.27

interface BookSplashProps {
  onFinish: () => void
}

export default function BookSplash({ onFinish }: BookSplashProps) {
  const bgOpacity   = useSharedValue(1)
  const logoOpacity = useSharedValue(0)
  const logoY       = useSharedValue(0)

  useEffect(() => {
    // Single assignment per value — chained with withSequence so nothing cancels anything.

    // Logo: fade in → hold at 1 while sliding → fade out
    logoOpacity.value = withSequence(
      withTiming(1, { duration: FADE_IN_MS, easing: EASING }),
      // Stay at 1 for the rest of the hold + the full slide
      withTiming(1, { duration: HOLD_MS - FADE_IN_MS + SLIDE_MS }),
      // Fade out once logo has landed
      withTiming(0, { duration: REVEAL_MS }, (finished) => {
        if (finished) runOnJS(onFinish)()
      }),
    )

    // Logo slides up after hold — single assignment, no conflict
    logoY.value = withDelay(
      HOLD_MS,
      withTiming(-SLIDE_OFFSET, { duration: SLIDE_MS, easing: EASING }),
    )

    // Background stays dark during slide, then fades out with the logo
    bgOpacity.value = withDelay(
      HOLD_MS + SLIDE_MS,
      withTiming(0, { duration: REVEAL_MS, easing: EASING }),
    )
  }, [])

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }))

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoY.value }],
  }))

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Dark background — fades out to reveal auth screen */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.bg, bgStyle]} />

      {/* Logo — fades in, slides up, fades out */}
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  bg: {
    backgroundColor: Colors.canvas,
    zIndex: 998,
  },
  logoWrap: {
    position: 'absolute',
    top: H / 2 - 36,   // vertically centred (logo height ~72)
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  logo: {
    width: W * 0.55,
    height: 72,
    tintColor: Colors.lit,
  },
})
