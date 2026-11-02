/**
 * ARCHIVO: appearance.tsx
 * UBICACIÓN: mobile/src/app/client/profile/appearance.tsx
 * FUNCIÓN: Preferencia de tema de la cuenta cliente.
 * RESPONSABILIDAD: Permite elegir tema del dispositivo, oscuro o claro mediante ThemeContext; el estado pertenece a la apariencia local.
 * CONEXIONES: Importa: mobile/src/hooks/useTheme.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/SelectionRow.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Ruta profile/appearance → useTheme → ThemeContext → superficies PetCare observan el tema.
 * IMPORTANCIA: Ajusta contraste y apariencia sin enviar cambios a los datos del perfil/backend.
 */
/**
 * Permite al CLIENT cambiar la preferencia claro/oscuro/sistema en ThemeContext.
 * Es una configuración visual local: no consulta catálogos ni modifica datos clínicos en la API.
 */
import { useTheme } from '../../../hooks/useTheme';
import { PetCareScreen,PetCareHeader,PetCareCard } from '../../../components/client/PetCareUI';
import { SelectionRow } from '../../../components/ui/SelectionRow';
/** Lee preferencia y setter del contexto y presenta las opciones de tema disponibles. */
export default function Appearance(){const {preference,setPreference}=useTheme();return <PetCareScreen><PetCareHeader title="Tema" subtitle="Elegí cómo se ve PetCare" back/><PetCareCard><SelectionRow label="Usar tema del dispositivo" checked={preference==='system'} onPress={()=>setPreference('system')}/><SelectionRow label="Modo oscuro" checked={preference==='dark'} onPress={()=>setPreference('dark')}/><SelectionRow label="Modo claro" checked={preference==='light'} onPress={()=>setPreference('light')}/></PetCareCard></PetCareScreen>;}
