// Este archivo se encarga de lo siguiente: Pantalla o navegación del área de clientes; muestra y permite gestionar la información del usuario y sus mascotas.

/**
 * Permite al CLIENT cambiar la preferencia claro/oscuro/sistema en ThemeContext.
 * Es una configuración visual local: no consulta catálogos ni modifica datos clínicos en la API.
 */
import { useTheme } from '../../../hooks/useTheme';
import { PetCareScreen,PetCareHeader,PetCareCard } from '../../../components/client/PetCareUI';
import { SelectionRow } from '../../../components/ui/SelectionRow';
// Función Appearance: concentra la lógica dentro de este módulo.
export default function Appearance(){const {preference,setPreference}=useTheme();return <PetCareScreen><PetCareHeader title="Tema" subtitle="Elegí cómo se ve PetCare" back/><PetCareCard><SelectionRow label="Usar tema del dispositivo" checked={preference==='system'} onPress={()=>setPreference('system')}/><SelectionRow label="Modo oscuro" checked={preference==='dark'} onPress={()=>setPreference('dark')}/><SelectionRow label="Modo claro" checked={preference==='light'} onPress={()=>setPreference('light')}/></PetCareCard></PetCareScreen>;}
