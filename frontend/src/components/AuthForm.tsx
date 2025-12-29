// AuthForm Component - Reusable form component for login/signup
// Mobile-first design with TailwindCSS
// Used by login and signup pages

'use client'

import React, { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import InputField from './InputField'
import Button from './Button'
import { isValidEmail, isValidPassword, isValidUsername } from '@/shared/utils/validation'

export interface AuthFormProps {
  mode: 'login' | 'signup'
  onSubmit: (data: AuthFormData) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export interface AuthFormData {
  name?: string // For signup - maps to username
  email: string
  password: string
}

/**
 * Reusable authentication form component
 * 
 * Usage:
 * ```tsx
 * <AuthForm
 *   mode="login"
 *   onSubmit={handleLogin}
 *   isLoading={loading}
 *   error={error}
 * />
 * ```
 * 
 * For React Native:
 * - Replace form with View
 * - Use TextInput from react-native instead of InputField
 * - Use TouchableOpacity instead of Button
 * - Keep the same validation logic
 */
export default function AuthForm({
  mode,
  onSubmit,
  isLoading = false,
  error: externalError,
}: AuthFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<AuthFormData>({
    name: '',
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof AuthFormData, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof AuthFormData, boolean>>>({})

  const validateField = (name: keyof AuthFormData, value: string): string | undefined => {
    if (!value.trim()) {
      return `${name === 'name' ? 'Name' : name.charAt(0).toUpperCase() + name.slice(1)} is required`
    }

    if (name === 'email' && !isValidEmail(value)) {
      return 'Please enter a valid email address'
    }

    if (name === 'password') {
      if (!isValidPassword(value)) {
        return 'Password must be at least 8 characters long'
      }
    }

    if (name === 'name' && mode === 'signup') {
      if (!isValidUsername(value)) {
        return 'Username must be 3-30 characters and contain only letters, numbers, and underscores'
      }
    }

    return undefined
  }

  const handleBlur = (name: keyof AuthFormData) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
    const error = validateField(name, formData[name] || '')
    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  const handleChange = (name: keyof AuthFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AuthFormData, string>> = {}

    if (mode === 'signup' && formData.name) {
      const nameError = validateField('name', formData.name)
      if (nameError) newErrors.name = nameError
    }

    const emailError = validateField('email', formData.email)
    if (emailError) newErrors.email = emailError

    const passwordError = validateField('password', formData.password)
    if (passwordError) newErrors.password = passwordError

    setErrors(newErrors)
    setTouched({
      name: mode === 'signup',
      email: true,
      password: true,
    })

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
    } catch (err) {
      // Error handling is done by parent component
      console.error('Form submission error:', err)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      {mode === 'signup' && (
        <InputField
          label="Username"
          type="text"
          name="name"
          id="name"
          value={formData.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          error={touched.name ? errors.name : undefined}
          placeholder="johndoe"
          required
          autoComplete="username"
        />
      )}

      <InputField
        label="Email"
        type="email"
        name="email"
        id="email"
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        onBlur={() => handleBlur('email')}
        error={touched.email ? errors.email : undefined}
        placeholder="you@example.com"
        required
        autoComplete={mode === 'login' ? 'email' : 'email'}
      />

      <InputField
        label="Password"
        type="password"
        name="password"
        id="password"
        value={formData.password}
        onChange={(e) => handleChange('password', e.target.value)}
        onBlur={() => handleBlur('password')}
        error={touched.password ? errors.password : undefined}
        placeholder={mode === 'login' ? 'Enter your password' : 'At least 8 characters'}
        required
        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        helperText={
          mode === 'signup' && !errors.password
            ? 'Must be at least 8 characters long'
            : undefined
        }
      />

      {externalError && (
        <div
          className="rounded-lg bg-red-50 border border-red-200 p-3 sm:p-4"
          role="alert"
        >
          <p className="text-sm text-red-800">{externalError}</p>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
        className="mt-6"
      >
        {mode === 'login' ? 'Sign In' : 'Create Account'}
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-slate-500 font-medium">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
          // Now pointing to the namespaced /api/v1/auth/facebook
          window.location.href = `${backendUrl}/auth/facebook`;
        }}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#1877F2] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[#166fe5] shadow-sm active:scale-[0.98]"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.37-4.669 1.235 0 2.528.22 2.528.22v2.78h-1.423c-1.49 0-1.95.925-1.95 1.874v2.25h3.134l-.501 3.47h-2.633V23.93C19.612 23.029 24 18.065 24 12.073z" />
        </svg>
        <span>Facebook</span>
      </button>

      {mode === 'login' && (
        <div className="text-center mt-4">
          <a
            href="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            Forgot your password?
          </a>
        </div>
      )}
    </form>
  )
}

