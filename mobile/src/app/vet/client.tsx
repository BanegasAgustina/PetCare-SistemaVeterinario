/**
 * ARCHIVO: client.tsx
 * UBICACIÓN: mobile/src/app/vet/client.tsx
 * FUNCIÓN: Detalle operativo de cliente en el módulo veterinario.
 * RESPONSABILIDAD: Reexporta ClientScreen desde la vista compartida de clientes.
 * CONEXIONES: Importa: mobile/src/components/clinic/ClientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → ClientsScreen → servicios clínicos y scope del backend.
 * IMPORTANCIA: Mantiene una ficha común con datos restringidos al profesional autorizado.
 */
/** Ficha del propietario limitada a pacientes que el veterinario puede consultar. */
export { ClientScreen as default } from '../../components/clinic/ClientsScreen';
