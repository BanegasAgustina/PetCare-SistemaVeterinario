/**
 * ARCHIVO: [kind].tsx
 * UBICACIÓN: mobile/src/app/admin/catalog/[kind].tsx
 * FUNCIÓN: Ruta dinámica de catálogo administrativo seleccionada por el parámetro kind.
 * RESPONSABILIDAD: Reexporta CatalogScreen que resuelve la entidad solicitada y conecta el formulario/listado.
 * CONEXIONES: Importa: mobile/src/components/clinic/CatalogScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router aporta kind → CatalogScreen → hook/API administrativo o clínico según catálogo.
 * IMPORTANCIA: Permite compartir el editor de catálogos y conservar una ruta declarativa.
 */
/**
 * Ruta de navegación del módulo para ADMIN/SUPER_ADMIN con los permisos exigidos. Reutiliza el componente compartido exportado; este consulta /admin o /clinic según la operación. El layout presenta los accesos y backend aplica los permisos definitivos.
 */
export { CatalogScreen as default } from '../../../components/clinic/CatalogScreen';
