/**
 * ARCHIVO: appointment-order.ts
 * UBICACIÓN: backend/src/utils/appointment-order.ts
 * FUNCIÓN: Comparadores y expresiones SQL para ordenar la agenda administrativa.
 * RESPONSABILIDAD: Mantener el mismo orden por prioridad de estado/fecha tanto en memoria como en consultas SQL.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/clinic.repository.ts
 * FUNCIONAMIENTO: Convierte fecha a timestamp y selecciona comparación o fragmento SQL según tipo de orden.
 * IMPORTANCIA: Evita discrepancias al listar turnos con filtros equivalentes.
 */
/** Opciones de ordenación que acepta el listado administrativo de turnos. */
export type AdminAppointmentSort = 'priority' | 'date_asc' | 'date_desc';

/** Orden relativo de estados abiertos y cerrados usado en el modo priority. */
const statusPriority: Record<string, number> = { REQUESTED: 0, CONFIRMED: 1, IN_PROGRESS: 2, COMPLETED: 3, CANCELLED: 4, REJECTED: 5 };
/** Campos mínimos del comparador además de las propiedades de cada entidad. */
type AppointmentOrderFields = { id: string | number; status: string; startsAt: string | Date };
/** Normaliza fechas texto y Date a milisegundos para comparar. */
function timestamp(value: string | Date): number { return value instanceof Date ? value.getTime() : new Date(value).getTime(); }

/** Compara por prioridad/fecha e ID estable para que el orden sea determinista. */
export function compareAdminAppointments<T extends AppointmentOrderFields>(sort: AdminAppointmentSort, left: T, right: T): number {
  if (sort === 'priority') {
    const priorityDifference = (statusPriority[left.status] ?? Number.MAX_SAFE_INTEGER) - (statusPriority[right.status] ?? Number.MAX_SAFE_INTEGER);
    if (priorityDifference) return priorityDifference;
  }
  const leftTime = timestamp(left.startsAt); const rightTime = timestamp(right.startsAt);
  /** Indica si el estado del turno ya es terminal y no admite cambios de ciclo de vida. */
  const closed = (status: string) => ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(status);
  const direction = sort === 'date_desc' || (sort === 'priority' && closed(left.status) && closed(right.status)) ? -1 : 1;
  const dateDifference = (leftTime - rightTime) * direction;
  return dateDifference || String(left.id).localeCompare(String(right.id));
}

/** Devuelve el ORDER BY equivalente para aplicarlo antes de LIMIT/OFFSET. */
export function adminAppointmentOrderSql(sort: AdminAppointmentSort): string {
  if (sort === 'date_asc') return 's.starts_at ASC,a.id ASC';
  if (sort === 'date_desc') return 's.starts_at DESC,a.id ASC';
  return `CASE a.status WHEN 'REQUESTED' THEN 0 WHEN 'CONFIRMED' THEN 1 WHEN 'IN_PROGRESS' THEN 2 WHEN 'COMPLETED' THEN 3 WHEN 'CANCELLED' THEN 4 WHEN 'REJECTED' THEN 5 ELSE 6 END ASC,CASE WHEN a.status IN ('COMPLETED','CANCELLED','REJECTED') THEN s.starts_at END DESC,CASE WHEN a.status NOT IN ('COMPLETED','CANCELLED','REJECTED') THEN s.starts_at END ASC,a.id ASC`;
}
