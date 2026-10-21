import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';
import { useTheme } from '../../hooks/useTheme';
import { dateFromApi, dateToApi, displayPetDate } from '../../utils/pet-date';

type Props = { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; optional?: boolean; minDate?: string; maxDate?: string };

/** Calendario web equivalente al selector nativo, sin ingreso manual de fechas. */
export function CalendarDateField({ label, value, onChange, disabled = false, optional = false, minDate, maxDate }: Props) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => value ? dateFromApi(value) : new Date());
  const { colors } = useTheme();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const today = dateToApi(new Date());
  function move(delta: number) { setMonth(current => new Date(current.getFullYear(), current.getMonth() + delta, 1)); }
  return <View style={{ gap: 8 }}>
    <AppText>{label}{optional ? ' (opcional)' : ''}</AppText>
    <AppButton variant="secondary" label={`${value ? displayPetDate(value) : 'Elegir fecha'}  📅`} disabled={disabled} onPress={() => { setMonth(value ? dateFromApi(value) : new Date()); setOpen(current => !current); }} />
    {optional && Boolean(value) && <AppButton compact variant="secondary" label="Quitar fecha" disabled={disabled} onPress={() => onChange('')} />}
    {open && <View style={{ gap: 8, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <AppButton compact variant="secondary" label="‹" accessibilityLabel="Mes anterior" onPress={() => move(-1)} />
        <AppText variant="subtitle">{month.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</AppText>
        <AppButton compact variant="secondary" label="›" accessibilityLabel="Mes siguiente" onPress={() => move(1)} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map(day => <View key={day} style={{ width: '14.28%', alignItems: 'center', paddingVertical: 5 }}><AppText variant="caption" muted>{day}</AppText></View>)}</View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{Array.from({ length: offset + days }, (_, index) => {
        const day = index - offset + 1;
        if (day < 1) return <View key={`empty-${index}`} style={{ width: '14.28%', minHeight: 42 }} />;
        const date = dateToApi(new Date(month.getFullYear(), month.getMonth(), day));
        const outsideRange = Boolean((minDate && date < minDate) || (maxDate && date > maxDate));
        return <Pressable key={date} accessibilityRole="button" accessibilityLabel={displayPetDate(date)} accessibilityState={{ disabled: disabled || outsideRange, selected: value === date }} disabled={disabled || outsideRange} onPress={() => { onChange(date); setOpen(false); }} style={{ width: '14.28%', minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: value === date ? colors.accent : 'transparent', opacity: outsideRange ? 0.35 : 1 }}><AppText>{day}{date === today ? ' ·' : ''}</AppText></Pressable>;
      })}</View>
      <AppButton compact variant="secondary" label="Cerrar calendario" onPress={() => setOpen(false)} />
    </View>}
  </View>;
}
