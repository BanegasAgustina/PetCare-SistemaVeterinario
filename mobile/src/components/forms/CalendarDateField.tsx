// Este archivo se encarga de lo siguiente: Control de formulario reutilizable; captura o valida datos ingresados en la aplicación.

import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';
import { AppModal } from '../ui/AppModal';
import { useTheme } from '../../hooks/useTheme';
import { dateFromApi, dateToApi, displayPetDate } from '../../utils/pet-date';

// Tipo Props: define la forma o las opciones válidas de los datos usados por este módulo.
type Props = { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; optional?: boolean; minDate?: string; maxDate?: string };
// Dato monthNames: conserva un valor calculado o de configuración usado por este módulo.
const monthNames = Array.from({ length: 12 }, (_, month) => new Date(2020, month, 1).toLocaleDateString('es-AR', { month: 'long' }));

/** Selector de fecha civil multiplataforma; el valor intercambiado con formularios es YYYY-MM-DD. */
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
  // Función close: agrupa una operación que este módulo puede ejecutar o reutilizar.
const close = () => { setOpen(false); setView('days'); };
  // Función selectDate: concentra la lógica dentro de este módulo.
function selectDate(date: string) { if ((minDate && date < minDate) || (maxDate && date > maxDate)) return; onChange(date); close(); }
  return <>
    <AppText>{label}{optional ? ' (opcional)' : ''}</AppText>
    <AppButton variant="secondary" label={`${value ? displayPetDate(value) : 'Elegir fecha'}  📅`} disabled={disabled} onPress={() => { setMonth(value ? dateFromApi(value) : new Date()); setView('days'); setOpen(true); }} />
    {optional && Boolean(value) && <AppButton compact variant="secondary" label="Quitar fecha" disabled={disabled} onPress={() => onChange('')} />}
    <AppModal visible={open} dismissible onClose={close}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <AppButton compact variant="secondary" label="‹" accessibilityLabel="Mes anterior" disabled={Boolean(minDate && dateToApi(new Date(year, month.getMonth(), 1)) <= minDate)} onPress={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))} />
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
          <AppButton compact variant={view === 'months' ? 'primary' : 'secondary'} label={monthNames[month.getMonth()]} onPress={() => setView(view === 'months' ? 'days' : 'months')} />
          <AppButton compact variant={view === 'years' ? 'primary' : 'secondary'} label={String(year)} onPress={() => setView(view === 'years' ? 'days' : 'years')} />
        </View>
        <AppButton compact variant="secondary" label="›" accessibilityLabel="Mes siguiente" disabled={Boolean(maxDate && dateToApi(new Date(year, month.getMonth() + 1, 0)) >= maxDate)} onPress={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))} />
      </View>
      {view === 'years' ? <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{years.map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: item === year }} onPress={() => { setMonth(current => new Date(item, current.getMonth(), 1)); setView('months'); }} style={{ width: '23%', minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: item === year ? colors.accent : colors.surface }}><AppText>{item}</AppText></Pressable>)}</View></ScrollView> : view === 'months' ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{monthNames.map((name, index) => { const first = dateToApi(new Date(year, index, 1)); const last = dateToApi(new Date(year, index + 1, 0)); const outside = Boolean((minDate && last < minDate) || (maxDate && first > maxDate)); return <Pressable key={name} accessibilityRole="button" accessibilityState={{ selected: index === month.getMonth(), disabled: outside }} disabled={outside} onPress={() => { setMonth(current => new Date(current.getFullYear(), index, 1)); setView('days'); }} style={{ width: '30%', minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: index === month.getMonth() ? colors.accent : colors.surface, opacity: outside ? 0.4 : 1 }}><AppText>{name.slice(0, 3)}</AppText></Pressable>; })}</View> : <>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map(day => <View key={day} style={{ width: '14.28%', alignItems: 'center', paddingVertical: 5 }}><AppText variant="caption" muted>{day}</AppText></View>)}</View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{Array.from({ length: offset + days }, (_, index) => { const day = index - offset + 1; if (day < 1) return <View key={`empty-${index}`} style={{ width: '14.28%', minHeight: 44 }} />; const date = dateToApi(new Date(year, month.getMonth(), day)); const outside = Boolean((minDate && date < minDate) || (maxDate && date > maxDate)); const selected = value === date; return <Pressable key={date} accessibilityRole="button" accessibilityLabel={displayPetDate(date)} accessibilityState={{ disabled: disabled || outside, selected }} disabled={disabled || outside} onPress={() => selectDate(date)} style={{ width: '14.28%', minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: selected ? colors.primary : colors.surface, opacity: outside ? 0.35 : 1 }}><AppText style={{ color: selected ? colors.onPrimary : colors.text }}>{day}</AppText></Pressable>; })}</View>
      </>}
      <AppButton variant="secondary" label="Cerrar calendario" onPress={close} />
    </AppModal>
  </>;
}
