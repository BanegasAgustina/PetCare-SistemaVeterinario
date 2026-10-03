import { router } from 'expo-router';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { useClientQuery } from '../../hooks/useClientQuery';
import { PetCareScreen,PetCareHeader,PetCareCard,PetCareAction,QueryState } from '../../components/client/PetCareUI';
export default function AdminHome(){const {user}=useAuth();const api=useAdmin();const query=useClientQuery(api.home);return <PetCareScreen><PetCareHeader title="Gestión PetCare" subtitle={user?.roleName}/><PetCareCard><AppText variant="subtitle">Hola, {user?.firstName}</AppText><AppText muted>Administrá la misma información que utiliza toda la clínica.</AppText></PetCareCard><QueryState {...query}/>{query.data?.modules.map(module=><PetCareAction key={module.code} title={module.name} icon="settings-outline" onPress={()=>router.push(module.path)}/>)}{query.data&&!query.data.modules.length&&<PetCareCard><AppText muted>Tu cuenta no tiene permisos para los módulos administrativos disponibles.</AppText></PetCareCard>}<AppButton label="Mi cuenta" variant="secondary" onPress={()=>router.push('/account')}/></PetCareScreen>;}
