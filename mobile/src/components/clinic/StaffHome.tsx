/**
 * Inicio compartido del personal autenticado. Consulta /clinic/home para agenda y contadores reales y presenta módulos según permisos de /me; no inventa cifras ante errores.
 */
import { useCallback,useState } from 'react';
import { Platform,Pressable,ScrollView,View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useClinic } from '../../hooks/useClinic';
import { useClientQuery } from '../../hooks/useClientQuery';
import { PetCareScreen,PetCareHeader,PetCareCard,PetCareAction,PetCareEmptyState,PetImage,QueryState,statusLabel } from '../client/PetCareUI';
import { AppText } from '../ui/AppText';
import { clinicDateTime } from '../../utils/clinic-date';
import { AppButton } from '../ui/AppButton';
import { FormNotice } from '../ui/FormNotice';
import { useFeedback } from '../../contexts/FeedbackContext';
function SharedStaffHome(){const {user,hasPermission,request,refreshProfile}=useAuth();const api=useClinic();const query=useClientQuery(api.home);const [photoLoading,setPhotoLoading]=useState(false),[photoError,setPhotoError]=useState<string|null>(null),[photo,setPhoto]=useState<{uri:string;base64:string}|null>(null);const {showToast}=useFeedback();const base=user?.role==='VETERINARIAN'?'/vet':user?.role==='GROOMER'?'/professional':'/secretary';
 async function choosePhoto(source:'gallery'|'camera'){setPhotoError(null);try{if(source==='camera'&&Platform.OS==='web'){setPhotoError('La cámara está disponible desde la app móvil.');return;}const permission=source==='camera'?await ImagePicker.requestCameraPermissionsAsync():await ImagePicker.requestMediaLibraryPermissionsAsync();if(!permission.granted){setPhotoError(source==='camera'?'Permití el acceso a la cámara desde los ajustes del teléfono.':'Permití el acceso a la galería para elegir una foto.');return;}const options={mediaTypes:['images' as const],allowsEditing:true,aspect:[1,1] as [number,number],quality:0.8,base64:true};const result=source==='camera'?await ImagePicker.launchCameraAsync(options):await ImagePicker.launchImageLibraryAsync(options);if(result.canceled)return;const asset=result.assets[0];if(!asset?.base64||asset.base64.length>7_000_000||(asset.fileSize??0)>5*1024*1024||asset.width*asset.height>25_000_000){setPhotoError('Elegí una imagen JPEG, PNG o WebP de hasta 5 MB y 25 megapíxeles.');return;}setPhoto({uri:asset.uri,base64:asset.base64});}catch(error){setPhotoError(error instanceof Error?error.message:'No pudimos abrir la imagen. Intentá nuevamente.');}}
 async function savePhoto(){if(!photo)return;setPhotoLoading(true);setPhotoError(null);try{await request('/vet/profile/photo',{method:'PUT',body:{photoBase64:photo.base64}});await refreshProfile();setPhoto(null);showToast('Foto de perfil actualizada','success');}catch(error){setPhotoError(error instanceof Error?error.message:'No pudimos guardar la foto. Intentá nuevamente.');}finally{setPhotoLoading(false);}}
 return <PetCareScreen><PetCareHeader title={`Hola, ${user?.firstName??''}`} subtitle={user?.professional?.name??user?.roleName}/>{user?.role==='VETERINARIAN'&&<PetCareCard><View style={{alignItems:'center',gap:12}}><PetImage uri={photo?.uri??user.profilePhotoUrl??null} size={84}/><AppButton label={photo?'Elegir otra imagen':'Elegir de la galería'} variant="secondary" loading={photoLoading} disabled={photoLoading} onPress={()=>void choosePhoto('gallery')}/>{Platform.OS!=='web'&&<AppButton label="Tomar foto con la cámara" variant="secondary" disabled={photoLoading} onPress={()=>void choosePhoto('camera')}/>}{photo&&<AppButton label="Guardar foto" loading={photoLoading} disabled={photoLoading} onPress={()=>void savePhoto()}/>}<FormNotice error message={photoError}/></View></PetCareCard>}<QueryState {...query}/>{query.data&&<PetCareCard>{query.data.todayCount!==null&&<AppText variant="subtitle">Turnos de hoy: {query.data.todayCount}</AppText>}{query.data.pendingCount!==null&&<AppText>Solicitudes pendientes: {query.data.pendingCount}</AppText>}{query.data.pendingReservations!==null&&<AppText>Reservas solicitadas: {query.data.pendingReservations}</AppText>}</PetCareCard>}{query.data?.nextAppointment&&<PetCareCard><AppText variant="subtitle">Próximo paciente</AppText><AppText>{String(query.data.nextAppointment.petName)} · {String(query.data.nextAppointment.service)}</AppText><AppText>{clinicDateTime(String(query.data.nextAppointment.startsAt))}</AppText></PetCareCard>}
 {(hasPermission('appointments.view_own')||hasPermission('appointments.view_all'))&&<PetCareAction title="Agenda y turnos" icon="calendar-outline" onPress={()=>router.push(`${base}/agenda` as never)}/>}
 {user?.role==='VETERINARIAN'&&hasPermission('pets.view_information')&&<PetCareAction title="Mis pacientes" icon="paw-outline" onPress={()=>router.push('/vet/patients' as never)}/>}
 {hasPermission('reservations.view_all')&&<PetCareAction title="Reservas para retiro" icon="bag-handle-outline" onPress={()=>router.push(`${base}/reservations` as never)}/>}
 {user?.role==='SECRETARY'&&hasPermission('users.view_basic')&&<PetCareAction title="Clientes" icon="people-outline" onPress={()=>router.push('/secretary/clients' as never)}/>}
 <AppButton label="Mi perfil" variant="secondary" onPress={()=>router.push('/account')}/></PetCareScreen>;
}
export function StaffLayoutHome(){return <StaffHome/>;}
export function StaffHome(){const {user}=useAuth();return user?.role==='VETERINARIAN'?<VeterinarianHome/>:<SharedStaffHome/>;}

/** Inicio exclusivo del veterinario: agenda real del día y tres accesos operativos. */
function VeterinarianHome(){
 const {user,hasPermission}=useAuth();
 const patientScope=hasPermission('pets.view_all')||hasPermission('pets.view_assigned');
 const api=useClinic();
 const query=useClientQuery(api.home);
 const appointments=query.data?.todayAppointments??[];
 return <PetCareScreen wide>
  <PetCareHeader title={`Hola, ${user?.firstName??''}`} subtitle="Atención veterinaria"/>
  <AppText variant="subtitle">Turnos de hoy</AppText>
  <QueryState {...query}/>
  {query.data&&appointments.length===0&&<PetCareEmptyState title="No tenés turnos para hoy" icon="calendar-outline"/>}
  {appointments.length>0&&<ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{gap:12,paddingBottom:8}}>
   {appointments.map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Abrir turno de ${String(item.petName)}`} onPress={()=>router.push({pathname:'/vet/appointment' as never,params:{id:item.id}})} style={{width:260}}>
    <PetCareCard><View style={{alignItems:'center',gap:8}}><PetImage uri={typeof item.petPhotoUrl==='string'?item.petPhotoUrl:null} size={76}/><AppText variant="subtitle" numberOfLines={1}>{String(item.petName)}</AppText></View>
     <AppText>{clinicDateTime(String(item.startsAt))}</AppText>
     {hasPermission('users.view_basic')&&Boolean(item.ownerName)&&<AppText muted numberOfLines={1}>Propietario: {String(item.ownerName)}</AppText>}
     <AppText>{statusLabel(String(item.status))}</AppText>
    </PetCareCard>
   </Pressable>)}
  </ScrollView>}
  {(hasPermission('appointments.view_own')||hasPermission('appointments.view_all'))&&<PetCareAction title="Agenda y turnos" icon="calendar-outline" onPress={()=>router.push('/vet/agenda' as never)}/>}
  {hasPermission('pets.view_information')&&patientScope&&<PetCareAction title="Pacientes" icon="paw-outline" onPress={()=>router.push('/vet/patients' as never)}/>}
  {hasPermission('pets.view_information')&&patientScope&&<PetCareAction title="Mis clientes" icon="people-outline" onPress={()=>router.push('/vet/clients' as never)}/>}
 </PetCareScreen>;
}
// Los formularios y listas se comparten sin duplicar registros según el rol.
export function useSubmittedSearch(){const [search,setSearch]=useState('');const [submitted,setSubmitted]=useState('');return {search,setSearch,submitted,submit:useCallback(()=>setSubmitted(search.trim()),[search])};}
