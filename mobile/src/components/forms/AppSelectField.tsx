import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppInput } from './AppInput';
import { AppModal } from '../ui/AppModal';
import { AppText } from '../ui/AppText';
import { SelectionRow } from '../ui/SelectionRow';
import { useTheme } from '../../hooks/useTheme';

export type SelectOption = { id: string; name: string };
type Props = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  required?: boolean;
  optional?: boolean;
  emptyLabel?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
};

/** Compact cross-platform select control with a scrollable, searchable option list. */
export function AppSelectField({ label, value, options, onChange, required = false, optional = false, emptyLabel = 'Sin asignar', placeholder = 'Elegir una opción', error, hint, disabled = false }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = options.find(option => option.id === value);
  const visibleOptions = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return term ? options.filter(option => option.name.toLocaleLowerCase().includes(term)) : options;
  }, [options, search]);
  const close = () => { setOpen(false); setSearch(''); };

  return <View style={styles.container}>
    <AppText variant="caption">{label}{required ? ' *' : optional ? ' (opcional)' : ''}</AppText>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}${selected ? `: ${selected.name}` : ''}`} accessibilityHint={error ?? hint ?? 'Abrir opciones'} accessibilityState={{ disabled, expanded: open }} disabled={disabled} onPress={() => { setSearch(''); setOpen(true); }} style={[styles.control, { backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border, opacity: disabled ? .6 : 1 }]}>
      <AppText numberOfLines={1} style={{ color: selected ? colors.text : colors.muted, flex: 1 }}>{selected?.name ?? placeholder}</AppText>
      <Ionicons name="chevron-down-outline" size={19} color={colors.muted} accessible={false}/>
    </Pressable>
    {Boolean(error || hint) && <AppText variant="caption" accessibilityLiveRegion="polite" style={{ color: error ? colors.danger : colors.muted }}>{error ?? hint}</AppText>}
    <AppModal visible={open} dismissible onClose={close}>
      <AppText variant="title">{label}</AppText>
      {options.length >= 8 && <AppInput icon="search-outline" label={`Buscar ${label.toLocaleLowerCase()}`} value={search} onChangeText={setSearch} autoCapitalize="none"/>}
      <View style={styles.options}>
        {optional && <SelectionRow radio label={emptyLabel} checked={!value} onPress={() => { onChange(''); close(); }} />}
        {visibleOptions.map(option => <SelectionRow key={option.id} radio label={option.name} checked={value === option.id} onPress={() => { onChange(option.id); close(); }} />)}
        {!visibleOptions.length && <AppText muted>No hay opciones que coincidan con la búsqueda.</AppText>}
      </View>
      <AppText variant="caption" muted>{options.length} {options.length === 1 ? 'opción disponible' : 'opciones disponibles'}</AppText>
    </AppModal>
  </View>;
}

const styles = StyleSheet.create({
  container: { width: '100%', gap: 6 },
  control: { minHeight: 50, width: '100%', paddingHorizontal: 14, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  options: { width: '100%', gap: 8 },
});
