import { useState } from 'react';
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';
import { dateFromApi, dateToApi, displayPetDate } from '../../utils/pet-date';
import { useTheme } from '../../hooks/useTheme';

type Props = { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; optional?: boolean; minDate?: string; maxDate?: string };

/** Selector de fecha civil; el valor intercambiado con formularios es YYYY-MM-DD. */
export function CalendarDateField({ label, value, onChange, disabled = false, optional = false, minDate, maxDate }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value ? dateFromApi(value) : new Date());
  const { mode, colors } = useTheme();
  return <>
    <AppText>{label}{optional ? ' (opcional)' : ''}</AppText>
    <AppButton variant="secondary" label={`${value ? displayPetDate(value) : 'Elegir fecha'}  📅`} disabled={disabled} onPress={() => { setDraft(value ? dateFromApi(value) : new Date()); setOpen(true); }} />
    {optional && Boolean(value) && <AppButton compact variant="secondary" label="Quitar fecha" disabled={disabled} onPress={() => onChange('')} />}
    {open && <>
      <DateTimePicker value={draft} mode="date" display={Platform.OS === 'android' ? 'calendar' : 'spinner'} locale="es-AR" themeVariant={mode} textColor={colors.text}
        minimumDate={minDate ? dateFromApi(minDate) : undefined} maximumDate={maxDate ? dateFromApi(maxDate) : undefined}
        onDismiss={() => setOpen(false)} onValueChange={(_event, date) => {
          if (!date) return;
          setDraft(date);
          if (Platform.OS === 'android') { onChange(dateToApi(date)); setOpen(false); }
        }} />
      {Platform.OS === 'ios' && <><AppButton compact label="Usar fecha" onPress={() => { onChange(dateToApi(draft)); setOpen(false); }} /><AppButton compact variant="secondary" label="Cancelar" onPress={() => setOpen(false)} /></>}
    </>}
  </>;
}
