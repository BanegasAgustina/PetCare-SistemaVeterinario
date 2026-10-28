// Este archivo se encarga de lo siguiente: Control de formulario reutilizable; captura o valida datos ingresados en la aplicación.

import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';
import { useTheme } from '../../hooks/useTheme';
import { dateFromApi, dateToApi, displayPetDate } from '../../utils/pet-date';

// Tipo Props: define la forma o las opciones válidas de los datos usados por este módulo.
type Props = { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; optional?: boolean; minDate?: string; maxDate?: string };
// Dato monthNames: conserva un valor calculado o de configuración usado por este módulo.
const monthNames = Array.from({ length: 12 }, (_, month) => new Date(2020, month, 1).toLocaleDateString('es-AR', { month: 'long' }));

/** Calendario web con selección directa de año y mes, sin ingreso manual de fechas. */
// Función CalendarDateField: concentra la lógica dentro de este módulo.
export function CalendarDateField({ label, value, onChange, disabled = false, optional = false, minDate, maxDate }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'days' | 'months' | 'years'>('days');
  const [month, setMonth] = useState(() => value ? dateFromApi(value) : new Date());
  const { colors } = useTheme();
  const year = month.getFullYear();
  const days = new Date(year, month.getMonth() + 1, 0).getDate();
  const offset = new Date(year, month.getMonth(), 1).getDay();
  const lowerYear = minDate ? dateFromApi(minDate).getFullYear() : 1900;
  const upperYear = maxDate ? dateFromApi(maxDate).getFullYear() : new Date().getFullYear() + 10;
  const years = Array.from({ length: Math.max(0, upperYear - lowerYear + 1) }, (_, index) => upperYear - index);
  // Función close: concentra la lógica dentro de este módulo.
function close() { setOpen(false); setView('days'); }
  return <View style={{ gap: 8 }}>
    <AppText>{label}{optional ? ' (opcional)' : ''}</AppText>
    <AppButton variant="secondary" label={`${value ? displayPetDate(value) : 'Elegir fecha'}  📅`} disabled={disabled} onPress={() => { setMonth(value ? dateFromApi(value) : new Date()); setView('days'); setOpen(current => !current); }} />
    {optional && Boolean(value) && <AppButton compact variant="secondary" label="Quitar fecha" disabled={disabled} onPress={() => onChange('')} />}
    {open && <View style={{ gap: 10, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
        <AppButton compact variant="secondary" label="‹" accessibilityLabel="Mes anterior" disabled={Boolean(minDate && dateToApi(new Date(year, month.getMonth(), 1)) <= minDate)} onPress={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))} />
        <View style={{ flexDirection: 'row', gap: 4 }}><AppButton compact variant={view === 'months' ? 'primary' : 'secondary'} label={monthNames[month.getMonth()]} onPress={() => setView(view === 'months' ? 'days' : 'months')} /><AppButton compact variant={view === 'years' ? 'primary' : 'secondary'} label={String(year)} onPress={() => setView(view === 'years' ? 'days' : 'years')} /></View>
        <AppButton compact variant="secondary" label="›" accessibilityLabel="Mes siguiente" disabled={Boolean(maxDate && dateToApi(new Date(year, month.getMonth() + 1, 0)) >= maxDate)} onPress={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))} />
      </View>
      {view === 'years' ? <ScrollView nativeID="petcare-web-scroll-calendar-years" style={{ maxHeight: 260 }} nestedScrollEnabled><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{years.map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: item === year }} onPress={() => { setMonth(current => new Date(item, current.getMonth(), 1)); setView('months'); }} style={{ width: '23%', minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: item === year ? colors.accent : colors.background }}><AppText>{item}</AppText></Pressable>)}</View></ScrollView> : view === 'months' ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{monthNames.map((name, index) => { const first = dateToApi(new Date(year, index, 1)); const last = dateToApi(new Date(year, index + 1, 0)); const outside = Boolean((minDate && last < minDate) || (maxDate && first > maxDate)); return <Pressable key={name} accessibilityRole="button" accessibilityState={{ selected: index === month.getMonth(), disabled: outside }} disabled={outside} onPress={() => { setMonth(current => new Date(current.getFullYear(), index, 1)); setView('days'); }} style={{ width: '30%', minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: index === month.getMonth() ? colors.accent : colors.background, opacity: outside ? 0.4 : 1 }}><AppText>{name.slice(0, 3)}</AppText></Pressable>; })}</View> : <>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map(day => <View key={day} style={{ width: '14.28%', alignItems: 'center', paddingVertical: 5 }}><AppText variant="caption" muted>{day}</AppText></View>)}</View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{Array.from({ length: offset + days }, (_, index) => { const day = index - offset + 1; if (day < 1) return <View key={`empty-${index}`} style={{ width: '14.28%', minHeight: 42 }} />; const date = dateToApi(new Date(year, month.getMonth(), day)); const outside = Boolean((minDate && date < minDate) || (maxDate && date > maxDate)); const selected = value === date; return <Pressable key={date} accessibilityRole="button" accessibilityLabel={displayPetDate(date)} accessibilityState={{ disabled: disabled || outside, selected }} disabled={disabled || outside} onPress={() => { if (!outside) { onChange(date); close(); } }} style={{ width: '14.28%', minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: selected ? colors.primary : 'transparent', opacity: outside ? 0.35 : 1 }}><AppText style={{ color: selected ? colors.onPrimary : colors.text }}>{day}{date === dateToApi(new Date()) ? ' ·' : ''}</AppText></Pressable>; })}</View>
      </>}
      <AppButton compact variant="secondary" label="Cerrar calendario" onPress={close} />
    </View>}
  </View>;
}
