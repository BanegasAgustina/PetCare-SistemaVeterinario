/**
 * ARCHIVO: specialties.tsx
 * UBICACIÓN: mobile/src/app/admin/veterinarians/specialties.tsx
 * FUNCIÓN: Ruta administrativa para el catálogo de especialidades veterinarias.
 * RESPONSABILIDAD: Reexporta la pantalla compartida de especialidades y deja la lógica de catálogo en ese componente.
 * CONEXIONES: Importa: mobile/src/components/admin/SpecialtiesScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router monta SpecialtiesScreen, que carga y modifica el catálogo según permisos.
 * IMPORTANCIA: Provee el acceso administrativo para mantener las especialidades vinculadas a profesionales.
 */
/**
 * Ruta de especialidades para ADMIN/SUPER_ADMIN con los permisos exigidos. Reutiliza el componente compartido exportado; este consulta /admin o /clinic según la operación. El layout presenta los accesos y backend aplica los permisos definitivos.
 */
export { default } from '../../../components/admin/SpecialtiesScreen';
