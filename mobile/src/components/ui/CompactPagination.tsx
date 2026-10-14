import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from './AppText';

export function CompactPagination({ page, canPrevious, canNext, onPrevious, onNext, summary }: { page: number; canPrevious: boolean; canNext: boolean; onPrevious: () => void; onNext: () => void; summary?: string }) {
  const { colors } = useTheme();
  if (page <= 1 && !canNext) return null;
  return <View style={styles.row}>
    {summary && <AppText muted style={styles.summary}>{summary}</AppText>}
    <View style={styles.controls}>
      <Pressable accessibilityRole="button" accessibilityLabel="Página anterior" disabled={!canPrevious} onPress={onPrevious} style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }, !canPrevious && styles.disabled]}><Ionicons name="chevron-back" size={19} color={canPrevious ? colors.text : colors.muted}/></Pressable>
      <AppText variant="caption" style={styles.page}>Página {page}</AppText>
      <Pressable accessibilityRole="button" accessibilityLabel="Página siguiente" disabled={!canNext} onPress={onNext} style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }, !canNext && styles.disabled]}><Ionicons name="chevron-forward" size={19} color={canNext ? colors.text : colors.muted}/></Pressable>
    </View>
  </View>;
}
const styles = StyleSheet.create({ row: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, summary: { flex: 1 }, controls: { flexDirection: 'row', alignItems: 'center', gap: 10 }, button: { width: 36, height: 36, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: 0.45 }, page: { minWidth: 62, textAlign: 'center' } });
