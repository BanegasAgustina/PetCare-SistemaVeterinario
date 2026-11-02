/**
 * ARCHIVO: security.tsx
 * UBICACIÓN: mobile/src/app/client/profile/security.tsx
 * FUNCIÓN: Entrada a opciones de seguridad del perfil cliente.
 * RESPONSABILIDAD: Configura la pantalla compartida de perfil en la sección security.
 * CONEXIONES: Importa: mobile/src/components/profile/AccountProfileScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → AccountProfileScreen(section=security) → servicio auth/perfil.
 * IMPORTANCIA: Comparte cambio de contraseña y acciones de sesión con el perfil principal.
 */
import { AccountProfileScreen } from '../../../components/profile/AccountProfileScreen';

/** Renderiza el perfil compartido con la sección security seleccionada. */
export default function Security() {
  return <AccountProfileScreen section="security" />;
}
