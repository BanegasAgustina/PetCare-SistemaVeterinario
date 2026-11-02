/**
 * ARCHIVO: edit.tsx
 * UBICACIÓN: mobile/src/app/client/profile/edit.tsx
 * FUNCIÓN: Entrada de edición de datos personales del cliente.
 * RESPONSABILIDAD: Configura la pantalla compartida de perfil en la sección personal.
 * CONEXIONES: Importa: mobile/src/components/profile/AccountProfileScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → AccountProfileScreen(section=personal) → servicio/contexto de cliente.
 * IMPORTANCIA: Reutiliza validación y guardado del perfil en lugar de duplicar su formulario.
 */
import { AccountProfileScreen } from '../../../components/profile/AccountProfileScreen';

/** Renderiza el perfil compartido con la sección personal seleccionada. */
export default function ProfileEdit() {
  return <AccountProfileScreen section="personal" />;
}
