import { useCallback,useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useClient } from '../../hooks/useClient';
import { useClientQuery } from '../../hooks/useClientQuery';
import { PetCareScreen,PetCareHeader,PetCareCard,PetCareEmptyState,QueryState,type IconName } from './PetCareUI';
import { MedicalRecordCard,VaccineCard,PrescriptionCard,RecommendationCard } from './RecordCards';
import { SelectionRow } from '../ui/SelectionRow';
import type { ClinicalKind } from '../../types/client';
const copy:Record<ClinicalKind,{title:string;empty:string;icon:IconName}>={
  'medical-history':{title:'Historial médico',empty:'Todavía no hay registros médicos.',icon:'medical-outline'},
  vaccines:{title:'Vacunas',empty:'No hay vacunas registradas',icon:'shield-checkmark-outline'},
  prescriptions:{title:'Recetas',empty:'No hay recetas disponibles',icon:'document-text-outline'},
  recommendations:{title:'Recomendaciones',empty:'No hay recomendaciones por el momento',icon:'heart-outline'},
};
export function ClinicalScreen({kind}:{kind:ClinicalKind}){const {petId:initial}=useLocalSearchParams<{petId?:string}>();const [petId,setPet]=useState(initial??'');const api=useClient();
  const pets=useClientQuery(api.pets);const query=useClientQuery(useCallback(()=>api.clinical(kind,petId||undefined),[api,kind,petId]));const text=copy[kind];const Card=kind==='vaccines'?VaccineCard:kind==='prescriptions'?PrescriptionCard:kind==='recommendations'?RecommendationCard:MedicalRecordCard;
  return <PetCareScreen><PetCareHeader title={text.title} subtitle="Información registrada por la clínica" back/><QueryState {...pets}/>{pets.data&&pets.data.length>0&&<PetCareCard><SelectionRow label="Todas mis mascotas" checked={!petId} onPress={()=>setPet('')}/>{pets.data.map(p=><SelectionRow key={p.id} label={p.name} checked={petId===p.id} onPress={()=>setPet(p.id)}/>)}</PetCareCard>}<QueryState {...query}/>{query.data&&(query.data.length?query.data.map(record=><Card key={record.id} record={record}/>):<PetCareEmptyState title={text.empty} message="Los registros aparecerán cuando la clínica los haya guardado." icon={text.icon}/>)}</PetCareScreen>;
}
