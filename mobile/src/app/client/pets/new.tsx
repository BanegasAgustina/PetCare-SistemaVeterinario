// Este archivo se encarga de lo siguiente: Pantalla o navegación del área de clientes; muestra y permite gestionar la información del usuario y sus mascotas.

/**
 * Ruta de alta de mascota para CLIENT: renderiza PetEditor sin id.
 * El formulario carga catálogos reales y envía POST /client/pets; backend obtiene propietario del JWT.
 */
import { PetEditor } from '../../../components/client/PetEditor';
// Función AddPet: crea un registro o inicia una operación dentro de este módulo.
export default function AddPet(){return <PetEditor/>;}
