// Este archivo se encarga de lo siguiente: Pantalla o navegación del área de clientes; muestra y permite gestionar la información del usuario y sus mascotas.

/**
 * Pantalla de inicio del panel para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { useCallback,useState } from 'react';
import { router,useLocalSearchParams } from 'expo-router';
import { Platform,StyleSheet,View,useWindowDimensions } from 'react-native';
import { useClient } from '../../../../hooks/useClient';
import { useClientQuery } from '../../../../hooks/useClientQuery';
import { useFeedback } from '../../../../contexts/FeedbackContext';
import { friendlyError } from '../../../../services/api';
import { PetCareScreen,PetCareHeader,PetCareCard,PetCareAction,QueryState,dateTime,ResponsiveGrid } from '../../../../components/client/PetCareUI';
import { PetCard } from '../../../../components/client/RecordCards';
import { AppText } from '../../../../components/ui/AppText';
import { AppButton } from '../../../../components/ui/AppButton';
import { ConfirmModal } from '../../../../components/ui/ConfirmModal';
import { isWebAtLeast,responsiveLayout } from '../../../../constants/responsive';
import { normalizePetActiveFlag } from '../../../../utils/pet-status';
// Función PetDetail: concentra la lógica dentro de este módulo.
export default function PetDetail(){const {id}=useLocalSearchParams<{id:string}>();const api=useClient();const {width}=useWindowDimensions();const desktop=isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.desktop);const query=useClientQuery(useCallback(()=>api.pet(id),[api,id]));const appointments=useClientQuery(useCallback(()=>api.appointments(),[api]));const lastAppointment=appointments.data?.filter(a=>a.petId===id&&!a.isUpcoming&&a.status!=='CANCELLED').sort((a,b)=>b.startsAt.localeCompare(a.startsAt))[0];const [confirm,setConfirm]=useState(false);const {showToast}=useFeedback();const isActive=normalizePetActiveFlag(query.data?.isActive);// Función changePetStatus: actualiza o guarda información dentro de este módulo.
async function changePetStatus(){if(isActive===null)return;try{if(isActive)await api.deactivatePet(id);else await api.reactivatePet(id);}catch(error){const message=friendlyError(error);if(/turno/i.test(message)){setConfirm(false);showToast('Hay turnos futuros pendientes. No se cambió el estado; revisá tus turnos para resolverlos.','error');router.push('/client/appointments');return;}throw error;}setConfirm(false);showToast(isActive?'Mascota desactivada; conservamos su información':'Mascota reactivada','success');query.reload();appointments.reload();}return <PetCareScreen wide><PetCareHeader title={query.data?.name??'Ficha de mascota'} back/>
<QueryState {...query}/>{query.data&&<><View style={[styles.overview,desktop&&styles.overviewDesktop]}><PetCard pet={query.data} portraitSize={desktop?150:132} showViewButton={false} showMicrochip/>
  <PetCareCard><AppText variant="subtitle">Último turno</AppText>
<QueryState {...appointments}/>{lastAppointment?<><AppText>{lastAppointment.service}</AppText><AppText>{dateTime(lastAppointment.startsAt)}</AppText><AppText muted>Veterinario: {lastAppointment.veterinarian}</AppText></>:<AppText muted>No hay turnos anteriores para esta mascota.</AppText>}</PetCareCard></View>
  <ResponsiveGrid minItemWidth={280} maxColumns={3}><PetCareAction title="Historial médico" icon="medical-outline" onPress={()=>router.push({pathname:'/client/medical-history',params:{petId:id}})}/><PetCareAction title="Vacunas" icon="shield-checkmark-outline" onPress={()=>router.push({pathname:'/client/vaccines',params:{petId:id}})}/><PetCareAction title="Recetas" icon="document-text-outline" onPress={()=>router.push({pathname:'/client/prescriptions',params:{petId:id}})}/><PetCareAction title="Recomendaciones" icon="heart-outline" onPress={()=>router.push({pathname:'/client/recommendations',params:{petId:id}})}/></ResponsiveGrid>
  {isActive===false&&Boolean(query.data.deactivationReason)&&<PetCareCard><AppText variant="subtitle">Motivo de desactivación</AppText><AppText>{query.data.deactivationReason}</AppText>{Boolean(query.data.deactivatedAt)&&<AppText variant="caption" muted>{dateTime(query.data.deactivatedAt!)}</AppText>}</PetCareCard>}
  {isActive===null?<AppText variant="caption" muted>El estado no está disponible; no se puede cambiar hasta recibir un valor válido del servidor.</AppText>:<><View style={desktop?styles.deactivateAction:undefined}><AppButton compact={desktop} label={isActive?'Desactivar mascota':'Reactivar mascota'} variant="secondary" destructive={isActive} onPress={()=>setConfirm(true)}/></View>
  <ConfirmModal visible={confirm} title={isActive?'Desactivar a tu compañero':'Reactivar a tu compañero'} message={isActive?'Sabemos lo importante que es tu mascota para vos. Si necesitás desactivarla de PetCare, vamos a conservar su información de forma segura. No se puede desactivar si tiene turnos pendientes.':'La mascota volverá a aparecer entre tus mascotas activas y podrá volver a usarse en nuevas reservas.'} confirmLabel={isActive?'Desactivar mascota':'Reactivar mascota'} destructive={isActive} onCancel={()=>setConfirm(false)} onConfirm={changePetStatus}/></>}
</>}</PetCareScreen>;}
// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles=StyleSheet.create({overview:{gap:16},overviewDesktop:{flexDirection:'row',alignItems:'flex-start'},deactivateAction:{alignSelf:'flex-start',width:220}});
