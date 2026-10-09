import { useState, type PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { AppButton } from './AppButton';

export function FilterDisclosure({ children, activeCount = 0, onApply, onClear }: PropsWithChildren<{ activeCount?: number; onApply: () => void; onClear: () => void }>) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return <View style={styles.wrap}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(value => !value)} style={[styles.trigger, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Ionicons name="options-outline" size={18} color={colors.primary}/><AppText>Filtros</AppText>
      {activeCount > 0 && <View style={[styles.badge, { backgroundColor: colors.primary }]}><AppText variant="caption" style={{ color: colors.onPrimary }}>{activeCount}</AppText></View>}
      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.muted}/>
    </Pressable>
    {open && <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {children}
      <View style={styles.actions}><AppButton compact variant="secondary" label="Limpiar" onPress={onClear}/><AppButton compact label="Aplicar" onPress={() => { onApply(); setOpen(false); }}/></View>
    </View>}
  </View>;
}
const styles = StyleSheet.create({ wrap: { gap: 8 }, trigger: { minHeight: 42, paddingHorizontal: 11, borderWidth: 1, borderRadius: 6, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8 }, badge: { minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, panel: { padding: 14, borderWidth: 1, borderRadius: 7, gap: 12 }, actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 } });
