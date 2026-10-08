/**
 * Muestra el turno identificado por parámetros de ruta y permite cambios autorizados. Usa /clinic/appointments; el backend controla estados, permisos y disponibilidad bajo locks.
 */
import { useCallback,useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useClinic } from '../../hooks/useClinic';
import { useAuth } from '../../hooks/useAuth';
import { useClientQuery } from '../../hooks/useClientQuery';
import { PetCareScreen,PetCareHeader,PetCareCard,QueryState,statusLabel } from '../client/PetCareUI';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { SelectionRow } from '../ui/SelectionRow';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useFeedback } from '../../contexts/FeedbackContext';
import { clinicDateTime } from '../../utils/clinic-date';
export function AppointmentScreen(){const {id}=useLocalSearchParams<{id:string}>();const api=useClinic();const {hasPermission}=useAuth();const query=useClientQuery(useCallback(()=>api.appointment(id),[api,id]));const [next,setNext]=useState<string|null>(null);const [slot,setSlot]=useState('');const [professional,setProfessional]=useState('');const catalog=useClientQuery(api.catalog);const slots=useClientQuery(useCallback(()=>query.data&&hasPermission('appointments.manage')?api.slots(String(query.data.serviceId),professional||undefined):Promise.resolve(null),[api,query.data,professional,hasPermission]));const {showToast}=useFeedback();
 const transitions:Record<string,string[]>={REQUESTED:['CONFIRMED','CANCELLED'],CONFIRMED:['IN_PROGRESS','CANCELLED'],IN_PROGRESS:['COMPLETED','CANCELLED']};
 return <PetCareScreen><PetCareHeader title="Detalle del turno" back/><QueryState {...query}/>{query.data&&<><PetCareCard><AppText variant="subtitle">{String(query.data.petName)}</AppText><AppText>{String(query.data.service)}</AppText><AppText>{String(query.data.veterinarian)}</AppText><AppText>{clinicDateTime(String(query.data.startsAt))}</AppText><AppText>{statusLabel(String(query.data.status))}</AppText></PetCareCard>{(hasPermission('appointments.manage')||hasPermission('appointments.update_own'))&&(transitions[String(query.data.status)]??[]).filter(s=>hasPermission('appointments.manage')||s!=='CONFIRMED').map(s=><AppButton key={s} label={statusLabel(s)} onPress={()=>setNext(s)}/>)}
 {hasPermission('appointments.manage')&&!['COMPLETED','CANCELLED'].includes(String(query.data.status))&&<><PetCareCard><AppText variant="subtitle">Reprogramar / asignar profesional</AppText><QueryState {...catalog}/>{catalog.data?.professionals.filter(p=>catalog.data?.assignments.some(a=>a.professionalId===p.id&&a.serviceId===query.data?.serviceId)).map(p=><SelectionRow key={p.id} label={String(p.name)} checked={professional===p.id} onPress={()=>{setProfessional(p.id);setSlot('');}}/>)}</PetCareCard><QueryState {...slots}/>{slots.data&&<PetCareCard>{slots.data.map(s=><SelectionRow key={s.id} label={clinicDateTime(s.startsAt)} hint={s.veterinarian} checked={slot===s.id} onPress={()=>setSlot(s.id)}/>)}</PetCareCard>}<AppButton label="Confirmar nuevo horario" disabled={!slot} onPress={()=>setNext('reschedule')}/></>}
 </>}<ConfirmModal visible={Boolean(next)} title="Actualizar turno" message={next==='reschedule'?'Se guardará el nuevo horario y profesional.':'El nuevo estado se reflejará en Cliente y en la agenda profesional.'} destructive={next==='CANCELLED'} confirmLabel="Confirmar" onCancel={()=>setNext(null)} onConfirm={async()=>{await api.changeAppointment(id,next==='reschedule'?{slotId:slot}:{status:next});setNext(null);setSlot('');showToast('Turno actualizado','success');query.reload();}}/></PetCareScreen>;
}
