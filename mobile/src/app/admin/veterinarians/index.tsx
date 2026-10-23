/** Listado paginado: búsqueda/filtros consultan MySQL mediante la API. */
import { useCallback,useEffect,useRef,useState } from 'react';
import { router,useFocusEffect,useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../../components/layout/ScreenContainer';
import { AppInput } from '../../../components/forms/AppInput';
import { AppText } from '../../../components/ui/AppText';
import { AppButton } from '../../../components/ui/AppButton';
import { SelectionRow } from '../../../components/ui/SelectionRow';
import { useAuth } from '../../../hooks/useAuth';
import type { VetCatalog,VetDetail,VetPage,VetValues } from '../../../types/veterinarian';
import { friendlyError } from '../../../services/api';
import { FilterDisclosure } from '../../../components/ui/FilterDisclosure';
import { CompactPagination } from '../../../components/ui/CompactPagination';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
import { PetImage,ResponsiveGrid } from '../../../components/client/PetCareUI';
import { AdminPersonRow } from '../../../components/admin/AdminPersonRow';
import { AppModal } from '../../../components/ui/AppModal';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { FormNotice } from '../../../components/ui/FormNotice';
import { ProfilePhotoInput,type PickedProfilePhoto } from '../../../components/forms/ProfilePhotoInput';
import { validateIdentityForm } from '../../../utils/auth-validation';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { useFeedback } from '../../../contexts/FeedbackContext';
import { AdminFormActions, AdminFormSection } from '../../../components/admin/AdminFormLayout';
import { AdminPageHeading } from '../../../components/admin/AdminPageHeading';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { invitationLabel } from '../../../utils/invitation-label';
const emptyVet:VetValues={firstName:'',lastName:'',email:'',phone:'',licenseNumber:'',isActive:true,specialtyIds:[]};
export default function VeterinariansScreen() {
  const {create}=useLocalSearchParams<{create?:string}>();
  const auth=useAuth();const {request}=auth;const action=useAsyncAction();const {showToast}=useFeedback();
  const [search,setSearch]=useState('');const [status,setStatus]=useState('all');const [sort,setSort]=useState('recent');
  const submittedSearch=useDebouncedValue(search.trim());
  const [specialty,setSpecialty]=useState('');const [catalog,setCatalog]=useState<VetCatalog|null>(null);
  const [page,setPage]=useState(1);const [result,setResult]=useState<VetPage|null>(null);const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);const sequence=useRef(0);
  const [createOpen,setCreateOpen]=useState(false);const [createValues,setCreateValues]=useState(emptyVet);const [createErrors,setCreateErrors]=useState<Partial<Record<keyof VetValues,string>>>({});const [createPhoto,setCreatePhoto]=useState<PickedProfilePhoto|null>(null);
  const [selectedVetId,setSelectedVetId]=useState<string|null>(null);const [selectedVet,setSelectedVet]=useState<VetDetail|null>(null);const [detailLoading,setDetailLoading]=useState(false);const [detailError,setDetailError]=useState<string|null>(null);const [statusTarget,setStatusTarget]=useState<boolean|null>(null);
  useEffect(()=>{if(!selectedVetId)return;let current=true;void request<VetDetail>(`/admin/veterinarians/${selectedVetId}`).then(vet=>{if(current)setSelectedVet(vet);}).catch(err=>{if(current)setDetailError(friendlyError(err));}).finally(()=>{if(current)setDetailLoading(false);});return()=>{current=false;};},[request,selectedVetId]);
  const load=useCallback(()=>{
    const attempt=++sequence.current;setLoading(true);setError(null);setResult(null);
    const query=new URLSearchParams({search:submittedSearch,status,sort,page:String(page),...(specialty?{specialtyId:specialty}:{})});
    void Promise.all([request<VetPage>(`/admin/veterinarians?${query}`),request<VetCatalog>('/admin/veterinarians/catalog')])
      .then(([value,options])=>{if(attempt===sequence.current){setResult(value);setCatalog(options);}})
      .catch(err=>{if(attempt===sequence.current)setError(friendlyError(err));}).finally(()=>{if(attempt===sequence.current)setLoading(false);});
    return ()=>{sequence.current++;};
  },[request,submittedSearch,status,sort,page,specialty]);
  function changeCreate<K extends keyof VetValues>(key:K,value:VetValues[K]){setCreateValues(current=>({...current,[key]:value}));setCreateErrors(current=>({...current,[key]:undefined}));}
  function openVetDetails(id:string){setSelectedVetId(id);setSelectedVet(null);setDetailError(null);setDetailLoading(true);}
  async function saveVetStatus(){if(!selectedVet||statusTarget===null)return;const updated=await request<VetDetail>(`/admin/veterinarians/${selectedVet.id}/status`,{method:'PATCH',body:{isActive:statusTarget}});setSelectedVet(updated);setStatusTarget(null);load();showToast(statusTarget?'Veterinario activado':'Veterinario desactivado','success');}
  function createVeterinarian(){const identity=validateIdentityForm(createValues);const errors:Partial<Record<keyof VetValues,string>>={firstName:identity.firstName,lastName:identity.lastName,email:identity.email,phone:identity.phone};if(!createValues.licenseNumber.trim()||createValues.licenseNumber.trim().length>80)errors.licenseNumber='Ingresá una matrícula de hasta 80 caracteres.';if(!createValues.specialtyIds.length)errors.specialtyIds='Seleccioná al menos una especialidad.';setCreateErrors(errors);if(Object.values(errors).some(Boolean))return;void action.run(async()=>{const saved=await request<{veterinarian:{id:string};invitationDelivery:'sent'|'failed'}>('/admin/veterinarians',{method:'POST',body:createValues});let photoFailed=false;if(createPhoto){try{await request(`/admin/veterinarians/${saved.veterinarian.id}/photo`,{method:'PUT',body:{photoBase64:createPhoto.base64}});}catch{photoFailed=true;}}setCreateOpen(false);router.setParams({create:undefined});setCreateValues(emptyVet);setCreatePhoto(null);load();const delivery=saved.invitationDelivery==='sent'?'Invitación enviada por correo.':'El veterinario quedó creado, pero no se pudo enviar el correo; Admin Principal puede reenviar la invitación.';showToast(photoFailed?`${delivery} La foto puede agregarse desde su perfil.`:delivery,photoFailed?'info':saved.invitationDelivery==='sent'?'success':'info');});}
  useFocusEffect(useCallback(()=>{const timer=setTimeout(load,300);return ()=>{clearTimeout(timer);sequence.current++;};},[load]));
  return <ScreenContainer wide>
    <AdminPageHeading title="Veterinarios"/>
    <SearchFilterBar><AppInput icon="search-outline" label="Buscar veterinario" placeholder="Nombre, apellido, matrícula o email" returnKeyType="search" value={search} onChangeText={value=>{setSearch(value);setPage(1);}} onSubmitEditing={()=>{setPage(1);}}/><FilterDisclosure fullWidth activeCount={(status!=='all'?1:0)+(sort!=='recent'?1:0)+(specialty?1:0)} onApply={()=>{setPage(1);}} onClear={()=>{setStatus('all');setSort('recent');setSpecialty('');setPage(1);}}>
      <AppText variant="subtitle">Estado</AppText>{[{code:'all',name:'Todos'},{code:'active',name:'Activos'},{code:'inactive',name:'Inactivos'}].map(item=><SelectionRow key={item.code} label={item.name} checked={status===item.code} onPress={()=>{setStatus(item.code);setPage(1);}}/>)}
      <AppText variant="subtitle">Ordenar por</AppText>{[{code:'recent',name:'Más recientes'},{code:'oldest',name:'Más antiguos'},{code:'az',name:'Nombre A-Z'},{code:'za',name:'Nombre Z-A'}].map(item=><SelectionRow radio key={item.code} label={item.name} checked={sort===item.code} onPress={()=>{setSort(item.code);setPage(1);}}/>)}
      <AppText variant="subtitle">Especialidad</AppText><SelectionRow label="Todas" checked={!specialty} onPress={()=>{setSpecialty('');setPage(1);}}/>{catalog?.specialties.map(item=><SelectionRow key={item.id} label={item.name} checked={specialty===item.id} onPress={()=>{setSpecialty(item.id);setPage(1);}}/>)}
    </FilterDisclosure></SearchFilterBar>
    {auth.hasPermission('veterinarians.manage') && <AppButton label="+ Crear veterinario" onPress={()=>{setCreateValues(emptyVet);setCreateErrors({});setCreatePhoto(null);setCreateOpen(true);}} />}
    <FormNotice error message={error} />
    {Boolean(error) && <AppButton label="Reintentar" onPress={load} />}
    {loading && <AppText muted>Consultando veterinarios…</AppText>}
    {result && <AppText muted>{result.total} profesionales</AppText>}
    {result?.items.length?<ResponsiveGrid>{result.items.map(vet=><AdminPersonRow key={vet.id} imageUri={vet.profilePhotoUrl} name={`${vet.firstName} ${vet.lastName}`} role="Veterinario" status={vet.isActive?'Activo':'Inactivo'} onEdit={undefined} onView={()=>openVetDetails(vet.id)}/>)}</ResponsiveGrid>:null}
    {result && !result.items.length && <AppText muted>No hay veterinarios para estos filtros.</AppText>}
    <CompactPagination page={page} canPrevious={!loading&&page>1} canNext={!loading&&Boolean(result?.hasMore)} onPrevious={()=>setPage(value=>value-1)} onNext={()=>setPage(value=>value+1)} summary={result?`${result.total} veterinarios`:undefined}/>
    <AppModal size="wide" visible={createOpen||create==='1'} dismissible onClose={()=>{if(!action.loading){setCreateOpen(false);router.setParams({create:undefined});}}}>
      <AppText variant="title">Crear veterinario</AppText><AppText muted>Enviaremos una invitación al correo indicado. El veterinario configurará su contraseña desde un enlace de un solo uso válido durante 24 horas.</AppText>
      <AdminFormSection title="Datos de la persona" description="La cuenta profesional debe tener datos de contacto y matrícula vigentes.">
        <ProfilePhotoInput currentUri={null} photo={createPhoto} disabled={action.loading} onSelect={setCreatePhoto} onRemove={()=>setCreatePhoto(null)}/>
        <AppInput label="Nombre" required value={createValues.firstName} error={createErrors.firstName} onChangeText={value=>changeCreate('firstName',value)}/>
        <AppInput label="Apellido" required value={createValues.lastName} error={createErrors.lastName} onChangeText={value=>changeCreate('lastName',value)}/>
        <AppInput label="Correo electrónico" required value={createValues.email} error={createErrors.email} keyboardType="email-address" autoCapitalize="none" onChangeText={value=>changeCreate('email',value)}/>
        <AppInput label="Teléfono" value={createValues.phone} error={createErrors.phone} keyboardType="phone-pad" onChangeText={value=>changeCreate('phone',value)}/>
        <AppInput label="Matrícula profesional" required value={createValues.licenseNumber} error={createErrors.licenseNumber} maxLength={80} onChangeText={value=>changeCreate('licenseNumber',value)}/>
      </AdminFormSection>
      <AdminFormSection title="Especialidades" description="Seleccioná las áreas de atención del veterinario.">
        <FormNotice error message={createErrors.specialtyIds??null}/>
        {catalog?.specialties.map(item=><SelectionRow key={item.id} label={item.name} checked={createValues.specialtyIds.includes(item.id)} onPress={()=>changeCreate('specialtyIds',createValues.specialtyIds.includes(item.id)?createValues.specialtyIds.filter(value=>value!==item.id):[...createValues.specialtyIds,item.id])}/>)}
        {!catalog?.specialties.length&&<><AppText muted>{auth.hasPermission('specialties.manage')?'Primero creá una especialidad para poder completar el alta.':'No hay especialidades disponibles. Pedile a un administrador que agregue una antes de registrar el veterinario.'}</AppText>{auth.hasPermission('specialties.manage')&&<AppButton variant="secondary" label="Crear especialidad" onPress={()=>router.push('/admin/veterinarians/specialties')}/>}</>}
      </AdminFormSection>
      <FormNotice error message={action.error}/><AdminFormActions><AppButton label="Crear veterinario" loading={action.loading} disabled={!catalog?.specialties.length} onPress={createVeterinarian}/><AppButton label="Cancelar" variant="secondary" disabled={action.loading} onPress={()=>{setCreateOpen(false);router.setParams({create:undefined});}}/></AdminFormActions>
    </AppModal>
    <AppModal visible={selectedVetId!==null} dismissible onClose={()=>setSelectedVetId(null)}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><AppText variant="title">Detalle del veterinario</AppText>{auth.hasPermission('veterinarians.manage')&&selectedVet&&<Pressable accessibilityRole="button" accessibilityLabel="Editar veterinario" onPress={()=>{setSelectedVetId(null);router.push({pathname:'/admin/veterinarians/[id]',params:{id:selectedVet.id}});}} style={{padding:10}}><Ionicons name="create-outline" size={22}/></Pressable>}</View>
      {detailLoading&&<AppText muted>Cargando detalle…</AppText>}
      <FormNotice error message={detailError}/>
      {Boolean(detailError)&&Boolean(selectedVetId)&&<AppButton label="Reintentar detalle" variant="secondary" onPress={()=>openVetDetails(selectedVetId!)}/>}
      {selectedVet&&<>
        <View style={{alignItems:'center',gap:10}}><PetImage uri={selectedVet.profilePhotoUrl} size={76}/><AppText variant="subtitle">{selectedVet.firstName} {selectedVet.lastName}</AppText><AppText muted>Veterinario</AppText></View>
        <AppText><AppText variant="caption" muted>Correo electrónico · </AppText>{selectedVet.email}</AppText>
        <AppText><AppText variant="caption" muted>Teléfono · </AppText>{selectedVet.phone||'Sin teléfono'}</AppText>
        <AppText><AppText variant="caption" muted>Matrícula · </AppText>{selectedVet.licenseNumber||'Sin matrícula'}</AppText>
        <AppText><AppText variant="caption" muted>Especialidades · </AppText>{selectedVet.specialties.map(item=>item.name).join(' · ')||'Sin especialidades'}</AppText>
        <AppText><AppText variant="caption" muted>Estado · </AppText>{selectedVet.isActive?'Activo':'Inactivo'}</AppText>
        <AppText><AppText variant="caption" muted>Correo · </AppText>{selectedVet.emailVerified?'Verificado':'Sin verificar'}</AppText>
        <AppText><AppText variant="caption" muted>Invitación · </AppText>{invitationLabel(selectedVet.invitationStatus)}</AppText>
        {auth.hasRole('SUPER_ADMIN')&&selectedVet.userId!==auth.user?.id&&!selectedVet.emailVerified&&<AppButton variant="secondary" label="Reenviar invitación" onPress={()=>void action.run(async()=>{const result=await request<{delivery:'sent'|'failed'}>(`/admin/users/${selectedVet.userId}/invitation`,{method:'POST'});const updated=await request<VetDetail>(`/admin/veterinarians/${selectedVet.id}`);setSelectedVet(updated);showToast(result.delivery==='sent'?'Invitación reenviada.':'No se pudo enviar el correo. Podés intentar más tarde.',result.delivery==='sent'?'success':'info');})}/>}
        {auth.hasRole('SUPER_ADMIN')&&selectedVet.userId!==auth.user?.id&&selectedVet.emailVerified&&<AppButton variant={selectedVet.isActive?'secondary':'primary'} destructive={selectedVet.isActive} label={selectedVet.isActive?'Desactivar veterinario':'Activar veterinario'} onPress={()=>setStatusTarget(!selectedVet.isActive)}/>}
      </>}
      <AppButton label="Cerrar" variant="secondary" onPress={()=>setSelectedVetId(null)}/>
    </AppModal>
    <ConfirmModal visible={statusTarget!==null} title={statusTarget?'Activar veterinario':'Desactivar veterinario'} confirmLabel={statusTarget?'Activar':'Desactivar'} destructive={statusTarget===false} message={statusTarget?'El veterinario podrá volver a iniciar sesión.':'El veterinario perderá el acceso y sus sesiones dejarán de ser válidas. Sus registros clínicos se conservarán.'} onCancel={()=>setStatusTarget(null)} onConfirm={saveVetStatus}/>
  </ScreenContainer>;
}
