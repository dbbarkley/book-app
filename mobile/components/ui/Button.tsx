import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native'
import { Colors } from '@/constants/colors'

type Variant = 'primary' | 'ghost' | 'danger'

interface ButtonProps {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: Variant
  style?: ViewStyle
  labelStyle?: TextStyle
}

export default function Button({
  label,
  onPress,
  loading   = false,
  disabled  = false,
  variant   = 'primary',
  style,
  labelStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[styles.base, styles[variant], isDisabled && styles.disabled, style]}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? Colors.accentOn : Colors.lit2} />
        : <Text style={[styles.label, labelStyles[variant], labelStyle]}>{label}</Text>
      }
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primary: {
    backgroundColor: Colors.accent,
  },
  ghost: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.rim,
  },
  danger: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.rim,
  },
  disabled: {
    opacity: 0.55,
  },
})

const labelStyles = StyleSheet.create({
  primary: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.accentOn,
  },
  ghost: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.lit2,
  },
  danger: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.error,
  },
})
