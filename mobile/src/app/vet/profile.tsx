/**
 * ARCHIVO: profile.tsx
 * UBICACIÓN: mobile/src/app/vet/profile.tsx
 * FUNCIÓN: Ruta de perfil para cuentas veterinarias.
 * RESPONSABILIDAD: Mantiene accesible la vista de perfil compartida desde las rutas veterinarias existentes.
 * CONEXIONES: Importa: mobile/src/components/profile/AccountProfileScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Redirige a la pantalla de perfil común que resuelve la presentación según el rol.
 * IMPORTANCIA: Conserva los enlaces existentes al perfil sin duplicar lógica de cuenta.
 */
/** Compatibilidad para accesos existentes: usa el perfil compartido por todos los roles. */
import { AccountProfileScreen } from '../../components/profile/AccountProfileScreen';

// Reenvía la ruta veterinaria al perfil compartido por todos los roles.
export default function VeterinarianProfileRoute() {
  return <AccountProfileScreen />;
}
