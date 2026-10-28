// Este archivo se encarga de lo siguiente: Pantalla o navegación del área de clientes; muestra y permite gestionar la información del usuario y sus mascotas.

/**
 * Pantalla de mascotas propias para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { useCallback,useState } from 'react';
import { router } from 'expo-router';
import { Platform,StyleSheet,View,useWindowDimensions } from 'react-native';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { PetCareScreen,PetCareHeader,PetCareEmptyState,QueryState,ResponsiveGrid } from '../../../components/client/PetCareUI';
import { PetCard } from '../../../components/client/RecordCards';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { SelectionRow } from '../../../components/ui/SelectionRow';
import { isWebAtLeast, responsiveLayout } from '../../../constants/responsive';
import { normalizePetActiveFlag } from '../../../utils/pet-status';
// Función PetsScreen: concentra la lógica dentro de este módulo.
export default function PetsScreen(){
 const api=useClient();const {width}=useWindowDimensions();const desktop=isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.tablet);const [showInactive,setShowInactive]=useState(false);
 const query=useClientQuery(useCallback(()=>api.pets(true),[api]));
 const visiblePets=query.data?.filter(pet=>normalizePetActiveFlag(pet.isActive)===!showInactive)??[];
 return <PetCareScreen wide decoration="pets"><PetCareHeader title="Mis mascotas" subtitle="Cada compañía tiene su propia historia"/><View style={[styles.createAction,desktop&&styles.createActionDesktop]}><AppButton compact={desktop} label="Agregar mascota" onPress={()=>router.push('/client/pets/new')}/></View><AppText variant="subtitle">Estado de las mascotas</AppText><View style={styles.filters}><SelectionRow radio label="Activas" checked={!showInactive} onPress={()=>setShowInactive(false)}/><SelectionRow radio label="Inactivas" checked={showInactive} onPress={()=>setShowInactive(true)}/></View>
<QueryState {...query}/>{query.data&&(visiblePets.length?<View style={{gap:12}}><ResponsiveGrid minItemWidth={280} maxColumns={4}>{visiblePets.map(pet=><PetCard key={pet.id} pet={pet} compact portraitSize={desktop?104:76}/>)}</ResponsiveGrid></View>:<PetCareEmptyState title={showInactive?'No tenés mascotas inactivas':'No tenés mascotas activas'} message={showInactive?'Las mascotas desactivadas y su motivo aparecerán acá.':'Agregá una mascota para gestionar sus turnos y cuidados.'} action={!showInactive?()=>router.push('/client/pets/new'):undefined} label={!showInactive?'Agregar mascota':undefined}/>)}</PetCareScreen>;
}
// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles=StyleSheet.create({createActionDesktop:{alignSelf:'flex-start',width:220},createAction:{},filters:{gap:8}});
