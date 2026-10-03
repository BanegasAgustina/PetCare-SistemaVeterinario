/** Un input numérico con seis casillas visuales: foco, avance, borrado y pegado coherentes. */
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { useTheme } from '../../hooks/useTheme';

export function VerificationCodeInput({ value, onChange, disabled, invalid }: { value: string; onChange: (value: string) => void; disabled?: boolean; invalid?: boolean }) {
  const { colors } = useTheme();
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  return <View style={styles.root}>
    <Pressable onPress={() => input.current?.focus()} disabled={disabled} accessible={false} style={styles.cells}>
      {Array.from({ length: 6 }, (_, index) => <View key={index} style={[styles.cell, { backgroundColor: colors.background,
        borderColor: invalid ? colors.danger : focused && index === Math.min(value.length, 5) ? colors.primary : colors.border,
        borderWidth: focused && index === Math.min(value.length, 5) ? 2 : 1 }]}><AppText style={styles.digit}>{value[index] ?? ''}</AppText></View>)}
    </Pressable>
    {/* El cursor siempre queda al final. Pegar con espacios también completa las seis casillas. */}
    <TextInput ref={input} accessibilityLabel="Código de verificación de seis dígitos" keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode"
      value={value} onChangeText={text => onChange(text.replace(/\D/g, '').slice(0, 6))} selection={{ start: value.length, end: value.length }}
      editable={!disabled} maxLength={24} caretHidden autoFocus onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={styles.input} />
  </View>;
}
const styles = StyleSheet.create({
  root: { width: '100%' }, cells: { flexDirection: 'row', gap: 7 }, cell: { flex: 1, minWidth: 0, aspectRatio: 0.85, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  digit: { fontSize: 24, fontWeight: '700' }, input: { position: 'absolute', width: '100%', height: '100%', opacity: 0.01, color: 'transparent' },
});
