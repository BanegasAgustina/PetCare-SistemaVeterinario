/**
 * ARCHIVO: AppSelectField.tsx
 * UBICACIÓN: mobile/src/components/forms/AppSelectField.tsx
 * FUNCIÓN: Selector de una opción con búsqueda, carga incremental y presentación modal adaptable.
 * RESPONSABILIDAD: Elegir elementos de catálogos cortos o remotos con etiqueta, ayuda y error.
 * CONEXIONES: Importa: mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/SelectionRow.tsx, mobile/src/hooks/useTheme.ts, mobile/src/utils/search-normalization.ts Se utiliza desde: mobile/src/app/admin/products.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/app/client/appointments/request.tsx, mobile/src/components/admin/SpecialtiesScreen.tsx, mobile/src/components/clinic/AgendaScreen.tsx y 5 más
 * FUNCIONAMIENTO: Filtra localmente con normalización o usa searchValue/onSearchChange del padre; delega selección y paginación por callbacks.
 * IMPORTANCIA: Permite seleccionar catálogos grandes sin acoplar el control al origen de datos.
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppInput } from './AppInput';
import { AppModal } from '../ui/AppModal';
import { AppText } from '../ui/AppText';
import { SelectionRow } from '../ui/SelectionRow';
import { useTheme } from '../../hooks/useTheme';
import { normalizeSearchTerm } from '../../utils/search-normalization';

// Tipo SelectOption: define la forma o las opciones válidas de los datos usados por este módulo.
export type SelectOption = { id: string; name: string };
// Tipo Props: define la forma o las opciones válidas de los datos usados por este módulo.
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
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value:string)=>void;
  loading?: boolean;
  selectedLabel?:string;
  hasMore?:boolean;
  onLoadMore?:()=>void;
  largeText?:boolean;
};

/** Compact cross-platform select control with a scrollable, searchable option list. */
/** Resuelve etiqueta, búsqueda y selección; el padre controla el valor elegido y la carga remota. */
export function AppSelectField({ label, value, options, onChange, required = false, optional = false, emptyLabel = 'Sin asignar', placeholder = 'Elegir una opción', error, hint, disabled = false, searchable = true, searchValue, onSearchChange, loading = false,selectedLabel,hasMore=false,onLoadMore,largeText=false }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = options.find(option => option.id === value)??(value?{id:value,name:selectedLabel||'Elemento seleccionado'}:undefined);
  const visibleOptions = useMemo(() => {
    const term = normalizeSearchTerm((searchValue??search).trim());
    return term ? options.filter(option => normalizeSearchTerm(option.name).includes(term)) : options;
  }, [options, search,searchValue]);
  /** Cierra el selector y restablece su búsqueda local. */
const close = () => { setOpen(false); setSearch(''); };

  return <View style={styles.container}>
    <AppText variant={largeText ? 'body' : 'caption'}>{label}{required ? ' *' : optional ? ' (opcional)' : ''}</AppText>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}${selected ? `: ${selected.name}` : ''}`} accessibilityHint={error ?? hint ?? 'Abrir opciones'} accessibilityState={{ disabled, expanded: open }} disabled={disabled} onPress={() => { setSearch(''); setOpen(true); }} style={[styles.control, { backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border, opacity: disabled ? .6 : 1 }]}>
      <AppText numberOfLines={1} style={{ color: selected ? colors.text : colors.muted, flex: 1 }}>{selected?.name ?? placeholder}</AppText>
      <Ionicons name="chevron-down-outline" size={19} color={colors.muted} accessible={false}/>
    </Pressable>
    {Boolean(error || hint) && <AppText variant={largeText ? 'body' : 'caption'} accessibilityLiveRegion="polite" style={{ color: error ? colors.danger : colors.muted }}>{error ?? hint}</AppText>}
    <AppModal visible={open} dismissible onClose={close}>
      <AppText variant="title">{label}</AppText>
      {searchable && (options.length > 0||onSearchChange) && <AppInput icon="search-outline" label={`Buscar ${label.toLocaleLowerCase()}`} placeholder={`Buscar ${label.toLocaleLowerCase()}…`} value={searchValue??search} onChangeText={value=>{if(onSearchChange)onSearchChange(value);else setSearch(value);}} autoCapitalize="none" autoCorrect={false}/>}
      <View style={styles.options}>
        {optional && <SelectionRow radio label={emptyLabel} checked={!value} onPress={() => { onChange(''); close(); }} />}
        {visibleOptions.map(option => <SelectionRow key={option.id} radio label={option.name} checked={value === option.id} onPress={() => { onChange(option.id); close(); }} />)}
        {!visibleOptions.length && <AppText muted>{loading?'Buscando…':'No se encontraron resultados.'}</AppText>}
        {loading&&Boolean(visibleOptions.length)&&<AppText muted>Actualizando resultados…</AppText>}
        {hasMore&&onLoadMore&&<Pressable accessibilityRole="button" disabled={loading} onPress={onLoadMore} style={{padding:12,alignItems:'center'}}><AppText style={{color:colors.primary,fontWeight:'700'}}>{loading?'Cargando…':'Cargar más resultados'}</AppText></Pressable>}
      </View>
      <AppText variant={largeText ? 'body' : 'caption'} muted>{options.length} {options.length === 1 ? 'opción disponible' : 'opciones disponibles'}</AppText>
    </AppModal>
  </View>;
}

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({
  container: { width: '100%', gap: 6 },
  control: { minHeight: 50, width: '100%', paddingHorizontal: 14, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  options: { width: '100%', gap: 8 },
});
