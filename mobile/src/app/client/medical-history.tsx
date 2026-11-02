/**
 * ARCHIVO: medical-history.tsx
 * UBICACIÓN: mobile/src/app/client/medical-history.tsx
 * FUNCIÓN: Ruta de lectura de historia clínica propia.
 * RESPONSABILIDAD: Configura ClinicalScreen para mostrar medical-history.
 * CONEXIONES: Importa: mobile/src/components/client/ClinicalScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → ClinicalScreen(kind) → consulta cliente autenticada y datos del backend.
 * IMPORTANCIA: Reutiliza presentación clínica y conserva el filtro por tipo.
 */
/**
 * Pantalla de historia clínica para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { ClinicalScreen } from '../../components/client/ClinicalScreen';
/** Configura el componente clínico compartido para historia médica. */
export default function History(){return <ClinicalScreen kind="medical-history"/>;}
