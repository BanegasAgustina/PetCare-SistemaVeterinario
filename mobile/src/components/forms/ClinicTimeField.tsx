/**
 * ARCHIVO: ClinicTimeField.tsx
 * UBICACIÓN: mobile/src/components/forms/ClinicTimeField.tsx
 * FUNCIÓN: Selector de hora nativo con valores de reloj y confirmación.
 * RESPONSABILIDAD: Elegir una hora de clínica en Android/iOS.
 * CONEXIONES: Importa: mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/forms/ClinicDateTimeField.tsx
 * FUNCIONAMIENTO: Convierte HH:mm a Date para el selector y vuelve a formatear el resultado como HH:mm al cambiar.
 * IMPORTANCIA: Adapta el selector nativo al contrato de texto simple usado por formularios de clínica.
 */
import { useState } from 'react';
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';
import { useTheme } from '../../hooks/useTheme';

// Tipo Props: define la forma o las opciones válidas de los datos usados por este módulo.
type Props = { label: string; value: string; onChange: (value: string) => void; disabled?: boolean };
// Convierte HH:mm en una fecha local para alimentar el selector nativo.
function timeDate(value: string) { const date = new Date(); const [hours, minutes] = (value || '09:00').split(':').map(Number); date.setHours(hours || 0, minutes || 0, 0, 0); return date; }
// Devuelve la hora local como HH:mm, formato usado por el formulario.
function timeText(date: Date) { return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; }

/** Selector de hora del sistema en iOS/Android. */
/** Adapta el selector nativo de reloj al callback string del dominio. */
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
