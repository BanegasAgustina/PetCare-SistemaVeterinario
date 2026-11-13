/**
 * ARCHIVO: catalog-presentation.ts
 * UBICACIÓN: backend/src/utils/catalog-presentation.ts
 * FUNCIÓN: Traduce códigos y etiquetas de permisos, roles y catálogos a nombres legibles.
 * RESPONSABILIDAD: Presentar textos estables aunque la base contenga códigos o nombres heredados.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/admin.repository.ts, backend/src/repositories/authorization.repository.ts, backend/src/repositories/clinic-admin.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/user.repository.ts, backend/src/repositories/veterinarian.repository.ts, backend/src/routes/veterinarian.routes.ts
 * FUNCIONAMIENTO: Usa mapas de etiquetas y fallback al valor almacenado cuando no existe traducción conocida.
 * IMPORTANCIA: Hace más comprensible el catálogo que consume administración y clínica.
 */
/** Presentación en español de etiquetas de permisos heredadas del catálogo persistido. */
// Nombres en español para códigos de permiso conocidos.
const permissionNames: Record<string, string> = {
  'medical_records.view': 'Ver historial médico',
  'medical_records.diagnose': 'Registrar diagnóstico',
  'pets.update': 'Crear y actualizar pacientes',
  'pets.view_information': 'Ver información de mascotas',
  'users.update_client': 'Editar información del cliente',
  'categories.manage': 'Gestionar categorías',
  'appointments.update_own': 'Gestionar mis turnos',
  'recommendations.create': 'Recomendar productos a pacientes',
};

// Descripciones breves para permisos que ve el administrador.
const permissionDescriptions: Record<string, string> = {
  'products.view': 'Catálogo de productos',
  'products.update': 'Edición de productos',
  'pets.update': 'Crear pacientes, editar su información y cambiar su estado clínico',
  'products.update_price': 'Edición de precios',
  'products.update_stock': 'Edición de stock',
  'users.manage': 'Administración crítica',
  'specialties.manage': 'Catálogo de especialidades',
  'services.manage': 'Configurar servicios ofrecidos por la clínica',
  'products.create': 'Dar de alta productos del catálogo',
  'categories.manage': 'Administrar categorías de tienda',
  'appointments.update_own': 'Aceptar o rechazar solicitudes y actualizar el estado de los turnos asignados a este profesional',
  'recommendations.create': 'Crear recomendaciones de productos para pacientes autorizados',
};

// Etiquetas traducidas para módulos del panel.
const moduleNames: Record<string, string> = {
  medical_records: 'Historial clínico',
  clinic: 'Operación de la clínica',
  administration: 'Administración',
  personal: 'Funciones personales',
};

// Nombres visibles de roles estándar.
const roleNames: Record<string, string> = {
  GROOMER: 'Peluquería',
  SECRETARY: 'Secretaría',
};

// Correcciones exactas para filas dañadas ya persistidas; no se recodifica texto arbitrario.
// Compatibilidad de nombres guardados en catálogos antiguos.
const legacyCatalogNames: Record<string, string> = {
  'Peluquer\u00c3\u0192\u00c2\u00ada': 'Peluquería',
  'Dermatolog\u00c3\u0192\u00c2\u00ada': 'Dermatología',
  'Cardiolog\u00c3\u0192\u00c2\u00ada': 'Cardiología',
  'Nutrici\u00c3\u0192\u00c2\u00b3n': 'Nutrición',
  'Cirug\u00c3\u0192\u00c2\u00ada': 'Cirugía',
};

// Resuelve etiqueta legible para el código de permiso.
export function permissionName(code: string, storedName: string): string {
  return permissionNames[code] ?? storedName;
}

// Usa descripción conocida y deja fallback al texto guardado.
export function permissionDescription(code: string, storedDescription: string): string {
  return permissionDescriptions[code] ?? storedDescription;
}

// Presenta el grupo funcional del permiso.
export function permissionModuleName(code: string, storedName: string): string {
  return moduleNames[code] ?? storedName;
}

// Traduce códigos de rol y conserva nombres personalizados.
export function roleName(code: string, storedName: string): string {
  return roleNames[code] ?? (code === 'SUPER_ADMIN' ? 'Admin Principal' : storedName);
}

// Normaliza nombres heredados de catálogo para presentarlos en UI.
export function catalogName(storedName: string): string {
  return legacyCatalogNames[storedName] ?? storedName;
}
