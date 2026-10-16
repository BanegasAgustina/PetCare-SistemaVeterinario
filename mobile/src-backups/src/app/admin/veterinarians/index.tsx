/** Listado paginado: búsqueda/filtros consultan MySQL mediante la API. */
import { useCallback,useRef,useState } from 'react';
import { router,useFocusEffect } from 'expo-router';
import { View,StyleSheet } from 'react-native';
import { ScreenContainer } from '../../../components/layout/ScreenContainer';
import { AppInput } from '../../../components/forms/AppInput';
import { AppText } from '../../../components/ui/AppText';
import { AppButton } from '../../../components/ui/AppButton';
import { SelectionRow } from '../../../components/ui/SelectionRow';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import { softSurfaceShadow } from '../../../constants/surface';
import type { VetCatalog,VetPage,VetValues } from '../../../types/veterinarian';
import { friendlyError } from '../../../services/api';
import { FilterDisclosure } from '../../../components/ui/FilterDisclosure';
import { CompactPagination } from '../../../components/ui/CompactPagination';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
import { PetImage } from '../../../components/client/PetCareUI';
import { AppModal } from '../../../components/ui/AppModal';
import { FormNotice } from '../../../components/ui/FormNotice';
import { ProfilePhotoInput,type PickedProfilePhoto } from '../../../components/forms/ProfilePhotoInput';
import { validateIdentityForm } from '../../../utils/auth-validation';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { useFeedback } from '../../../contexts/FeedbackContext';
const emptyVet:VetValues={firstName:'',lastName:'',email:'',phone:'',licenseNumber:'',isActive:true,specialtyIds:[]};
export default function VeterinariansScreen() {
  const auth=useAuth();const {request}=auth;const {colors}=useTheme();const action=useAsyncAction();const {showToast}=useFeedback();
  const [search,setSearch]=useState('');const [submittedSearch,setSubmittedSearch]=useState('');const [status,setStatus]=useState('all');const [sort,setSort]=useState('recent');
  const [specialty,setSpecialty]=useState('');const [catalog,setCatalog]=useState<VetCatalog|null>(null);
  const [page,setPage]=useState(1);const [result,setResult]=useState<VetPage|null>(null);const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);const sequence=useRef(0);
  const [createOpen,setCreateOpen]=useState(false);const [createValues,setCreateValues]=useState(emptyVet);const [createErrors,setCreateErrors]=useState<Partial<Record<keyof VetValues,string>>>({});const [createPhoto,setCreatePhoto]=useState<PickedProfilePhoto|null>(null);
  const load=useCallback(()=>{
    const attempt=++sequence.current;setLoading(true);setError(null);setResult(null);
    const query=new URLSearchParams({search:submittedSearch,status,sort,page:String(page),...(specialty?{specialtyId:specialty}:{})});
    void Promise.all([request<VetPage>(`/admin/veterinarians?${query}`),request<VetCatalog>('/admin/veterinarians/catalog')])
      .then(([value,options])=>{if(attempt===sequence.current){setResult(value);setCatalog(options);}})
      .catch(err=>{if(attempt===sequence.current)setError(friendlyError(err));}).finally(()=>{if(attempt===sequence.current)setLoading(false);});
    return ()=>{sequence.current++;};
  },[request,submittedSearch,status,sort,page,specialty]);
  function changeCreate<K extends keyof VetValues>(key:K,value:VetValues[K]){setCreateValues(current=>({...current,[key]:value}));setCreateErrors(current=>({...current,[key]:undefined}));}
  function createVeterinarian(){const identity=validateIdentityForm(createValues);const errors:Partial<Record<keyof VetValues,string>>={firstName:identity.firstName,lastName:identity.lastName,email:identity.email,phone:identity.phone};if(!createValues.licenseNumber.trim()||createValues.licenseNumber.trim().length>80)errors.licenseNumber='Ingresá una matrícula de hasta 80 caracteres.';if(!createValues.specialtyIds.length)errors.specialtyIds='Seleccioná al menos una especialidad.';setCreateErrors(errors);if(Object.values(errors).some(Boolean))return;void action.run(async()=>{const saved=await request<{veterinarian:{id:string};delivery:string}>('/admin/veterinarians',{method:'POST',body:createValues});let photoFailed=false;if(createPhoto){try{await request(`/admin/veterinarians/${saved.veterinarian.id}/photo`,{method:'PUT',body:{photoBase64:createPhoto.base64}});}catch{photoFailed=true;}}setCreateOpen(false);setCreateValues(emptyVet);setCreatePhoto(null);load();showToast(photoFailed?'Veterinario creado; la foto puede agregarse desde su perfil.':saved.delivery==='sent'?'Veterinario creado. Invitación enviada.':saved.delivery==='failed'?'Veterinario creado; falló el correo. Reenviá la invitación.':'Veterinario creado con cuenta inactiva.',photoFailed||saved.delivery==='failed'?'info':'success');});}
  useFocusEffect(useCallback(()=>{const timer=setTimeout(load,300);return ()=>{clearTimeout(timer);sequence.current++;};},[load]));
  return <ScreenContainer>
    <AppButton label="Volver a Gestión" variant="secondary" onPress={()=>router.replace('/admin')} />
    <AppText variant="title">Veterinarios</AppText>
    <SearchFilterBar><AppInput icon="search-outline" label="Buscar veterinario" placeholder="Nombre, apellido, matrícula o email" returnKeyType="search" value={search} onChangeText={setSearch} onSubmitEditing={()=>{setSubmittedSearch(search.trim());setPage(1);}}/><FilterDisclosure fullWidth activeCount={(status!=='all'?1:0)+(sort!=='recent'?1:0)+(specialty?1:0)} onApply={()=>{setPage(1);}} onClear={()=>{setStatus('all');setSort('recent');setSpecialty('');setPage(1);}}>
      <AppText variant="subtitle">Estado</AppText>{[{code:'all',name:'Todos'},{code:'active',name:'Activos'},{code:'inactive',name:'Inactivos'}].map(item=><SelectionRow key={item.code} label={item.name} checked={status===item.code} onPress={()=>{setStatus(item.code);setPage(1);}}/>)}
      <AppText variant="subtitle">Ordenar por</AppText>{[{code:'recent',name:'Más recientes'},{code:'oldest',name:'Más antiguos'},{code:'az',name:'Nombre A-Z'},{code:'za',name:'Nombre Z-A'}].map(item=><SelectionRow radio key={item.code} label={item.name} checked={sort===item.code} onPress={()=>{setSort(item.code);setPage(1);}}/>)}
      <AppText variant="subtitle">Especialidad</AppText><SelectionRow label="Todas" checked={!specialty} onPress={()=>{setSpecialty('');setPage(1);}}/>{catalog?.specialties.map(item=><SelectionRow key={item.id} label={item.name} checked={specialty===item.id} onPress={()=>{setSpecialty(item.id);setPage(1);}}/>)}
    </FilterDisclosure><AppButton compact label="Buscar" onPress={()=>{setSubmittedSearch(search.trim());setPage(1);}}/></SearchFilterBar>
    {auth.hasPermission('veterinarians.manage') && <AppButton label="+ Crear veterinario" onPress={()=>{setCreateValues(emptyVet);setCreateErrors({});setCreatePhoto(null);setCreateOpen(true);}} />}
    <FormNotice error message={error} />
    {error && <AppButton label="Reintentar" onPress={load} />}
    {loading && <AppText muted>Consultando veterinarios…</AppText>}
    {result && <AppText muted>{result.total} profesionales</AppText>}
    {result?.items.map(vet=><View key={vet.id} style={[styles.card,softSurfaceShadow(colors.primary),{backgroundColor:colors.surface,borderColor:colors.border}]}>
      <View style={styles.profile}><PetImage uri={vet.profilePhotoUrl} size={56}/><AppText variant="subtitle">{vet.firstName} {vet.lastName}</AppText></View>
      <AppText muted>{vet.specialties.map(item=>item.name).join(' · ')}</AppText>
      <AppText>{vet.isActive?'● Activa':'○ Inactiva'}</AppText><AppText variant="caption" muted>Matrícula {vet.licenseNumber}</AppText>
      <AppButton label="Ver / Editar" variant="secondary" onPress={()=>router.push({pathname:'/admin/veterinarians/[id]',params:{id:vet.id}})} />
    </View>)}
    {result && !result.items.length && <AppText muted>No hay veterinarios para estos filtros.</AppText>}
    <CompactPagination page={page} canPrevious={!loading&&page>1} canNext={!loading&&Boolean(result?.hasMore)} onPrevious={()=>setPage(value=>value-1)} onNext={()=>setPage(value=>value+1)} summary={result?`${result.total} veterinarios`:undefined}/>
    <AppModal visible={createOpen} dismissible onClose={()=>{if(!action.loading)setCreateOpen(false);}}>
      <AppText variant="title">Crear veterinario</AppText><AppText muted>El acceso se enviará al correo ingresado para que configure su contraseña.</AppText>
      <ProfilePhotoInput currentUri={null} photo={createPhoto} disabled={action.loading} onSelect={setCreatePhoto} onRemove={()=>setCreatePhoto(null)}/>
      <AppInput label="Nombre" value={createValues.firstName} error={createErrors.firstName} onChangeText={value=>changeCreate('firstName',value)}/>
      <AppInput label="Apellido" value={createValues.lastName} error={createErrors.lastName} onChangeText={value=>changeCreate('lastName',value)}/>
      <AppInput label="Correo electrónico" value={createValues.email} error={createErrors.email} keyboardType="email-address" onChangeText={value=>changeCreate('email',value)}/>
      <AppInput label="Teléfono" value={createValues.phone} error={createErrors.phone} keyboardType="phone-pad" onChangeText={value=>changeCreate('phone',value)}/>
      <AppInput label="Matrícula profesional" value={createValues.licenseNumber} error={createErrors.licenseNumber} maxLength={80} onChangeText={value=>changeCreate('licenseNumber',value)}/>
      <AppText variant="subtitle">Especialidades</AppText><FormNotice error message={createErrors.specialtyIds??null}/>
      {catalog?.specialties.map(item=><SelectionRow key={item.id} label={item.name} checked={createValues.specialtyIds.includes(item.id)} onPress={()=>changeCreate('specialtyIds',createValues.specialtyIds.includes(item.id)?createValues.specialtyIds.filter(value=>value!==item.id):[...createValues.specialtyIds,item.id])}/>)}
      {!catalog?.specialties.length&&<AppText muted>Creá una especialidad antes de registrar el veterinario.</AppText>}
      <SelectionRow label="Cuenta activa e invitación habilitada" checked={createValues.isActive} onPress={()=>changeCreate('isActive',!createValues.isActive)}/>
      <FormNotice error message={action.error}/><AppButton label="Crear veterinario" loading={action.loading} disabled={!catalog?.specialties.length} onPress={createVeterinarian}/><AppButton label="Cancelar" variant="secondary" disabled={action.loading} onPress={()=>setCreateOpen(false)}/>
    </AppModal>
  </ScreenContainer>;
}
const styles=StyleSheet.create({searchRow:{flexDirection:'row',alignItems:'flex-end',gap:8,flexWrap:'wrap'},flex:{flex:1,minWidth:180},profile:{flexDirection:'row',alignItems:'center',gap:12},card:{padding:16,borderWidth:1,borderRadius:8,gap:12}});
