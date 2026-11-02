/**
 * ARCHIVO: profile.tsx
 * UBICACIÓN: mobile/src/app/client/(tabs)/profile.tsx
 * FUNCIÓN: Pantalla o ruta de la aplicación.
 * RESPONSABILIDAD: Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de profile.
 * CONEXIONES: Importa: mobile/src/components/profile/AccountProfileScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
import { AccountProfileScreen } from '../../../components/profile/AccountProfileScreen';

// Función ProfileScreen: concentra la lógica dentro de este módulo.
export default function ProfileScreen() {
  return <AccountProfileScreen />;
}
