/**
 * ARCHIVO: VeterinarianProfileScreen.tsx
 * UBICACIÓN: mobile/src/components/clinic/VeterinarianProfileScreen.tsx
 * FUNCIÓN: Adaptador de ruta al perfil profesional del veterinario.
 * RESPONSABILIDAD: Reutilizar edición de perfil con la sección apropiada para veterinarios.
 * CONEXIONES: Importa: mobile/src/components/profile/AccountProfileScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Renderiza AccountProfileScreen en la configuración de sección personal.
 * IMPORTANCIA: Evita duplicar formulario y reglas de perfil profesional.
 */
import { AccountProfileScreen } from '../../components/profile/AccountProfileScreen';

/** Reutiliza el perfil compartido con la sección personal activa. */
export default function VeterinarianProfileScreen() {
  return <AccountProfileScreen />;
}
