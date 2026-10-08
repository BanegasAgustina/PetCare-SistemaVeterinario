/**
 * Permite al CLIENT cambiar la preferencia claro/oscuro/sistema en ThemeContext.
 * Es una configuración visual local: no consulta catálogos ni modifica datos clínicos en la API.
 */
import { useTheme } from '../../../hooks/useTheme';
import { PetCareScreen,PetCareHeader,PetCareCard } from '../../../components/client/PetCareUI';
import { SelectionRow } from '../../../components/ui/SelectionRow';
export default function Appearance(){const {preference,setPreference}=useTheme();return <PetCareScreen><PetCareHeader title="Apariencia" subtitle="PetCare, como te gusta verlo" back/><PetCareCard><SelectionRow label="Usar tema del dispositivo" checked={preference==='system'} onPress={()=>setPreference('system')}/><SelectionRow label="Modo oscuro" checked={preference==='dark'} onPress={()=>setPreference('dark')}/><SelectionRow label="Modo claro" checked={preference==='light'} onPress={()=>setPreference('light')}/></PetCareCard></PetCareScreen>;}
