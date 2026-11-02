/**
 * ARCHIVO: client.tsx
 * UBICACIÓN: mobile/src/app/admin/client.tsx
 * FUNCIÓN: Ruta de ficha de cliente en el panel administrativo.
 * RESPONSABILIDAD: Reexporta ClientScreen desde la pantalla clínica compartida.
 * CONEXIONES: Importa: mobile/src/components/clinic/ClientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → ClientsScreen/ClientScreen → servicios de clínica; el backend determina alcance.
 * IMPORTANCIA: Ofrece detalle operativo sin duplicar la pantalla del módulo clínico.
 */
/** Ficha operativa de cliente para administradores autorizados; 
 * reutiliza el componente compartido. */
export { ClientScreen as default } from '../../components/clinic/ClientsScreen';
