import { forwardRef, useState } from 'react'
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
} from 'react-native'
import { Eye, EyeOff } from 'lucide-react-native'
import { Colors } from '@/constants/colors'

interface AppTextInputProps extends TextInputProps {
  label?: string
  error?: string
}

const AppTextInput = forwardRef<TextInput, AppTextInputProps>(
  ({ label, error, style, secureTextEntry, ...props }, ref) => {
    const [showPwd, setShowPwd] = useState(false)

    return (
      <View style={styles.wrapper}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View style={styles.inputRow}>
          <TextInput
            ref={ref}
            style={[
              styles.input,
              error && styles.inputError,
              secureTextEntry && styles.inputWithToggle,
              style,
            ]}
            placeholderTextColor={Colors.lit3}
            selectionColor={Colors.accent}
            secureTextEntry={secureTextEntry ? !showPwd : false}
            {...props}
          />
          {secureTextEntry && (
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPwd((v) => !v)}
              hitSlop={8}
              accessibilityLabel={showPwd ? 'Hide password' : 'Show password'}
              accessibilityRole="button"
            >
              {showPwd
                ? <EyeOff size={18} color={Colors.lit3} />
                : <Eye    size={18} color={Colors.lit3} />
              }
            </TouchableOpacity>
          )}
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    )
  }
)

AppTextInput.displayName = 'AppTextInput'

export default AppTextInput

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.lit2,
    letterSpacing: 0.3,
  },
  inputRow: {
    position: 'relative',
  },
  input: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: Colors.lit,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.rim,
  },
  inputWithToggle: {
    paddingRight: 48,
  },
  inputError: {
    borderColor: Colors.error,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  error: {
    fontSize: 12,
    color: Colors.error,
  },
})
