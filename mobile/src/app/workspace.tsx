import { ScreenContainer } from '../components/layout/ScreenContainer';
import { AppText } from '../components/ui/AppText';
import { PetCareCard,PetCareHeader } from '../components/client/PetCareUI';
import { useAuth } from '../hooks/useAuth';
import { modulesForCapabilities } from '../utils/capability-modules';
import { RoleQuickAccess } from '../components/layout/RoleQuickAccess';

export default function WorkspaceHome(){
  const {user}=useAuth();
  const modules=modulesForCapabilities(user?.permissions);
  return <ScreenContainer wide>
    <PetCareHeader title={user?.roleName??'Mi espacio'} subtitle="Accedé a los módulos habilitados para tu rol."/>
    {modules.length?<RoleQuickAccess/>:<PetCareCard><AppText variant="subtitle">No hay módulos asignados</AppText><AppText muted>Pedile al administrador principal que asigne permisos a tu rol.</AppText></PetCareCard>}
  </ScreenContainer>;
}
