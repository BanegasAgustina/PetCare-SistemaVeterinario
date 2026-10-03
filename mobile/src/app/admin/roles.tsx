import { useState } from 'react';
import { router } from 'expo-router';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppText } from '../../components/ui/AppText';
import { AppInput } from '../../components/forms/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { SelectionRow } from '../../components/ui/SelectionRow';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { QueryState,PetCareCard } from '../../components/client/PetCareUI';
import { useAdmin } from '../../hooks/useAdmin';
import { useAuth } from '../../hooks/useAuth';
import { useClientQuery } from '../../hooks/useClientQuery';
import { useFeedback } from '../../contexts/FeedbackContext';
import type { AdminRole } from '../../types/admin';
export default function RolesScreen() {
  const api=useAdmin();const auth=useAuth();const query=useClientQuery(api.catalog);const {showToast}=useFeedback();
  const [role,setRole]=useState<AdminRole|null>(null);const [name,setName]=useState('');const [codes,setCodes]=useState<string[]>([]);const [error,setError]=useState<string>();const [confirm,setConfirm]=useState(false);
  const editable=auth.hasPermission('permissions.manage')&&Boolean(role)&&(role?.code!=='SUPER_ADMIN'||auth.hasRole('SUPER_ADMIN'));
  return <ScreenContainer><AppButton variant="secondary" label="Volver a Gestión" onPress={()=>router.replace('/admin')}/><AppText variant="title">Roles</AppText><QueryState {...query}/>
    {query.data&&<>{query.data.roles.map(item=><SelectionRow radio key={item.id} label={item.name} checked={role?.id===item.id} onPress={()=>{setRole(item);setName(item.name);setCodes(item.permissions);setError(undefined);}}/>)}
      {role&&<PetCareCard><AppInput label="Nombre del rol" value={name} maxLength={60} editable={editable} error={error} onChangeText={v=>{setName(v);setError(undefined);}}/><AppText muted>Código estable: {role.code}. Los grants afectan a todas las cuentas que heredan este rol.</AppText>
        {query.data.permissions.map(permission=><SelectionRow key={permission.code} label={permission.name} hint={permission.description} checked={codes.includes(permission.code)} disabled={!editable||!permission.canDelegate||(permission.critical&&!['ADMIN','SUPER_ADMIN'].includes(role.code))} onPress={()=>setCodes(v=>v.includes(permission.code)?v.filter(c=>c!==permission.code):[...v,permission.code])}/>)}
        {editable&&<AppButton label="Revisar y guardar rol" onPress={()=>{if(!name.trim()){setError('Ingresá el nombre del rol.');return;}setConfirm(true);}}/>}
      </PetCareCard>}
    </>}
    <ConfirmModal visible={confirm} title="Actualizar rol y permisos" message="Los grants se guardarán en MySQL y cambiarán los accesos de todos los usuarios de este rol. Los overrides individuales se conservarán." onCancel={()=>setConfirm(false)} onConfirm={async()=>{if(!role)return;await api.updateRole(role.id,name,codes);setConfirm(false);setRole(null);query.reload();await auth.refreshProfile();showToast('Rol actualizado','success');}}/>
  </ScreenContainer>;
}
