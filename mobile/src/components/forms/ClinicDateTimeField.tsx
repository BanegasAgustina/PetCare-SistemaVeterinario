// Este archivo se encarga de lo siguiente: Control de formulario reutilizable; captura o valida datos ingresados en la aplicación.

import { View } from 'react-native';
import { AppText } from '../ui/AppText';
import { CalendarDateField } from './CalendarDateField';
import { ClinicTimeField } from './ClinicTimeField';
import { clinicDate } from '../../utils/clinic-date';

// Tipo Props: define la forma o las opciones válidas de los datos usados por este módulo.
type Props = { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; optional?: boolean };
// Función parse: transforma o prepara datos dentro de este módulo.
function parse(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2})$/.exec(value.trim());
  return match ? { date: `${match[3]}-${match[2]}-${match[1]}`, time: match[4] } : { date: '', time: '' };
}

/** Selector conjunto fecha + hora; conserva el formato de fecha local esperado por clinicInstant. */
// Función ClinicDateTimeField: concentra la lógica dentro de este módulo.
export function ClinicDateTimeField({ label, value, onChange, disabled = false, optional = false }: Props) {
  const current = parse(value);
  // Función update: agrupa una operación que este módulo puede ejecutar o reutilizar.
const update = (date: string, time: string) => onChange(date && time ? `${clinicDate(date)} ${time}` : '');
  return <View style={{ gap: 10 }}>
    <CalendarDateField label={`${label} · fecha`} value={current.date} optional={optional} disabled={disabled} onChange={date => update(date, current.time || '09:00')} />
    <ClinicTimeField label={`${label} · hora`} value={current.time} disabled={disabled || !current.date} onChange={time => update(current.date, time)} />
    {!current.date && <AppText variant="caption" muted>Elegí primero una fecha.</AppText>}
  </View>;
}
