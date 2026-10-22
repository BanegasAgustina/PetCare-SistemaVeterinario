/** Detalle de un turno propio; el backend valida la propiedad desde la sesión autenticada. */
import { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { PetCareCard,PetCareHeader,PetCareScreen,QueryState,statusLabel,dateTime } from '../../../components/client/PetCareUI';
import { AppText } from '../../../components/ui/AppText';

export default function ClientAppointmentDetail(){const {id}=useLocalSearchParams<{id:string}>();const api=useClient();const query=useClientQuery(useCallback(()=>api.appointment(id),[api,id]));return <PetCareScreen><PetCareHeader title="Detalle del turno" back/><QueryState {...query}/>{query.data&&<PetCareCard><AppText variant="subtitle">{query.data.service}</AppText><AppText>{query.data.petName}</AppText><AppText>{dateTime(query.data.startsAt)}</AppText><AppText>Profesional: {query.data.veterinarian}</AppText><AppText>Estado: {statusLabel(query.data.status)}</AppText></PetCareCard>}</PetCareScreen>;}
