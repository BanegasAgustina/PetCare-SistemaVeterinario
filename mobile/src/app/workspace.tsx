/**
 * ARCHIVO: workspace.tsx
 * UBICACIÓN: mobile/src/app/workspace.tsx
 * FUNCIÓN: Inicio del espacio de trabajo basado en capacidades/permisos del usuario.
 * RESPONSABILIDAD: Lee usuario autenticado, calcula módulos visibles y muestra accesos rápidos o un mensaje cuando no hay permisos asignados.
 * CONEXIONES: Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/hooks/useAuth.ts, mobile/src/utils/capability-modules.ts, mobile/src/components/layout/RoleQuickAccess.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: AuthContext → modulesForCapabilities y RoleQuickAccess → rutas disponibles para el rol.
 * IMPORTANCIA: Presenta navegación contextual; los permisos de backend siguen protegiendo cada operación.
 */
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { AppText } from '../components/ui/AppText';
import { PetCareCard,PetCareHeader } from '../components/client/PetCareUI';
import { useAuth } from '../hooks/useAuth';
import { modulesForCapabilities } from '../utils/capability-modules';
import { RoleQuickAccess } from '../components/layout/RoleQuickAccess';

/** Construye el panel de accesos desde los permisos efectivos disponibles en el usuario. */
export default function WorkspaceHome(){
  const {user}=useAuth();
  const modules=modulesForCapabilities(user?.permissions);
  return <ScreenContainer wide>
    <PetCareHeader title={user?.roleName??'Mi espacio'} subtitle="Accedé a los módulos habilitados para tu rol."/>
    {modules.length?<RoleQuickAccess/>:<PetCareCard><AppText variant="subtitle">No hay módulos asignados</AppText><AppText muted>Pedile al administrador principal que asigne permisos a tu rol.</AppText></PetCareCard>}
  </ScreenContainer>;
}
