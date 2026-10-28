// Este archivo se encarga de lo siguiente: Pantalla o navegación del área de clientes; muestra y permite gestionar la información del usuario y sus mascotas.

/**
 * Pantalla de turnos propios para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { useCallback,useState } from 'react';
import { router } from 'expo-router';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { useFeedback } from '../../../contexts/FeedbackContext';
import { PetCareScreen,PetCareHeader,PetCareEmptyState,PetCareCard,PetCareBadge,QueryState,ResponsiveGrid,statusLabel,dateTime } from '../../../components/client/PetCareUI';
import { AppointmentCard } from '../../../components/client/RecordCards';
import { AppButton } from '../../../components/ui/AppButton';
import { AppModal } from '../../../components/ui/AppModal';
import { AppInput } from '../../../components/forms/AppInput';
import { AppText } from '../../../components/ui/AppText';
import { FormNotice } from '../../../components/ui/FormNotice';
// Función AppointmentsScreen: concentra la lógica dentro de este módulo.
export default function AppointmentsScreen(){
 const api=useClient();const query=useClientQuery(api.appointments);const [past,setPast]=useState(false),[selectedId,setSelectedId]=useState(''),[confirmingCancel,setConfirmingCancel]=useState(false),[reason,setReason]=useState(''),[reasonError,setReasonError]=useState('');const action=useAsyncAction();const {showToast}=useFeedback();
 const detail=useClientQuery(useCallback(()=>selectedId?api.appointment(selectedId):Promise.resolve(null),[api,selectedId]));
 const items=query.data?.filter(a=>past?!a.isUpcoming:a.isUpcoming);
 // Función cancel: elimina, revoca o cancela una operación dentro de este módulo.
async function cancel(){const clean=reason.trim();if(clean.length<3){setReasonError('Escribí un motivo de al menos 3 caracteres.');return;}setReasonError('');const saved=await action.run(()=>api.cancelAppointment(selectedId,clean));if(saved){setConfirmingCancel(false);setSelectedId('');setReason('');query.reload();showToast('Turno cancelado','success');}}
 const canCancel=Boolean(detail.data&&detail.data.isUpcoming&&['REQUESTED','CONFIRMED'].includes(detail.data.status));
 return <PetCareScreen><PetCareHeader title="Turnos" subtitle="Tiempo para su bienestar"/><AppButton label="Solicitar turno" onPress={()=>router.push('/client/appointments/request')}/><AppButton label={past?'Ver próximos':'Ver anteriores'} variant="secondary" onPress={()=>setPast(!past)}/>
<QueryState {...query}/>{items&&(items.length?<ResponsiveGrid>{items.map(a=><AppointmentCard key={a.id} appointment={a} onPress={()=>{setSelectedId(a.id);setConfirmingCancel(false);setReason('');}}/>)}</ResponsiveGrid>:<PetCareEmptyState title={past?'No tenés turnos anteriores':'No tenés próximos turnos'} message={past?'Cuando finalicen tus próximos turnos, los vas a encontrar acá.':'Elegí un horario disponible para cuidar su salud.'} icon="calendar-outline" action={past?undefined:()=>router.push('/client/appointments/request')} label={past?undefined:'Solicitar turno'}/>)}
 <AppModal visible={Boolean(selectedId)} dismissible onClose={()=>{setSelectedId('');setConfirmingCancel(false);}}>
  <AppText variant="title">{confirmingCancel?'Confirmar cancelación':'Detalle del turno'}</AppText>
<QueryState {...detail}/>
  {detail.data&&!confirmingCancel&&<><PetCareCard><PetCareBadge label={statusLabel(detail.data.status)}/><AppText variant="subtitle">{detail.data.petName}</AppText><AppText>Profesional: {detail.data.veterinarian}</AppText><AppText>Servicio: {detail.data.service}</AppText><AppText>Fecha y hora: {dateTime(detail.data.startsAt)}</AppText>{Boolean(detail.data.observations)&&<AppText>Observaciones: {detail.data.observations}</AppText>}{Boolean(detail.data.cancellationReason)&&<AppText>Motivo de cancelación: {detail.data.cancellationReason}</AppText>}</PetCareCard>{canCancel&&<AppButton label="Cancelar turno" destructive onPress={()=>setConfirmingCancel(true)}/>}</>}
  {detail.data&&confirmingCancel&&<><AppText muted>Vas a cancelar el turno de {detail.data.petName} para {detail.data.service}. Indicá el motivo para confirmar; la clínica recibirá esta información.</AppText><AppInput label="Motivo de cancelación" required multiline maxLength={500} value={reason} error={reasonError} editable={!action.loading} onChangeText={value=>{setReason(value);setReasonError('');}}/><FormNotice error message={action.error}/><AppButton label="Confirmar cancelación" destructive loading={action.loading} onPress={()=>void cancel()}/><AppButton label="Volver al detalle" variant="secondary" disabled={action.loading} onPress={()=>setConfirmingCancel(false)}/></>}
  {!confirmingCancel&&<AppButton label="Cerrar" variant="secondary" onPress={()=>setSelectedId('')}/>}
 </AppModal></PetCareScreen>;
}
