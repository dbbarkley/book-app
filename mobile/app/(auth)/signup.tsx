import { useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native'
import { Link } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '@book-app/shared'
import AppTextInput from '@/components/ui/AppTextInput'
import Button from '@/components/ui/Button'
import { Colors } from '@/constants/colors'

export default function SignupScreen() {
  const [email,    setEmail]    = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors,   setErrors]   = useState<{
    email?: string; username?: string; password?: string
  }>({})

  const usernameRef = useRef<TextInput>(null)
  const passwordRef = useRef<TextInput>(null)

  const register = useAuthStore((s) => s.register)
  const loading  = useAuthStore((s) => s.loading)

  const insets = useSafeAreaInsets()

  const validate = () => {
    const e: typeof errors = {}
    if (!email.trim())                   e.email    = 'Email is required'
    else if (!email.includes('@'))       e.email    = 'Enter a valid email'
    if (!username.trim())                e.username = 'Username is required'
    else if (username.trim().length < 3) e.username = 'Username must be at least 3 characters'
    else if (/\s/.test(username))        e.username = 'Username cannot contain spaces'
    if (!password)                       e.password = 'Password is required'
    else if (password.length < 8)        e.password = 'Password must be at least 8 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const clearError = (field: keyof typeof errors) =>
    setErrors((e) => ({ ...e, [field]: undefined }))

  const handleSignup = async () => {
    if (!validate()) return
    try {
      await register(email.trim().toLowerCase(), username.trim().toLowerCase(), password)
      // Root layout's route guard will navigate to (tabs) automatically
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign up failed. Please try again.'
      Alert.alert('Sign up failed', msg)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Brand */}
        <View style={styles.brand}>
          <Text style={styles.logo}>Libraio</Text>
          <Text style={styles.tagline}>Create your account</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <AppTextInput
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={(v) => { setEmail(v); clearError('email') }}
            error={errors.email}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => usernameRef.current?.focus()}
          />
          <AppTextInput
            ref={usernameRef}
            label="Username"
            placeholder="readinggenius"
            value={username}
            onChangeText={(v) => { setUsername(v); clearError('username') }}
            error={errors.username}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <AppTextInput
            ref={passwordRef}
            label="Password"
            placeholder="8+ characters"
            value={password}
            onChangeText={(v) => { setPassword(v); clearError('password') }}
            error={errors.password}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSignup}
          />

          <Button
            label="Create Account"
            onPress={handleSignup}
            loading={loading}
            style={styles.submitButton}
          />
        </View>

        {/* Login link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity hitSlop={8}>
              <Text style={styles.footerLink}> Log In</Text>
            </TouchableOpacity>
          </Link>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    gap: 32,
  },
  brand: {
    alignItems: 'center',
    gap: 6,
  },
  logo: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: -1,
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
