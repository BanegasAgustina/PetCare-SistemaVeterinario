import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { AppText } from '../components/ui/AppText';
import { PetCareCard,PetCareHeader } from '../components/client/PetCareUI';
import { useAuth } from '../hooks/useAuth';
import { modulesForCapabilities } from '../utils/capability-modules';

export default function WorkspaceHome(){
  const {user}=useAuth();
  const modules=modulesForCapabilities(user?.permissions);
  return <ScreenContainer wide>
    <PetCareHeader title={user?.roleName??'Mi espacio'} subtitle="Accedé a los módulos habilitados para tu rol."/>
    {modules.length?modules.map(module=><Pressable key={module.path} accessibilityRole="button" onPress={()=>router.push(module.path as never)}><PetCareCard><View style={{gap:4}}><AppText variant="subtitle">{module.name}</AppText><AppText muted>Abrir módulo</AppText></View></PetCareCard></Pressable>):<PetCareCard><AppText variant="subtitle">No hay módulos asignados</AppText><AppText muted>Pedile al administrador principal que asigne permisos a tu rol.</AppText></PetCareCard>}
  </ScreenContainer>;
}
