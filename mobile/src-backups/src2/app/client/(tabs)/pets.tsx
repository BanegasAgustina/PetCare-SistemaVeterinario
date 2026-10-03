import { router } from 'expo-router';
import { useClient } from '../../../hooks/useClient';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { PetCareScreen,PetCareHeader,PetCareEmptyState,QueryState } from '../../../components/client/PetCareUI';
import { PetCard } from '../../../components/client/RecordCards';
import { AppButton } from '../../../components/ui/AppButton';
export default function PetsScreen(){const api=useClient();const query=useClientQuery(api.pets);return <PetCareScreen><PetCareHeader title="Mis mascotas" subtitle="Cada compañía tiene su propia historia"/><AppButton label="Agregar mascota" onPress={()=>router.push('/client/pets/new')}/><QueryState {...query}/>{query.data&&(!query.data.length?<PetCareEmptyState title="No tenés mascotas todavía" message="Agregá los datos reales de tu mascota para empezar."/>:query.data.map(pet=><PetCard key={pet.id} pet={pet}/>))}</PetCareScreen>;}
