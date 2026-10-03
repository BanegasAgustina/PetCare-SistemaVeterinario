import { useLocalSearchParams } from 'expo-router';
import { PetEditor } from '../../../../components/client/PetEditor';
export default function EditPet(){const {id}=useLocalSearchParams<{id:string}>();return <PetEditor id={id}/>;}
