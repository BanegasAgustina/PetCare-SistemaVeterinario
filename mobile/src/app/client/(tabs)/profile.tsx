/**
 * ARCHIVO: profile.tsx
 * UBICACIÓN: mobile/src/app/client/(tabs)/profile.tsx
 * FUNCIÓN: Pestaña de perfil de la cuenta cliente.
 * RESPONSABILIDAD: Presenta los datos personales y accesos de cuenta disponibles para el cliente.
 * CONEXIONES: Importa: mobile/src/components/profile/AccountProfileScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Reutiliza la vista de perfil compartida con el resto de roles.
 * IMPORTANCIA: Mantiene una ruta de perfil coherente dentro de la navegación del cliente.
 */
import { AccountProfileScreen } from '../../../components/profile/AccountProfileScreen';

// Presenta el perfil compartido en la pestaña de cuenta del cliente.
export default function ProfileScreen() {
  return <AccountProfileScreen />;
}
