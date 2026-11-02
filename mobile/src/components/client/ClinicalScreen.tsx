/**
 * ARCHIVO: ClinicalScreen.tsx
 * UBICACIÓN: mobile/src/components/client/ClinicalScreen.tsx
 * FUNCIÓN: Presenta registros clínicos del tipo seleccionado para mascotas del usuario.
 * RESPONSABILIDAD: Listar vacunas, recetas, recomendaciones o historia clínica consultada desde el servicio cliente.
 * CONEXIONES: Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/RecordCards.tsx, mobile/src/components/ui/SelectionRow.tsx, mobile/src/types/client.ts Se utiliza desde: mobile/src/app/client/medical-history.tsx, mobile/src/app/client/prescriptions.tsx, mobile/src/app/client/recommendations.tsx, mobile/src/app/client/vaccines.tsx
 * FUNCIONAMIENTO: Usa kind para cargar el endpoint y petId opcional de la ruta como filtro; muestra estado vacío, carga y tarjetas especializadas.
 * IMPORTANCIA: Permite revisar en una interfaz común el historial clínico vinculado al dueño autenticado.
 */
/**
 * Muestra registros clínicos del tipo recibido en kind para mascotas del cliente. Consulta clientService y diferencia carga, error y resultado vacío; nunca permite editar información clínica como cliente.
 */
import { useCallback,useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useClient } from '../../hooks/useClient';
import { useClientQuery } from '../../hooks/useClientQuery';
import { PetCareScreen,PetCareHeader,PetCareCard,PetCareEmptyState,QueryState,ResponsiveGrid,type IconName } from './PetCareUI';
import { MedicalRecordCard,VaccineCard,PrescriptionCard,RecommendationCard } from './RecordCards';
import { SelectionRow } from '../ui/SelectionRow';
import type { ClinicalKind } from '../../types/client';
// Configuración copy: reúne valores o reglas que consume el resto del módulo.
const copy:Record<ClinicalKind,{title:string;empty:string;icon:IconName}>={
  'medical-history':{title:'Historial médico',empty:'Todavía no hay registros médicos.',icon:'medical-outline'},
  vaccines:{title:'Vacunas',empty:'No hay vacunas registradas',icon:'shield-checkmark-outline'},
  prescriptions:{title:'Recetas',empty:'No hay recetas disponibles',icon:'document-text-outline'},
  recommendations:{title:'Recomendaciones',empty:'No hay recomendaciones por el momento',icon:'heart-outline'},
};
/** Carga y presenta el historial del tipo clínico seleccionado. */
export function ClinicalScreen({kind}:{kind:ClinicalKind}){const {petId:initial}=useLocalSearchParams<{petId?:string}>();const [petId,setPet]=useState(initial??'');const api=useClient();
  const pets=useClientQuery(api.pets);const query=useClientQuery(useCallback(()=>api.clinical(kind,petId||undefined),[api,kind,petId]));const text=copy[kind];const Card=kind==='vaccines'?VaccineCard:kind==='prescriptions'?PrescriptionCard:kind==='recommendations'?RecommendationCard:MedicalRecordCard;
  return <PetCareScreen><PetCareHeader title={text.title} subtitle="Información registrada por la clínica" back/>
<QueryState {...pets}/>{pets.data&&pets.data.length>0&&<PetCareCard><SelectionRow label="Todas mis mascotas" checked={!petId} onPress={()=>setPet('')}/>{pets.data.map(p=><SelectionRow key={p.id} label={p.name} checked={petId===p.id} onPress={()=>setPet(p.id)}/>)}</PetCareCard>}
<QueryState {...query}/>{query.data&&(query.data.length?<ResponsiveGrid>{query.data.map(record=><Card key={record.id} record={record}/>)}</ResponsiveGrid>:<PetCareEmptyState title={text.empty} message="Los registros aparecerán cuando la clínica los haya guardado." icon={text.icon}/>)}</PetCareScreen>;
}
