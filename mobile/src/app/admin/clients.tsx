/**
 * ARCHIVO: clients.tsx
 * UBICACIÓN: mobile/src/app/admin/clients.tsx
 * FUNCIÓN: Ruta de listado de clientes para administración.
 * RESPONSABILIDAD: Reexporta ClientsScreen en modo listado desde la pantalla de clínica compartida.
 * CONEXIONES: Importa: mobile/src/components/clinic/ClientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → ClientsScreen → servicio de clínica y APIs protegidas.
 * IMPORTANCIA: Comparte listado y detalle operativo entre áreas con autorización de backend.
 */
/** Listado operativo de clientes para administradores autorizados; 
 * reutiliza el componente compartido. */
export { ClientsScreen as default } from '../../components/clinic/ClientsScreen';
