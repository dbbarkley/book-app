import { useRef, useState, useCallback } from 'react'
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  Dimensions,
  type LayoutChangeEvent,
} from 'react-native'
import { Link, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '@book-app/shared'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import AppTextInput from '@/components/ui/AppTextInput'
import Button from '@/components/ui/Button'
import { Colors } from '@/constants/colors'

const { height: H } = Dimensions.get('window')

const HOLD_MS   = 1200  // how long logo sits at centre before sliding
const SLIDE_MS  = 700   // logo slides to natural position
const REVEAL_MS = 500   // form + bg fade in/out after logo lands
const EASING    = Easing.bezier(0.4, 0, 0.2, 1)

export default function LoginScreen() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [errors,   setErrors]   = useState<{ email?: string; password?: string }>({})

  const passwordRef = useRef<TextInput>(null)
  const hasAnimated = useRef(false)

  const login   = useAuthStore((s) => s.login)
  const loading = useAuthStore((s) => s.loading)
  const insets  = useSafeAreaInsets()

  // ── Animation shared values ─────────────────────────────────────────────────
  // Logo starts invisible. onLayout measures its natural Y, offsets it to centre,
  // makes it visible, then slides back to Y=0 (natural position).
  const logoTranslateY = useSharedValue(0)
  const logoOpacity    = useSharedValue(0) // hidden until positioned
  const formOpacity    = useSharedValue(0) // form hidden until logo lands
  const bgOpacity      = useSharedValue(1) // dark overlay hides form during slide

  // Called once after the brand block lays out — gives us the natural Y position
  const handleBrandLayout = useCallback((e: LayoutChangeEvent) => {
    if (hasAnimated.current) return
    hasAnimated.current = true

    const { y, height } = e.nativeEvent.layout
    const brandCenterY  = y + height / 2
    const screenCenterY = H / 2

    // Move logo from natural position to screen centre (no animation — instant)
    const offset = screenCenterY - brandCenterY
    logoTranslateY.value = offset
    logoOpacity.value    = 1 // now visible at screen centre

    // After HOLD_MS: slide back to natural position (translateY → 0)
    logoTranslateY.value = withDelay(
      HOLD_MS,
      withTiming(0, { duration: SLIDE_MS, easing: EASING }),
    )

    // After logo lands: fade in form, fade out dark bg
    formOpacity.value = withDelay(
      HOLD_MS + SLIDE_MS,
      withTiming(1, { duration: REVEAL_MS, easing: EASING }),
    )
    bgOpacity.value = withDelay(
      HOLD_MS + SLIDE_MS,
      withTiming(0, { duration: REVEAL_MS, easing: EASING }),
    )
  }, [])

  // ── Styles ──────────────────────────────────────────────────────────────────
  const logoStyle = useAnimatedStyle(() => ({
    opacity:   logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }))

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
  }))

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }))

  // ── Auth ────────────────────────────────────────────────────────────────────
  const validate = () => {
    const e: typeof errors = {}
    if (!email.trim())             e.email    = 'Email is required'
    else if (!email.includes('@')) e.email    = 'Enter a valid email'
    if (!password)                 e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleLogin = async () => {
    if (!validate()) return
    try {
      await login(email.trim().toLowerCase(), password)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.'
      Alert.alert('Login failed', msg)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.flex}>
      {/* Dark overlay — sits behind content, fades out after logo lands */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.bg, bgStyle]}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={[
            styles.container,
            { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 },
          ]}
        >
          {/* Brand — this is THE logo. onLayout fires once, giving us its natural Y. */}
          <Animated.View
            style={[styles.brand, logoStyle]}
            onLayout={handleBrandLayout}
          >
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Animated.Text style={[styles.tagline, formStyle]}>
              Your reading life, organised.
            </Animated.Text>
          </Animated.View>

          {/* Form — fades in after logo settles */}
          <Animated.View style={[styles.form, formStyle]} pointerEvents="box-none">
            <AppTextInput
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: undefined })) }}
              error={errors.email}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <AppTextInput
              ref={passwordRef}
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })) }}
              error={errors.password}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <Button
              label="Log In"
              onPress={handleLogin}
              loading={loading}
              style={styles.submitButton}
            />
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              hitSlop={8}
              style={styles.forgotLink}
            >
              <Text style={styles.forgotLinkText}>Forgot password?</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer — fades in with form */}
          <Animated.View style={[styles.footer, formStyle]} pointerEvents="box-none">
            <Text style={styles.footerText}>Don&apos;t have an account?</Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity hitSlop={8}>
                <Text style={styles.footerLink}> Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  bg: {
    backgroundColor: Colors.canvas,
    zIndex: 10,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    gap: 32,
    zIndex: 11,
  },
  brand: {
    alignItems: 'center',
    gap: 6,
  },
  logo: {
    width: 200,
    height: 52,
    tintColor: Colors.lit,
  },
  tagline: {
    fontSize: 14,
    color: Colors.lit2,
  },
  form: {
    gap: 14,
  },
  submitButton: {
    marginTop: 6,
  },
  forgotLink: {
    alignSelf: 'center',
    marginTop: 2,
  },
  forgotLinkText: {
    fontSize: 14,
    color: Colors.lit2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.lit2,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accent,
  },
})
