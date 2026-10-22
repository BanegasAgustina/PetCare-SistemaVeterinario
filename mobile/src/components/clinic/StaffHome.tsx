/**
 * Inicio compartido del personal autenticado. Consulta /clinic/home para agenda y contadores reales y presenta módulos según permisos de /me; no inventa cifras ante errores.
 */
import { useCallback,useState } from 'react';
import { Platform,Pressable,ScrollView,View,useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useClinic } from '../../hooks/useClinic';
import { useClientQuery } from '../../hooks/useClientQuery';
import { PetCareScreen,PetCareHeader,PetCareCard,PetCareAction,PetCareEmptyState,PetImage,QueryState,statusLabel,ResponsiveGrid,type IconName } from '../client/PetCareUI';
import { AppText } from '../ui/AppText';
import { clinicDateTime } from '../../utils/clinic-date';
import { AppButton } from '../ui/AppButton';
import { FormNotice } from '../ui/FormNotice';
import { ProfilePhotoInput,type PickedProfilePhoto } from '../forms/ProfilePhotoInput';
import { useFeedback } from '../../contexts/FeedbackContext';
import { useTheme } from '../../hooks/useTheme';
function SharedStaffHome(){const {user,hasPermission,request,refreshProfile}=useAuth();const api=useClinic();const query=useClientQuery(api.home);const [photoLoading,setPhotoLoading]=useState(false),[photoError,setPhotoError]=useState<string|null>(null),[photo,setPhoto]=useState<PickedProfilePhoto|null>(null);const {showToast}=useFeedback();const base=user?.role==='VETERINARIAN'?'/vet':user?.role==='GROOMER'?'/professional':'/secretary';
 async function savePhoto(){if(!photo)return;setPhotoLoading(true);setPhotoError(null);try{await request('/vet/profile/photo',{method:'PUT',body:{photoBase64:photo.base64}});await refreshProfile();setPhoto(null);showToast('Foto de perfil actualizada','success');}catch(error){setPhotoError(error instanceof Error?error.message:'No pudimos guardar la foto. Intentá nuevamente.');}finally{setPhotoLoading(false);}}
 return <PetCareScreen><PetCareHeader title={`Hola, ${user?.firstName??''}`} subtitle={user?.professional?.name??user?.roleName}/>{user?.role==='VETERINARIAN'&&<PetCareCard><View style={{alignItems:'center',gap:12}}><ProfilePhotoInput currentUri={user.profilePhotoUrl??null} photo={photo} onSelect={setPhoto} onRemove={()=>setPhoto(null)} disabled={photoLoading} allowCamera removable={false} size={84}/>{photo&&<AppButton label="Guardar foto" loading={photoLoading} disabled={photoLoading} onPress={()=>void savePhoto()}/>}<FormNotice error message={photoError}/></View></PetCareCard>}<QueryState {...query}/>{query.data&&<PetCareCard>{query.data.todayCount!==null&&<AppText variant="subtitle">Turnos de hoy: {query.data.todayCount}</AppText>}{query.data.pendingCount!==null&&<AppText>Solicitudes pendientes: {query.data.pendingCount}</AppText>}{query.data.pendingReservations!==null&&<AppText>Reservas solicitadas: {query.data.pendingReservations}</AppText>}</PetCareCard>}{query.data?.nextAppointment&&<PetCareCard><AppText variant="subtitle">Próximo paciente</AppText><AppText>{String(query.data.nextAppointment.petName)} · {String(query.data.nextAppointment.service)}</AppText><AppText>{clinicDateTime(String(query.data.nextAppointment.startsAt))}</AppText></PetCareCard>}
 {(hasPermission('appointments.view_own')||hasPermission('appointments.view_all'))&&<PetCareAction title="Agenda y turnos" icon="calendar-outline" onPress={()=>router.push(`${base}/agenda` as never)}/>}
 {user?.role==='VETERINARIAN'&&hasPermission('pets.view_information')&&<PetCareAction title="Mis pacientes" icon="paw-outline" onPress={()=>router.push('/vet/patients' as never)}/>}
 {hasPermission('reservations.view_all')&&<PetCareAction title="Reservas para retiro" icon="bag-handle-outline" onPress={()=>router.push(`${base}/reservations` as never)}/>}
 {user?.role==='SECRETARY'&&hasPermission('users.view_basic')&&<PetCareAction title="Clientes" icon="people-outline" onPress={()=>router.push('/secretary/clients' as never)}/>}
 <AppButton label="Mi perfil" variant="secondary" onPress={()=>router.push('/account')}/></PetCareScreen>;
}
export function StaffLayoutHome(){return <StaffHome/>;}
export function StaffHome(){const {user}=useAuth();return user?.role==='VETERINARIAN'?<VeterinarianHome/>:user?.role==='GROOMER'?<GroomerHome/>:<SharedStaffHome/>;}

function StaffMetricCards({items}:{items:{label:string;value:number|null;icon:IconName}[]}){
 const {width}=useWindowDimensions();const {colors}=useTheme();
 return <View style={{flexDirection:'row',gap:10,flexWrap:'wrap'}}>{items.map(item=><View key={item.label} style={{flexGrow:1,flexBasis:width<520?'28%':180,minWidth:92,backgroundColor:colors.surface,borderRadius:18,padding:14,borderWidth:1,borderColor:colors.border,gap:9}}>
  <View style={{flexDirection:'row',alignItems:'center',gap:8}}><View style={{width:30,height:30,borderRadius:11,alignItems:'center',justifyContent:'center',backgroundColor:colors.accent}}><Ionicons name={item.icon} size={16} color={colors.primary}/></View><AppText variant="caption" muted numberOfLines={1} style={{flex:1}}>{item.label}</AppText></View>
  <AppText variant="title">{item.value??'—'}</AppText>
 </View>)}</View>;
}

/** Inicio operativo del peluquero: resumen real de su agenda y enlaces directos a sus turnos. */
function GroomerHome(){
 const {user}=useAuth();const api=useClinic();const query=useClientQuery(api.home);const upcoming=query.data?.upcomingAppointments??[];
 return <PetCareScreen wide><PetCareHeader title={`Hola, ${user?.firstName??''}`} subtitle="Tu jornada de peluquería"/><QueryState {...query}/>
  {query.data&&<>
   <StaffMetricCards items={[{label:'Turnos de hoy',value:query.data.todayCount,icon:'calendar-outline'},{label:'Solicitudes',value:query.data.pendingCount,icon:'time-outline'},{label:'Atendidos hoy',value:query.data.completedTodayCount,icon:'checkmark-circle-outline'}]}/>
   {query.data.nextAppointment&&<PetCareCard><AppText variant="caption" muted>PRÓXIMO TURNO</AppText><AppText variant="subtitle">{String(query.data.nextAppointment.petName)} · {String(query.data.nextAppointment.service)}</AppText><AppText>{clinicDateTime(String(query.data.nextAppointment.startsAt))}</AppText></PetCareCard>}
   <AppText variant="subtitle">Próximos turnos</AppText>
   {upcoming.length?upcoming.map(item=><Pressable key={item.id} accessibilityRole="button" onPress={()=>router.push({pathname:'/professional/appointment' as never,params:{id:item.id}})}><PetCareCard><View style={{flexDirection:'row',alignItems:'center',gap:12}}><View style={{flex:1,minWidth:0}}><AppText variant="subtitle" numberOfLines={1}>{String(item.petName)}</AppText><AppText muted numberOfLines={1}>{clinicDateTime(String(item.startsAt))} · {String(item.service)}</AppText></View><AppText variant="caption">{statusLabel(String(item.status))}</AppText></View></PetCareCard></Pressable>):<PetCareEmptyState title="No hay próximos turnos" message="Los nuevos turnos aparecerán acá cuando se asignen a tu agenda." icon="calendar-outline"/>}
  </>}
 </PetCareScreen>;
}

/** Inicio exclusivo del veterinario: resumen diario, próximas atenciones y solicitudes pendientes. */
function VeterinarianHome(){
 const {user,hasPermission}=useAuth();
 const {width}=useWindowDimensions();
 const api=useClinic();
 const query=useClientQuery(api.home);
 const appointments=query.data?.todayAppointments??[];
 const upcoming=query.data?.upcomingAppointments??[];
 const renderAppointmentCard=(item:typeof appointments[number],cardWidth:number|'100%')=><Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Abrir turno de ${String(item.petName)}`} onPress={()=>router.push({pathname:'/vet/appointment' as never,params:{id:item.id}})} style={{width:cardWidth}}>
   <PetCareCard><View style={{flexDirection:'row',alignItems:'center',gap:12}}><PetImage uri={typeof item.petPhotoUrl==='string'?item.petPhotoUrl:null} size={48}/><View style={{flex:1,minWidth:0}}><AppText variant="subtitle" numberOfLines={1}>{String(item.petName)}</AppText><AppText muted numberOfLines={1}>{clinicDateTime(String(item.startsAt))} · {String(item.service)}</AppText>{hasPermission('users.view_basic')&&Boolean(item.ownerName)&&<AppText muted numberOfLines={1}>Propietario: {String(item.ownerName)}</AppText>}<AppText variant="caption" style={{fontWeight:'700'}}>Ver turno</AppText></View><AppText variant="caption">{statusLabel(String(item.status))}</AppText></View>
  </PetCareCard>
 </Pressable>;
 const appointmentCards=upcoming.map(item=>renderAppointmentCard(item,'100%'));
 return <PetCareScreen wide>
   <PetCareHeader title={`Hola, ${user?.firstName??''}`} subtitle="Este es el resumen de tu jornada"/>
  <QueryState {...query}/>
   {query.data&&<StaffMetricCards items={[{label:'Turnos de hoy',value:query.data.todayCount,icon:'calendar-outline' as const},...(Number(query.data.attentionCount)>0?[{label:'Consultas en atención',value:query.data.attentionCount,icon:'time-outline' as const}]:[]),...(hasPermission('appointments.manage')&&Number(query.data.pendingCount)>0?[{label:'Solicitudes pendientes',value:query.data.pendingCount,icon:'notifications-outline' as const}]:[])]}/>}
   {Number(query.data?.attentionCount)>0&&<PetCareCard><AppText variant="subtitle">Requiere tu atención</AppText><AppText>{query.data?.attentionCount} {Number(query.data?.attentionCount)===1?'consulta en atención':'consultas en atención'}</AppText><AppButton compact variant="secondary" label="Continuar atenciones" onPress={()=>router.push({pathname:'/vet/agenda' as never,params:{status:'IN_PROGRESS'}})}/></PetCareCard>}
   {hasPermission('appointments.manage')&&Number(query.data?.pendingCount)>0&&<PetCareCard><AppText variant="subtitle">Solicitudes pendientes</AppText><AppText>{query.data?.pendingCount} {Number(query.data?.pendingCount)===1?'solicitud requiere':'solicitudes requieren'} revisión</AppText><AppButton compact variant="secondary" label="Revisar solicitudes" onPress={()=>router.push({pathname:'/vet/agenda' as never,params:{status:'REQUESTED'}})}/></PetCareCard>}
   {query.data&&Number(query.data.attentionCount)===0&&(!hasPermission('appointments.manage')||Number(query.data.pendingCount)===0)&&<AppText muted>No hay tareas pendientes para revisar.</AppText>}
   {query.data&&upcoming.length===0&&<PetCareEmptyState title="No tenés próximos turnos" icon="calendar-outline"/>}
   {upcoming.length>0&&<AppText variant="subtitle">Próximo paciente</AppText>}
   {upcoming.length>0&&(Platform.OS==='web'&&width>=768?<ResponsiveGrid>{appointmentCards}</ResponsiveGrid>:<ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{gap:12,paddingBottom:8}}>{upcoming.map(item=>renderAppointmentCard(item,260))}</ScrollView>)}
   {query.data&&appointments.length===0&&<AppText muted>Hoy no tenés turnos asignados.</AppText>}
 </PetCareScreen>;
}
// Los formularios y listas se comparten sin duplicar registros según el rol.
export function useSubmittedSearch(){const [search,setSearch]=useState('');const [submitted,setSubmitted]=useState('');return {search,setSearch,submitted,submit:useCallback(()=>setSubmitted(search.trim()),[search])};}
