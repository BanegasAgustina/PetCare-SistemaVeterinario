/** Sorting rules for administrative appointment lists. Status values match clinic-rules transitions. */
export type AdminAppointmentSort = 'priority' | 'date_asc' | 'date_desc';

const statusPriority: Record<string, number> = { REQUESTED: 0, CONFIRMED: 1, IN_PROGRESS: 2, COMPLETED: 3, CANCELLED: 4, REJECTED: 5 };
type AppointmentOrderFields = { id: string | number; status: string; startsAt: string | Date };
function timestamp(value: string | Date): number { return value instanceof Date ? value.getTime() : new Date(value).getTime(); }

/** Open work is nearest first; closed work is most recent first. */
export function compareAdminAppointments<T extends AppointmentOrderFields>(sort: AdminAppointmentSort, left: T, right: T): number {
  if (sort === 'priority') {
    const priorityDifference = (statusPriority[left.status] ?? Number.MAX_SAFE_INTEGER) - (statusPriority[right.status] ?? Number.MAX_SAFE_INTEGER);
    if (priorityDifference) return priorityDifference;
  }
  const leftTime = timestamp(left.startsAt); const rightTime = timestamp(right.startsAt);
  const closed = (status: string) => ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(status);
  const direction = sort === 'date_desc' || (sort === 'priority' && closed(left.status) && closed(right.status)) ? -1 : 1;
  const dateDifference = (leftTime - rightTime) * direction;
  return dateDifference || String(left.id).localeCompare(String(right.id));
}

/** SQL equivalent, applied before LIMIT/OFFSET in the administrative repository. */
export function adminAppointmentOrderSql(sort: AdminAppointmentSort): string {
  if (sort === 'date_asc') return 's.starts_at ASC,a.id ASC';
  if (sort === 'date_desc') return 's.starts_at DESC,a.id ASC';
  return `CASE a.status WHEN 'REQUESTED' THEN 0 WHEN 'CONFIRMED' THEN 1 WHEN 'IN_PROGRESS' THEN 2 WHEN 'COMPLETED' THEN 3 WHEN 'CANCELLED' THEN 4 WHEN 'REJECTED' THEN 5 ELSE 6 END ASC,CASE WHEN a.status IN ('COMPLETED','CANCELLED','REJECTED') THEN s.starts_at END DESC,CASE WHEN a.status NOT IN ('COMPLETED','CANCELLED','REJECTED') THEN s.starts_at END ASC,a.id ASC`;
}
