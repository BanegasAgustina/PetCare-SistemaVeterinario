import { useCallback,useState } from 'react';
import { router } from 'expo-router';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { useFeedback } from '../../../contexts/FeedbackContext';
import { PetCareScreen,PetCareHeader,PetCareCard,PetCareEmptyState,QueryState,dateTime } from '../../../components/client/PetCareUI';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { FormNotice } from '../../../components/ui/FormNotice';
import { SelectionRow } from '../../../components/ui/SelectionRow';
export default function RequestAppointment(){const api=useClient();const action=useAsyncAction();const {showToast}=useFeedback();
  const [petId,setPet]=useState('');const [specialtyId,setSpecialty]=useState('');const [serviceId,setService]=useState('');const [vetId,setVet]=useState('');const [slotId,setSlot]=useState('');const [error,setError]=useState<string|null>(null);
  const query=useClientQuery(useCallback(async()=>({pets:await api.pets(),catalog:await api.appointmentCatalog()}),[api]));
  const slots=useClientQuery(useCallback(()=>serviceId?api.slots(serviceId,vetId||undefined):Promise.resolve(null),[api,serviceId,vetId]));
  return <PetCareScreen><PetCareHeader title="Solicitar turno" subtitle="Elegí entre los horarios de la clínica" back/><QueryState {...query}/>{query.data&&<>
    {!query.data.pets.length?<PetCareEmptyState title="Primero agregá una mascota" label="Agregar mascota" action={()=>router.push('/client/pets/new')}/>:!query.data.catalog.services.length?<PetCareEmptyState title="No hay servicios disponibles" message="La clínica todavía no tiene servicios activos para reservar." icon="calendar-outline"/>:<>
      <PetCareCard><AppText variant="subtitle">¿Para quién?</AppText>{query.data.pets.map(p=><SelectionRow key={p.id} label={p.name} checked={petId===p.id} disabled={action.loading} onPress={()=>setPet(p.id)}/>)}</PetCareCard>
      {query.data.catalog.specialties.length>0&&<PetCareCard><AppText variant="subtitle">Especialidad</AppText><SelectionRow label="Todas las especialidades" checked={!specialtyId} disabled={action.loading} onPress={()=>{setSpecialty('');setService('');setSlot('');}}/>{query.data.catalog.specialties.map(s=><SelectionRow key={s.id} label={s.name} checked={specialtyId===s.id} disabled={action.loading} onPress={()=>{setSpecialty(s.id);setService('');setSlot('');}}/>)}</PetCareCard>}
      <PetCareCard><AppText variant="subtitle">Servicio</AppText>{query.data.catalog.services.filter(s=>!specialtyId||s.specialtyId===specialtyId).map(s=><SelectionRow key={s.id} label={s.name} checked={serviceId===s.id} disabled={action.loading} onPress={()=>{setService(s.id);setSlot('');}}/>)}</PetCareCard>
      {Boolean(serviceId)&&<><PetCareCard><AppText variant="subtitle">Profesional</AppText><SelectionRow label="Cualquier profesional disponible" checked={!vetId} disabled={action.loading} onPress={()=>{setVet('');setSlot('');}}/>{query.data.catalog.veterinarians.map(v=><SelectionRow key={v.id} label={v.name} checked={vetId===v.id} disabled={action.loading} onPress={()=>{setVet(v.id);setSlot('');}}/>)}</PetCareCard>
      <QueryState {...slots}/>{slots.data&&(slots.data.length?<PetCareCard><AppText variant="subtitle">Horarios disponibles</AppText>{slots.data.map(s=><SelectionRow key={s.id} label={dateTime(s.startsAt)} hint={s.veterinarian} checked={slotId===s.id} disabled={action.loading} onPress={()=>setSlot(s.id)}/>)}</PetCareCard>:<PetCareEmptyState title="No hay horarios disponibles" message="Probá otro profesional o volvé a consultar más adelante." icon="time-outline"/>)}</>}
      <FormNotice error message={error}/><FormNotice error message={action.error}/><AppButton label="Confirmar solicitud" disabled={!slotId||slots.loading} loading={action.loading} onPress={()=>{if(!petId||!slotId){setError('Seleccioná mascota y horario.');return;}setError(null);void action.run(async()=>{await api.requestAppointment(petId,slotId);showToast('Turno solicitado','success');router.replace('/client/appointments');});}}/>
    </>}
  </>}</PetCareScreen>;
}
