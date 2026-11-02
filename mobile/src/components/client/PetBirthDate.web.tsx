/**
 * ARCHIVO: PetBirthDate.web.tsx
 * UBICACIÓN: mobile/src/components/client/PetBirthDate.web.tsx
 * FUNCIÓN: Adaptador web de fecha de nacimiento de mascota.
 * RESPONSABILIDAD: Ajustar selector de nacimiento a navegador y mantener formato de API.
 * CONEXIONES: Importa: mobile/src/components/forms/CalendarDateField.tsx, mobile/src/utils/clinic-date.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Usa la variante web del calendario y convierte el valor/limites al contrato compartido.
 * IMPORTANCIA: Expo selecciona esta implementación web para el mismo campo lógico.
 */
import { CalendarDateField } from '../forms/CalendarDateField';
import { clinicToday } from '../../utils/clinic-date';

/** Fecha de nacimiento opcional, en formato civil YYYY-MM-DD y sin fechas futuras. */
/** Adapta la selección web de fecha de nacimiento al contrato del formulario. */
export function PetBirthDate({ value, disabled, onChange }: { value: string; disabled: boolean; onChange: (value: string) => void }) {
  return <CalendarDateField label="Fecha de nacimiento" optional value={value} disabled={disabled} maxDate={clinicToday()} onChange={onChange} />;
}
