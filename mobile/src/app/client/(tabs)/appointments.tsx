/**
 * Pantalla de turnos propios para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { useState } from 'react';
import { router } from 'expo-router';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { PetCareScreen,PetCareHeader,PetCareEmptyState,QueryState,ResponsiveGrid } from '../../../components/client/PetCareUI';
import { AppointmentCard } from '../../../components/client/RecordCards';
import { AppButton } from '../../../components/ui/AppButton';
export default function AppointmentsScreen(){const api=useClient();const query=useClientQuery(api.appointments);const [past,setPast]=useState(false);const items=query.data?.filter(a=>past?!a.isUpcoming:a.isUpcoming);return <PetCareScreen><PetCareHeader title="Turnos" subtitle="Tiempo para su bienestar"/><AppButton label="Solicitar turno" onPress={()=>router.push('/client/appointments/request')}/><AppButton label={past?'Ver próximos':'Ver anteriores'} variant="secondary" onPress={()=>setPast(!past)}/><QueryState {...query}/>{items&&(items.length?<ResponsiveGrid>{items.map(a=><AppointmentCard key={a.id} appointment={a} onPress={()=>router.push({pathname:'/client/appointments/[id]',params:{id:a.id}})}/>)}</ResponsiveGrid>:<PetCareEmptyState title={past?'No tenés turnos anteriores':'No tenés próximos turnos'} message={past?'Cuando finalicen tus próximos turnos, los vas a encontrar acá.':'Elegí un horario disponible para cuidar su salud.'} icon="calendar-outline" action={past?undefined:()=>router.push('/client/appointments/request')} label={past?undefined:'Solicitar turno'}/>)}</PetCareScreen>;}
