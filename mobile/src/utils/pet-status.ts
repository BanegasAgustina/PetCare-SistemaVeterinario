/** Canonical interpretation for pet.isActive values crossing older API/database serializers. */
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

export function petStatusBadge(value: PetActiveValue): 'ACTIVE' | 'INACTIVE' | 'UNKNOWN' {
  const active = normalizePetActiveFlag(value);
  return active === null ? 'UNKNOWN' : active ? 'ACTIVE' : 'INACTIVE';
}
