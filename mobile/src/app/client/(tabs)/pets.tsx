/**
 * Pantalla de mascotas propias para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { useCallback,useState } from 'react';
import { router } from 'expo-router';
import { Platform,View,useWindowDimensions } from 'react-native';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { PetCareScreen,PetCareHeader,PetCareEmptyState,PetCareCard,QueryState,ResponsiveGrid } from '../../../components/client/PetCareUI';
import { PetCard } from '../../../components/client/RecordCards';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { isWebAtLeast, responsiveLayout } from '../../../constants/responsive';
export default function PetsScreen(){
 const api=useClient();const {width}=useWindowDimensions();const desktop=isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.tablet);
 const [includeInactive,setIncludeInactive]=useState(false),[restoreId,setRestoreId]=useState(''),[actionError,setActionError]=useState(''),[loading,setLoading]=useState(false);
 const query=useClientQuery(useCallback(()=>api.pets(includeInactive),[api,includeInactive]));
 const activePets=query.data?.filter(pet=>pet.isActive!==false)??[];const inactivePets=query.data?.filter(pet=>pet.isActive===false)??[];
 async function reactivate(){if(!restoreId||loading)return;setLoading(true);setActionError('');try{await api.reactivatePet(restoreId);setRestoreId('');query.reload();}catch(error){setActionError(error instanceof Error?error.message:'No se pudo reactivar la mascota.');}finally{setLoading(false);}}
 return <PetCareScreen><PetCareHeader title="Mis mascotas" subtitle="Cada compañía tiene su propia historia"/><AppButton label="Agregar mascota" onPress={()=>router.push('/client/pets/new')}/><AppButton label={includeInactive?'Ocultar mascotas inactivas':'Ver mascotas inactivas'} variant="secondary" onPress={()=>setIncludeInactive(value=>!value)}/><QueryState {...query}/>{activePets.length?<View style={{gap:12}}><ResponsiveGrid>{activePets.map(pet=><PetCard key={pet.id} pet={pet} compact portraitSize={desktop?88:76}/>)}</ResponsiveGrid></View>:<PetCareEmptyState title="No tenés mascotas activas" message="Agregá una mascota o revisá las mascotas inactivas."/>}{includeInactive&&Boolean(inactivePets.length)&&<View style={{gap:12}}><ResponsiveGrid>{inactivePets.map(pet=><PetCareCard key={pet.id}><PetCareHeader title={pet.name} subtitle={`${pet.species}${pet.breed?` · ${pet.breed}`:''} · Inactiva`}/><AppButton label="Reactivar mascota" onPress={()=>{setActionError('');setRestoreId(pet.id);}}/></PetCareCard>)}</ResponsiveGrid></View>}<ConfirmModal visible={Boolean(restoreId)} title="Reactivar mascota" message="La mascota volverá a aparecer entre tus pacientes activos. Su historia y datos guardados se conservarán." confirmLabel="Reactivar" onCancel={()=>setRestoreId('')} onConfirm={reactivate}/>{Boolean(actionError)&&<PetCareCard><AppText accessibilityRole="alert">{actionError}</AppText></PetCareCard>}</PetCareScreen>;
}
