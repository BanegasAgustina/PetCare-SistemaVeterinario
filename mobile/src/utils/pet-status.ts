/**
 * ARCHIVO: pet-status.ts
 * UBICACIÓN: mobile/src/utils/pet-status.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de pet-status.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/client/(tabs)/pets.tsx, mobile/src/app/client/appointments/request.tsx, mobile/src/app/client/pets/[id]/index.tsx, mobile/src/components/client/RecordCards.tsx, mobile/src/components/clinic/PatientDetailScreen.tsx, mobile/src/components/clinic/PatientListCard.tsx, mobile/src/components/clinic/PatientsScreen.tsx
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Unifica boolean, 0/1 y etiquetas históricas; devuelve null para valores que no puede interpretar. */
// Tipo PetActiveValue: define la forma o las opciones válidas de los datos usados por este módulo.
export type PetActiveValue = boolean | number | string | null | undefined;

export function normalizePetActiveFlag(value: PetActiveValue): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'active', 'activo'].includes(normalized)) return true;
    if (['0', 'false', 'inactive', 'inactivo'].includes(normalized)) return false;
  }
  return null;
}

/** Convierte el valor normalizado en estado de insignia ACTIVE, INACTIVE o UNKNOWN. */
export function petStatusBadge(value: PetActiveValue): 'ACTIVE' | 'INACTIVE' | 'UNKNOWN' {
  const active = normalizePetActiveFlag(value);
  return active === null ? 'UNKNOWN' : active ? 'ACTIVE' : 'INACTIVE';
}
