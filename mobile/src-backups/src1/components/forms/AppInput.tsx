/** Campo accesible con error, foco, autocompletado y opción para mostrar contraseña. */
import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { AppText } from '../ui/AppText';
import { useTheme } from '../../hooks/useTheme';
import Ionicons from '@expo/vector-icons/Ionicons';

type AppInputProps = TextInputProps & { label: string; error?: string; hint?: string; password?: boolean; compact?: boolean; icon?: 'mail-outline' | 'lock-closed-outline' };
export const AppInput = forwardRef<TextInput, AppInputProps>(function AppInput({ label, error, hint, password = false, compact = false, icon, style, onFocus, onBlur, ...props }, ref) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  return (
    <View style={[styles.container, compact && { gap: 3 }]}>
      <AppText variant="caption">{label}</AppText>
      <View style={[styles.field, { backgroundColor: colors.surface, borderColor: error ? colors.danger : focused ? colors.primary : colors.border, opacity: props.editable === false ? 0.6 : 1 }]}>
        {/* Los iconos son optativos: Registro conserva su presentación actual. */}
        {icon && <Ionicons name={icon} size={20} color={focused ? colors.primary : colors.muted} style={styles.leadingIcon} accessible={false} />}
        <TextInput {...props} ref={ref} accessibilityLabel={label} accessibilityHint={error ?? hint} placeholderTextColor={colors.muted}
          autoCapitalize={props.autoCapitalize ?? 'none'} secureTextEntry={password ? !visible : props.secureTextEntry}
          onFocus={(event) => { setFocused(true); onFocus?.(event); }} onBlur={(event) => { setFocused(false); onBlur?.(event); }}
          style={[styles.input, icon && styles.iconInput, compact && styles.compactInput, { color: colors.text }, style]} />
        {/* Cambia únicamente secureTextEntry; no modifica la contraseña del formulario. */}
        {password && <Pressable disabled={props.editable === false} accessibilityRole="button" accessibilityState={{ disabled: props.editable === false }} accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} onPress={() => setVisible(!visible)} style={[styles.toggle, compact && { minHeight: 44, minWidth: 44 }]}>
          {icon ? <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.primary} accessible={false} /> : <AppText variant="caption" style={{ color: colors.primary }}>{visible ? 'Ocultar' : 'Mostrar'}</AppText>}
        </Pressable>}
      </View>
      {(error || hint) && <AppText variant="caption" accessibilityLiveRegion="polite" style={{ color: error ? colors.danger : colors.muted }}>{error ?? hint}</AppText>}
    </View>
  );
});
const styles = StyleSheet.create({
  container: { gap: 6, width: '100%' },
  field: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14 },
  input: { flex: 1, minWidth: 0, minHeight: 54, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16 },
  leadingIcon: { marginLeft: 14 }, iconInput: { paddingLeft: 10 },
  compactInput: { minHeight: 44, paddingVertical: 10, fontSize: 14 },
  toggle: { minHeight: 48, minWidth: 68, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
});
