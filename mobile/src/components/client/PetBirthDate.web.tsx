// Este archivo se encarga de lo siguiente: Componente reutilizable del área de clientes; presenta información y acciones para sus mascotas, turnos o compras.

import { CalendarDateField } from '../forms/CalendarDateField';
import { clinicToday } from '../../utils/clinic-date';

/** Fecha de nacimiento opcional, en formato civil YYYY-MM-DD y sin fechas futuras. */
// Función PetBirthDate: concentra la lógica dentro de este módulo.
export function PetBirthDate({ value, disabled, onChange }: { value: string; disabled: boolean; onChange: (value: string) => void }) {
  return <CalendarDateField label="Fecha de nacimiento" optional value={value} disabled={disabled} maxDate={clinicToday()} onChange={onChange} />;
}
