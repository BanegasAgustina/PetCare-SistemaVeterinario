/**
 * ARCHIVO: products.tsx
 * UBICACIÓN: mobile/src/app/vet/products.tsx
 * FUNCIÓN: Consulta de productos en el espacio veterinario.
 * RESPONSABILIDAD: Reexporta ClinicProductsScreen para personal veterinario.
 * CONEXIONES: Importa: mobile/src/components/clinic/ClinicProductsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → ClinicProductsScreen → catálogo/API según permisos.
 * IMPORTANCIA: Permite consultar el catálogo dentro del espacio clínico.
 */
export { ClinicProductsScreen as default } from '../../components/clinic/ClinicProductsScreen';
