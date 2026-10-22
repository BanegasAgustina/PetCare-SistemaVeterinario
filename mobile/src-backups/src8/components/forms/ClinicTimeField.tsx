import { useState } from 'react';
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';
import { useTheme } from '../../hooks/useTheme';

type Props = { label: string; value: string; onChange: (value: string) => void; disabled?: boolean };
function timeDate(value: string) { const date = new Date(); const [hours, minutes] = (value || '09:00').split(':').map(Number); date.setHours(hours || 0, minutes || 0, 0, 0); return date; }
function timeText(date: Date) { return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; }

/** Selector de hora del sistema en iOS/Android. */
export function ClinicTimeField({ label, value, onChange, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => timeDate(value));
  const { mode, colors } = useTheme();
  return <>
    <AppText>{label}</AppText>
    <AppButton variant="secondary" label={`${value || 'Elegir hora'}  ◷`} disabled={disabled} onPress={() => { setDraft(timeDate(value)); setOpen(true); }} />
    {open && <>
      <DateTimePicker value={draft} mode="time" display={Platform.OS === 'android' ? 'clock' : 'spinner'} locale="es-AR" themeVariant={mode} textColor={colors.text}
        onDismiss={() => setOpen(false)} onValueChange={(_event, date) => { if (!date) return; setDraft(date); if (Platform.OS === 'android') { onChange(timeText(date)); setOpen(false); } }} />
      {Platform.OS === 'ios' && <><AppButton compact label="Usar hora" onPress={() => { onChange(timeText(draft)); setOpen(false); }} /><AppButton compact variant="secondary" label="Cancelar" onPress={() => setOpen(false)} /></>}
    </>}
  </>;
}
