/**
 * ARCHIVO: [id].tsx
 * UBICACIÓN: mobile/src/app/client/appointments/[id].tsx
 * FUNCIÓN: Pantalla o ruta de la aplicación.
 * RESPONSABILIDAD: Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de [id].
 * CONEXIONES: Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Detalle de un turno propio; el backend valida la propiedad desde la sesión autenticada. */
import { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { PetCareCard,PetCareHeader,PetCareScreen,QueryState,statusLabel,dateTime } from '../../../components/client/PetCareUI';
import { AppText } from '../../../components/ui/AppText';

// Función ClientAppointmentDetail: concentra la lógica dentro de este módulo.
export default function ClientAppointmentDetail(){const {id}=useLocalSearchParams<{id:string}>();const api=useClient();const query=useClientQuery(useCallback(()=>api.appointment(id),[api,id]));return <PetCareScreen><PetCareHeader title="Detalle del turno" back/>
<QueryState {...query}/>{query.data&&<PetCareCard><AppText variant="subtitle">{query.data.service}</AppText><AppText>{query.data.petName}</AppText><AppText>{dateTime(query.data.startsAt)}</AppText><AppText>Profesional: {query.data.veterinarian}</AppText><AppText>Estado: {statusLabel(query.data.status)}</AppText></PetCareCard>}</PetCareScreen>;}
