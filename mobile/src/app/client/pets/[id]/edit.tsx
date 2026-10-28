// Este archivo se encarga de lo siguiente: Pantalla o navegación del área de clientes; muestra y permite gestionar la información del usuario y sus mascotas.

/**
 * Ruta de edición de mascota del CLIENT. Lee id del enlace y lo pasa a PetEditor.
 * PetEditor consulta /client/pets/:id y guarda por PUT; el backend verifica propietario desde JWT.
 */
import { useLocalSearchParams } from 'expo-router';
import { PetEditor } from '../../../../components/client/PetEditor';
// Función EditPet: actualiza o guarda información dentro de este módulo.
export default function EditPet(){const {id}=useLocalSearchParams<{id:string}>();return <PetEditor id={id}/>;}
