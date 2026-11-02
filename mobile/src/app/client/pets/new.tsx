/**
 * ARCHIVO: new.tsx
 * UBICACIÓN: mobile/src/app/client/pets/new.tsx
 * FUNCIÓN: Ruta para crear una mascota del cliente.
 * RESPONSABILIDAD: Renderiza PetEditor sin ID, modo de alta.
 * CONEXIONES: Importa: mobile/src/components/client/PetEditor.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → PetEditor → catálogo y servicio de cliente → backend crea mascota con titular del JWT.
 * IMPORTANCIA: Comparte validación y persistencia del alta con el editor de mascotas.
 */
/**
 * Ruta de alta de mascota para CLIENT: renderiza PetEditor sin id.
 * El formulario carga catálogos reales y envía POST /client/pets; backend obtiene propietario del JWT.
 */
import { PetEditor } from '../../../components/client/PetEditor';
/** Monta el editor compartido en modo creación. */
export default function AddPet(){return <PetEditor/>;}
