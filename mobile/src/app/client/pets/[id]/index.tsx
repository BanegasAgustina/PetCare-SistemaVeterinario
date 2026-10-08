/**
 * Pantalla de inicio del panel para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { useCallback,useState } from 'react';
import { router,useLocalSearchParams } from 'expo-router';
import { useClient } from '../../../../hooks/useClient';
import { useClientQuery } from '../../../../hooks/useClientQuery';
import { useFeedback } from '../../../../contexts/FeedbackContext';
import { PetCareScreen,PetCareHeader,PetCareCard,PetCareAction,PetImage,QueryState } from '../../../../components/client/PetCareUI';
import { AppText } from '../../../../components/ui/AppText';
import { AppButton } from '../../../../components/ui/AppButton';
import { ConfirmModal } from '../../../../components/ui/ConfirmModal';
export default function PetDetail(){const {id}=useLocalSearchParams<{id:string}>();const api=useClient();const query=useClientQuery(useCallback(()=>api.pet(id),[api,id]));const [confirm,setConfirm]=useState(false);const {showToast}=useFeedback();return <PetCareScreen><PetCareHeader title={query.data?.name??'Ficha de mascota'} back/><QueryState {...query}/>{query.data&&<><PetCareCard><PetImage uri={query.data.photoUrl}/><AppText variant="subtitle">Información</AppText><AppText>{query.data.species}{query.data.breed?` · ${query.data.breed}`:''}</AppText>{query.data.birthDate&&<AppText>Nacimiento: {new Date(query.data.birthDate+'T12:00:00').toLocaleDateString('es-AR')}</AppText>}{query.data.weightKg&&<AppText>Peso: {query.data.weightKg} kg</AppText>}{query.data.microchipNumber&&<AppText>Microchip: {query.data.microchipNumber}</AppText>}</PetCareCard>
  <AppButton label="Editar datos" onPress={()=>router.push({pathname:'/client/pets/[id]/edit',params:{id}})}/>
  <PetCareAction title="Historial médico" icon="medical-outline" onPress={()=>router.push({pathname:'/client/medical-history',params:{petId:id}})}/><PetCareAction title="Vacunas" icon="shield-checkmark-outline" onPress={()=>router.push({pathname:'/client/vaccines',params:{petId:id}})}/><PetCareAction title="Recetas" icon="document-text-outline" onPress={()=>router.push({pathname:'/client/prescriptions',params:{petId:id}})}/><PetCareAction title="Recomendaciones" icon="heart-outline" onPress={()=>router.push({pathname:'/client/recommendations',params:{petId:id}})}/>
  <AppButton label="Desactivar mascota" variant="secondary" destructive onPress={()=>setConfirm(true)}/>
  <ConfirmModal visible={confirm} title="Desactivar mascota" message="La mascota dejará de aparecer en tu lista activa. Su historia se conserva. No se puede desactivar si tiene turnos pendientes." confirmLabel="Desactivar" destructive onCancel={()=>setConfirm(false)} onConfirm={async()=>{await api.deactivatePet(id);setConfirm(false);showToast('Mascota desactivada','success');router.replace('/client/pets');}}/>
</>}</PetCareScreen>;}
