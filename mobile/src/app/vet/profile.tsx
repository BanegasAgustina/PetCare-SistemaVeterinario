// Este archivo se encarga de lo siguiente: Pantalla o navegación del área profesional; reúne las tareas clínicas disponibles para el personal veterinario.

/** Compatibilidad para accesos existentes: usa el perfil compartido por todos los roles. */
import { AccountProfileScreen } from '../../components/profile/AccountProfileScreen';

// Función VeterinarianProfileRoute: concentra la lógica dentro de este módulo.
export default function VeterinarianProfileRoute() {
  return <AccountProfileScreen />;
}
