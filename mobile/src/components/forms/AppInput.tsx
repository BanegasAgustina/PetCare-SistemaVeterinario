// Este archivo se encarga de lo siguiente: Control de formulario reutilizable; captura o valida datos ingresados en la aplicación.

/** Campo accesible con error, foco, autocompletado y opción para mostrar contraseña. */
import { forwardRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { AppText } from '../ui/AppText';
import { useTheme } from '../../hooks/useTheme';
import Ionicons from '@expo/vector-icons/Ionicons';

// Tipo AppInputProps: define la forma o las opciones válidas de los datos usados por este módulo.
type AppInputProps = TextInputProps & { label: string; error?: string; hint?: string; password?: boolean; compact?: boolean; icon?: 'mail-outline' | 'lock-closed-outline' | 'search-outline'; prefix?: string; required?: boolean };
// Dato AppInput: conserva un valor calculado o de configuración usado por este módulo.
export const AppInput = forwardRef<ComponentRef<typeof TextInput>, AppInputProps>(function AppInput({ label, error, hint, password = false, compact = false, icon, prefix, required = false, style, onFocus, onBlur, ...props }, ref) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const fieldIcon = icon ?? (/buscar|search/i.test(label) ? 'search-outline' : undefined);
  return (
    <View style={[styles.container, compact && { gap: 3 }]}>
      <AppText variant="caption" accessibilityLabel={required ? `${label}, obligatorio` : label}>{label}{required ? ' *' : ''}</AppText>
      <View style={[styles.field, { backgroundColor: colors.surface, borderColor: error ? colors.danger : focused ? colors.focus : colors.border, opacity: props.editable === false ? 0.6 : 1 }]}>
        {Boolean(prefix) && <AppText style={[styles.prefix, { color: colors.muted }]}>{prefix}</AppText>}
        {/* Los iconos son optativos: Registro conserva su presentación actual. */}
        {fieldIcon && <Ionicons name={fieldIcon} size={20} color={focused ? colors.focus : colors.muted} style={styles.leadingIcon} accessible={false} />}
        <TextInput {...props} ref={ref} editable={props.editable ?? true} focusable={props.focusable ?? props.editable !== false}
          showSoftInputOnFocus={props.showSoftInputOnFocus ?? props.editable !== false} selectionColor={colors.focus} underlineColorAndroid="transparent"
          accessibilityLabel={label} accessibilityHint={error ?? hint} placeholderTextColor={colors.muted}
          autoCapitalize={props.autoCapitalize ?? 'none'} secureTextEntry={password ? !visible : props.secureTextEntry}
          onFocus={(event) => { setFocused(true); onFocus?.(event); }} onBlur={(event) => { setFocused(false); onBlur?.(event); }}
          style={[styles.input, Platform.OS === 'web' && styles.webInput, fieldIcon && styles.iconInput, compact && styles.compactInput, { color: colors.text }, style]} />
        {/* Cambia únicamente secureTextEntry; no modifica la contraseña del formulario. */}
        {password && <Pressable disabled={props.editable === false} accessibilityRole="button" accessibilityState={{ disabled: props.editable === false }} accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} onPress={() => setVisible(!visible)} style={[styles.toggle, compact && { minHeight: 44, minWidth: 44}]}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.primary} accessible={false} />
        </Pressable>}
      </View>
      {Boolean(error || hint) && <AppText variant="caption" accessibilityLiveRegion="polite" style={{ color: error ? colors.danger : colors.muted }}>{error ?? hint}</AppText>}
    </View>
  );
});
// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({
  container: { gap: 6, width: '100%' },
  field: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 15 },
  input: { flex: 1, minWidth: 0, minHeight: 54, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16 },
  webInput: { outlineWidth: 0 },
  leadingIcon: { marginLeft: 14, marginRight: 8, transform: [{ translateY: -1 }] }, iconInput: { paddingLeft: 0 },
  compactInput: { minHeight: 44, paddingVertical: 10, fontSize: 14 }, prefix: { paddingLeft: 14, fontSize: 16 },
  toggle: { minHeight: 48, minWidth: 68, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
});
