/**
 * ARCHIVO: clients.tsx
 * UBICACIÓN: mobile/src/app/vet/clients.tsx
 * FUNCIÓN: Listado de clientes en el módulo veterinario.
 * RESPONSABILIDAD: Reexporta ClientsScreen para la ruta de lista.
 * CONEXIONES: Importa: mobile/src/components/clinic/ClientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → ClientsScreen → servicio/API clínica.
 * IMPORTANCIA: Evita duplicar búsquedas y presentación entre los grupos profesional y veterinario.
 */
/** Lista de propietarios vinculados a los pacientes autorizados del veterinario. */
export { ClientsScreen as default } from '../../components/clinic/ClientsScreen';
