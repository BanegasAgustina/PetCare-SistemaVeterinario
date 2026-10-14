/**
 * Pantalla de mascotas propias para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { router } from 'expo-router';
import { ScrollView,View } from 'react-native';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { PetCareScreen,PetCareHeader,PetCareCard,PetCareEmptyState,QueryState,PetImage } from '../../../components/client/PetCareUI';
import { clinicDate } from '../../../utils/clinic-date';
import { PetCard } from '../../../components/client/RecordCards';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
export default function PetsScreen(){const api=useClient();const query=useClientQuery(api.pets);return <PetCareScreen><PetCareHeader title="Mis mascotas" subtitle="Cada compañía tiene su propia historia"/><AppButton label="Agregar mascota" onPress={()=>router.push('/client/pets/new')}/><QueryState {...query}/>{query.data&&(!query.data.length?<PetCareEmptyState title="No tenés mascotas todavía" message="Agregá los datos reales de tu mascota para empezar."/>:query.data.length===1?<PetCard pet={query.data[0]}/>:<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:14,paddingRight:16}}>{query.data.map(pet=><View key={pet.id} style={{width:260}}><PetCareCard><PetImage uri={pet.photoUrl}/><AppText variant="subtitle">{pet.name}</AppText><AppText muted>{pet.species}{pet.breed?` · ${pet.breed}`:''}</AppText>{pet.birthDate&&<AppText variant="caption" muted>Nació el {clinicDate(pet.birthDate)}</AppText>}{pet.weightKg&&<AppText variant="caption">{pet.weightKg} kg</AppText>}<AppButton label="Ver ficha" variant="secondary" onPress={()=>router.push({pathname:'/client/pets/[id]',params:{id:pet.id}})}/></PetCareCard></View>)}</ScrollView>)}</PetCareScreen>;}
