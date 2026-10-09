/**
 * Pantalla de usuarios para ADMIN/SUPER_ADMIN con los permisos exigidos.
 * Usa los hooks y servicios autenticados de su módulo (/admin o /clinic según la operación);
 *  no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { useCallback,useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '../../../components/layout/ScreenContainer';
import { AppText } from '../../../components/ui/AppText';
import { AppInput } from '../../../components/forms/AppInput';
import { AppButton } from '../../../components/ui/AppButton';
import { PetCareCard,QueryState } from '../../../components/client/PetCareUI';
import { useAdmin } from '../../../hooks/useAdmin';
import { useAuth } from '../../../hooks/useAuth';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { roleLabel } from '../../../utils/role-label';
import { FilterDisclosure } from '../../../components/ui/FilterDisclosure';
import { SelectionRow } from '../../../components/ui/SelectionRow';
import { CompactPagination } from '../../../components/ui/CompactPagination';
export default function UsersScreen() {
  const api=useAdmin();const auth=useAuth();const [search,setSearch]=useState('');const [filter,setFilter]=useState('');const [status,setStatus]=useState('all');const [page,setPage]=useState(1);
  const load=useCallback(()=>api.users(filter,page,status),[api,filter,page,status]);const query=useClientQuery(load);
  return <ScreenContainer><AppButton variant="secondary" label="Volver a Gestión" onPress={()=>router.replace('/admin')}/><AppText variant="title">Usuarios</AppText>
    <View style={{flexDirection:'row',alignItems:'flex-end',gap:8,flexWrap:'wrap'}}><View style={{flex:1,minWidth:180}}><AppInput label="Buscar usuarios" placeholder="Nombre o email" value={search} onChangeText={setSearch}/></View><FilterDisclosure activeCount={status==='all'?0:1} onApply={()=>setPage(1)} onClear={()=>{setStatus('all');setPage(1);}}><AppText variant="subtitle">Estado</AppText><SelectionRow radio label="Todos" checked={status==='all'} onPress={()=>setStatus('all')}/><SelectionRow radio label="Activos" checked={status==='active'} onPress={()=>setStatus('active')}/><SelectionRow radio label="Inactivos" checked={status==='inactive'} onPress={()=>setStatus('inactive')}/></FilterDisclosure><AppButton compact label="Buscar" disabled={query.loading} onPress={()=>{setPage(1);setFilter(search.trim());}}/></View>
    {auth.hasPermission('roles.manage')&&<AppButton label="Crear usuario e invitar" onPress={()=>router.push('/admin/users/new')}/>}
    <QueryState {...query}/>{query.data&&<><AppText muted>{query.data.total} usuarios · Página {query.data.page}</AppText>
      {!query.data.items.length&&<AppText muted>No hay usuarios para esta consulta.</AppText>}
      {query.data.items.map(user=><PetCareCard key={user.id}><AppText variant="subtitle">{user.firstName} {user.lastName}</AppText><AppText>{user.email}</AppText><AppText muted>{roleLabel(user.role,user.roleName)} · {user.isActive?'Activa':'Inactiva'}</AppText><AppButton variant="secondary" label="Ver / Editar" onPress={()=>router.push({pathname:'/admin/users/[id]',params:{id:user.id}})}/></PetCareCard>)}
      <CompactPagination page={page} canPrevious={page>1&&!query.loading} canNext={query.data.hasMore&&!query.loading} onPrevious={()=>setPage(p=>p-1)} onNext={()=>setPage(p=>p+1)} summary={`${query.data.total} usuarios`}/>
    </>}</ScreenContainer>;
}
