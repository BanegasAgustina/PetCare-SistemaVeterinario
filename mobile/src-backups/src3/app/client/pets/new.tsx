/**
 * Ruta de alta de mascota para CLIENT: renderiza PetEditor sin id.
 * El formulario carga catálogos reales y envía POST /client/pets; backend obtiene propietario del JWT.
 */
import { PetEditor } from '../../../components/client/PetEditor';
export default function AddPet(){return <PetEditor/>;}
