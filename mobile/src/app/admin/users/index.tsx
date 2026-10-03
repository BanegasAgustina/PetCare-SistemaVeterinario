import { useCallback,useState } from 'react';
import { router } from 'expo-router';
import { ScreenContainer } from '../../../components/layout/ScreenContainer';
import { AppText } from '../../../components/ui/AppText';
import { AppInput } from '../../../components/forms/AppInput';
import { AppButton } from '../../../components/ui/AppButton';
import { PetCareCard,QueryState } from '../../../components/client/PetCareUI';
import { useAdmin } from '../../../hooks/useAdmin';
import { useAuth } from '../../../hooks/useAuth';
import { useClientQuery } from '../../../hooks/useClientQuery';
export default function UsersScreen() {
  const api=useAdmin();const auth=useAuth();const [search,setSearch]=useState('');const [filter,setFilter]=useState('');const [page,setPage]=useState(1);
  const load=useCallback(()=>api.users(filter,page),[api,filter,page]);const query=useClientQuery(load);
  return <ScreenContainer><AppButton variant="secondary" label="Volver a Gestión" onPress={()=>router.replace('/admin')}/><AppText variant="title">Usuarios</AppText>
    <AppInput label="Buscar por nombre o email" value={search} onChangeText={setSearch}/><AppButton variant="secondary" label="Buscar" disabled={query.loading} onPress={()=>{setPage(1);setFilter(search.trim());}}/>
    {auth.hasPermission('roles.manage')&&<AppButton label="Crear usuario e invitar" onPress={()=>router.push('/admin/users/new')}/>}
    <QueryState {...query}/>{query.data&&<><AppText muted>{query.data.total} usuarios · Página {query.data.page}</AppText>
      {!query.data.items.length&&<AppText muted>No hay usuarios para esta consulta.</AppText>}
      {query.data.items.map(user=><PetCareCard key={user.id}><AppText variant="subtitle">{user.firstName} {user.lastName}</AppText><AppText>{user.email}</AppText><AppText muted>{user.roleName} · {user.isActive?'Activa':'Inactiva'}</AppText><AppButton variant="secondary" label="Ver / Editar" onPress={()=>router.push({pathname:'/admin/users/[id]',params:{id:user.id}})}/></PetCareCard>)}
      <AppButton variant="secondary" label="Página anterior" disabled={page===1||query.loading} onPress={()=>setPage(p=>p-1)}/><AppButton variant="secondary" label="Página siguiente" disabled={!query.data.hasMore||query.loading} onPress={()=>setPage(p=>p+1)}/>
    </>}</ScreenContainer>;
}
