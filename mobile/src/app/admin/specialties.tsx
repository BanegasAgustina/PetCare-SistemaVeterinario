/**
 * ARCHIVO: specialties.tsx
 * UBICACIÓN: mobile/src/app/admin/specialties.tsx
 * FUNCIÓN: Ruta de administración de especialidades.
 * RESPONSABILIDAD: Reexporta SpecialtiesScreen que lista y modifica el catálogo de especialidades.
 * CONEXIONES: Importa: mobile/src/components/admin/SpecialtiesScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → SpecialtiesScreen → useAdmin/useClinic y endpoints de catálogo.
 * IMPORTANCIA: Centraliza el catálogo reutilizado en perfiles y servicios profesionales.
 */
/**
 * Ruta de especialidades para ADMIN/SUPER_ADMIN con los permisos exigidos. Reutiliza el componente compartido exportado; este consulta /admin o /clinic según la operación. El layout presenta los accesos y backend aplica los permisos definitivos.
 */
export { default } from '../../components/admin/SpecialtiesScreen';
