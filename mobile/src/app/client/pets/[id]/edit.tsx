/**
 * ARCHIVO: edit.tsx
 * UBICACIÓN: mobile/src/app/client/pets/[id]/edit.tsx
 * FUNCIÓN: Ruta de edición de una mascota propia.
 * RESPONSABILIDAD: Lee ID de ruta y configura PetEditor para cargar/guardar la mascota existente.
 * CONEXIONES: Importa: mobile/src/components/client/PetEditor.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → PetEditor(id) → client API; el backend deriva titular desde la sesión.
 * IMPORTANCIA: Reutiliza validaciones e imágenes del editor común y protege propiedad en backend.
 */
/**
 * Ruta de edición de mascota del CLIENT. Lee id del enlace y lo pasa a PetEditor.
 * PetEditor consulta /client/pets/:id y guarda por PUT; el backend verifica propietario desde JWT.
 */
import { useLocalSearchParams } from 'expo-router';
import { PetEditor } from '../../../../components/client/PetEditor';
/** Lee ID dinámico y pasa el valor al editor compartido en modo edición. */
export default function EditPet(){const {id}=useLocalSearchParams<{id:string}>();return <PetEditor id={id}/>;}
