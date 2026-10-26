/**
 * Pantalla de mascotas propias para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { useCallback } from 'react';
import { router } from 'expo-router';
import { Platform,View,useWindowDimensions } from 'react-native';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { PetCareScreen,PetCareHeader,PetCareEmptyState,QueryState,ResponsiveGrid } from '../../../components/client/PetCareUI';
import { PetCard } from '../../../components/client/RecordCards';
import { AppButton } from '../../../components/ui/AppButton';
import { isWebAtLeast, responsiveLayout } from '../../../constants/responsive';
export default function PetsScreen(){
 const api=useClient();const {width}=useWindowDimensions();const desktop=isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.tablet);
 const query=useClientQuery(useCallback(()=>api.pets(),[api]));
 return <PetCareScreen decoration="pets"><PetCareHeader title="Mis mascotas" subtitle="Cada compañía tiene su propia historia"/><AppButton label="Agregar mascota" onPress={()=>router.push('/client/pets/new')}/><QueryState {...query}/>{query.data&&(query.data.length?<View style={{gap:12}}><ResponsiveGrid>{query.data.map(pet=><PetCard key={pet.id} pet={pet} compact portraitSize={desktop?88:76}/>)}</ResponsiveGrid></View>:<PetCareEmptyState title="No tenés mascotas activas" message="Agregá una mascota para gestionar sus turnos y cuidados." action={()=>router.push('/client/pets/new')} label="Agregar mascota"/>)}</PetCareScreen>;
}
