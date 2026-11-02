/**
 * ARCHIVO: ClinicDateTimeField.tsx
 * UBICACIÓN: mobile/src/components/forms/ClinicDateTimeField.tsx
 * FUNCIÓN: Selector compuesto de fecha y horario de agenda clínica.
 * RESPONSABILIDAD: Editar fecha y hora de atención con campos adaptables al dispositivo.
 * CONEXIONES: Importa: mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/CalendarDateField.tsx, mobile/src/components/forms/ClinicTimeField.tsx, mobile/src/utils/clinic-date.ts Se utiliza desde: mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/clinic/PatientsScreen.tsx
 * FUNCIONAMIENTO: Interpreta y recompone el valor de fecha/hora y comunica cambios mediante callbacks de fecha y hora.
 * IMPORTANCIA: Centraliza la entrada de temporalidad usada en programación de servicios clínicos.
 */
import { View } from 'react-native';
import { AppText } from '../ui/AppText';
import { CalendarDateField } from './CalendarDateField';
import { ClinicTimeField } from './ClinicTimeField';
import { clinicDate } from '../../utils/clinic-date';

// Tipo Props: define la forma o las opciones válidas de los datos usados por este módulo.
type Props = { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; optional?: boolean };
/** Divide el valor combinado en la fecha y hora que necesitan los campos hijos. */
function parse(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2})$/.exec(value.trim());
  return match ? { date: `${match[3]}-${match[2]}-${match[1]}`, time: match[4] } : { date: '', time: '' };
}

/** Selector conjunto fecha + hora; conserva el formato de fecha local esperado por clinicInstant. */
/** Combina los dos campos y devuelve un valor único al formulario que administra el turno. */
export function ClinicDateTimeField({ label, value, onChange, disabled = false, optional = false }: Props) {
  const current = parse(value);
  /** Recompone fecha/hora preservando la otra mitad del valor actual. */
const update = (date: string, time: string) => onChange(date && time ? `${clinicDate(date)} ${time}` : '');
  return <View style={{ gap: 10 }}>
    <CalendarDateField label={`${label} · fecha`} value={current.date} optional={optional} disabled={disabled} onChange={date => update(date, current.time || '09:00')} />
    <ClinicTimeField label={`${label} · hora`} value={current.time} disabled={disabled || !current.date} onChange={time => update(current.date, time)} />
    {!current.date && <AppText variant="caption" muted>Elegí primero una fecha.</AppText>}
  </View>;
}
