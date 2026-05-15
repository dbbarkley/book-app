import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { apiClient } from '@book-app/shared'
import { CheckCircle, Mail } from 'lucide-react-native'
import AppTextInput from '@/components/ui/AppTextInput'
import Button from '@/components/ui/Button'
import { Colors } from '@/constants/colors'

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets()
  const [email,       setEmail]       = useState('')
  const [emailError,  setEmailError]  = useState<string | undefined>()
  const [loading,     setLoading]     = useState(false)
  const [submitted,   setSubmitted]   = useState(false)

  const validate = () => {
    if (!email.trim())             { setEmailError('Email is required');         return false }
    if (!email.includes('@'))      { setEmailError('Enter a valid email');        return false }
    return true
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await apiClient.forgotPassword(email.trim().toLowerCase())
      setSubmitted(true)
    } catch (err: unknown) {
      // Still show success to avoid leaking whether an account exists
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.container}>
          {/* Icon */}
          <View style={styles.iconCircle}>
            <CheckCircle size={24} color={Colors.accent} />
          </View>

          <Text style={styles.heading}>Check your email</Text>
          <Text style={styles.body}>
            We sent a reset link to{' '}
            <Text style={styles.emailHighlight}>{email}</Text>
            {'. '}
            Don't see it? Check your spam folder.
          </Text>

          <Button
            label="Send another link"
            onPress={() => { setSubmitted(false); setEmail('') }}
            style={styles.button}
          />
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={styles.backLink}>
            <Text style={styles.backLinkText}>← Back to sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // ── Form state ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={[
            styles.container,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
          ]}
        >
          {/* Back link */}
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={[styles.topBack, { top: insets.top + 16 }]}>
            <Text style={styles.backLinkText}>← Back</Text>
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconCircle}>
            <Mail size={24} color={Colors.accent} />
          </View>

          <Text style={styles.heading}>Forgot Password?</Text>
          <Text style={styles.body}>
            Enter your email and we'll send you a reset link.
          </Text>

          <View style={styles.form}>
            <AppTextInput
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={(v) => { setEmail(v); setEmailError(undefined) }}
              error={emailError}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="send"
              onSubmitEditing={handleSubmit}
            />
            <Button
              label="Send reset link"
              onPress={handleSubmit}
              loading={loading}
              style={styles.button}
            />
          </View>
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
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    gap: 16,
  },
  topBack: {
    position: 'absolute',
    left: 28,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(201,168,76,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.45)',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.lit,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: Colors.lit2,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  emailHighlight: {
    color: Colors.lit,
    fontWeight: '600',
  },
  form: {
    gap: 14,
    marginTop: 8,
  },
  button: {
    marginTop: 6,
  },
  backLink: {
    alignSelf: 'center',
    marginTop: 8,
  },
  backLinkText: {
    fontSize: 14,
    color: Colors.lit2,
  },
})
