/**
 * ARCHIVO: PetBirthDate.tsx
 * UBICACIÓN: mobile/src/components/client/PetBirthDate.tsx
 * FUNCIÓN: Adaptador nativo de fecha de nacimiento de mascota.
 * RESPONSABILIDAD: Aplicar límites de fecha adecuados a una fecha de nacimiento y usar selector compartido.
 * CONEXIONES: Importa: mobile/src/components/forms/CalendarDateField.tsx, mobile/src/utils/clinic-date.ts Se utiliza desde: mobile/src/components/client/PetEditor.tsx
 * FUNCIONAMIENTO: Compone CalendarDateField y conversión de fecha de clínica con el mismo contrato para plataformas.
 * IMPORTANCIA: Evita que formularios distintos interpreten fechas de nacimiento de forma divergente.
 */
import { CalendarDateField } from '../forms/CalendarDateField';
import { clinicToday } from '../../utils/clinic-date';

/** Fecha de nacimiento opcional, en formato civil YYYY-MM-DD y sin fechas futuras. */
/** Adapta el selector de calendario a fechas válidas de nacimiento. */
export function PetBirthDate({ value, disabled, onChange }: { value: string; disabled: boolean; onChange: (value: string) => void }) {
  return <CalendarDateField label="Fecha de nacimiento" optional value={value} disabled={disabled} maxDate={clinicToday()} onChange={onChange} />;
}
