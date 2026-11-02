/**
 * ARCHIVO: [id].tsx
 * UBICACIÓN: mobile/src/app/client/appointments/[id].tsx
 * FUNCIÓN: Detalle de un turno perteneciente al cliente autenticado.
 * RESPONSABILIDAD: Lee el identificador de ruta y consulta una única cita; muestra sus datos según estado devuelto.
 * CONEXIONES: Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → useClient appointment query → client API/backend valida ownership.
 * IMPORTANCIA: Permite revisar turno propio sin aceptar identidad desde parámetros.
 */
/** Detalle de un turno propio; el backend valida la propiedad desde la sesión autenticada. */
import { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { PetCareCard,PetCareHeader,PetCareScreen,QueryState,statusLabel,dateTime } from '../../../components/client/PetCareUI';
import { AppText } from '../../../components/ui/AppText';

/** Carga y presenta el turno identificado por la ruta mediante consulta autenticada. */
export default function ClientAppointmentDetail(){const {id}=useLocalSearchParams<{id:string}>();const api=useClient();const query=useClientQuery(useCallback(()=>api.appointment(id),[api,id]));return <PetCareScreen><PetCareHeader title="Detalle del turno" back/>
<QueryState {...query}/>{query.data&&<PetCareCard><AppText variant="subtitle">{query.data.service}</AppText><AppText>{query.data.petName}</AppText><AppText>{dateTime(query.data.startsAt)}</AppText><AppText>Profesional: {query.data.veterinarian}</AppText><AppText>Estado: {statusLabel(query.data.status)}</AppText></PetCareCard>}</PetCareScreen>;}
