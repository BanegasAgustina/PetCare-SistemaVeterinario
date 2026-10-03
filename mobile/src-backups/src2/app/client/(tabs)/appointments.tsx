import { useState } from 'react';
import { router } from 'expo-router';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { PetCareScreen,PetCareHeader,PetCareEmptyState,QueryState } from '../../../components/client/PetCareUI';
import { AppointmentCard } from '../../../components/client/RecordCards';
import { AppButton } from '../../../components/ui/AppButton';
export default function AppointmentsScreen(){const api=useClient();const query=useClientQuery(api.appointments);const [past,setPast]=useState(false);const items=query.data?.filter(a=>past?!a.isUpcoming:a.isUpcoming);return <PetCareScreen><PetCareHeader title="Turnos" subtitle="Tiempo para su bienestar"/><AppButton label="Solicitar turno" onPress={()=>router.push('/client/appointments/request')}/><AppButton label={past?'Ver próximos':'Ver anteriores'} variant="secondary" onPress={()=>setPast(!past)}/><QueryState {...query}/>{items&&(items.length?items.map(a=><AppointmentCard key={a.id} appointment={a}/>):<PetCareEmptyState title={past?'No tenés turnos anteriores':'No tenés próximos turnos'} icon="calendar-outline"/>)}</PetCareScreen>;}
