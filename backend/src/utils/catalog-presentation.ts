/** Presentación en español de etiquetas de permisos heredadas del catálogo persistido. */
const permissionNames: Record<string, string> = {
  'medical_records.view': 'Ver historial médico',
  'medical_records.diagnose': 'Registrar diagnóstico',
  'pets.view_information': 'Ver información de mascotas',
  'users.update_client': 'Editar información del cliente',
  'categories.manage': 'Gestionar categorías',
};

const permissionDescriptions: Record<string, string> = {
  'products.view': 'Catálogo de productos',
  'products.update': 'Edición de productos',
  'products.update_price': 'Edición de precios',
  'products.update_stock': 'Edición de stock',
  'users.manage': 'Administración crítica',
  'specialties.manage': 'Catálogo de especialidades',
  'services.manage': 'Configurar servicios ofrecidos por la clínica',
  'products.create': 'Dar de alta productos del catálogo',
  'categories.manage': 'Administrar categorías de tienda',
};

const moduleNames: Record<string, string> = {
  medical_records: 'Historial clínico',
  clinic: 'Operación de la clínica',
  administration: 'Administración',
};

const roleNames: Record<string, string> = {
  GROOMER: 'Peluquería',
  SECRETARY: 'Secretaría',
};

// Correcciones exactas para filas dañadas ya persistidas; no se recodifica texto arbitrario.
const legacyCatalogNames: Record<string, string> = {
  'Peluquer\u00c3\u0192\u00c2\u00ada': 'Peluquería',
  'Dermatolog\u00c3\u0192\u00c2\u00ada': 'Dermatología',
  'Cardiolog\u00c3\u0192\u00c2\u00ada': 'Cardiología',
  'Nutrici\u00c3\u0192\u00c2\u00b3n': 'Nutrición',
  'Cirug\u00c3\u0192\u00c2\u00ada': 'Cirugía',
};

export function permissionName(code: string, storedName: string): string {
  return permissionNames[code] ?? storedName;
}

export function permissionDescription(code: string, storedDescription: string): string {
  return permissionDescriptions[code] ?? storedDescription;
}

export function permissionModuleName(code: string, storedName: string): string {
  return moduleNames[code] ?? storedName;
}

export function roleName(code: string, storedName: string): string {
  return roleNames[code] ?? storedName;
}

export function catalogName(storedName: string): string {
  return legacyCatalogNames[storedName] ?? storedName;
}
