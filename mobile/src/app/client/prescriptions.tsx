/**
 * ARCHIVO: prescriptions.tsx
 * UBICACIÓN: mobile/src/app/client/prescriptions.tsx
 * FUNCIÓN: Ruta de lectura de recetas propias.
 * RESPONSABILIDAD: Configura ClinicalScreen para mostrar prescriptions.
 * CONEXIONES: Importa: mobile/src/components/client/ClinicalScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → ClinicalScreen → cliente consulta registros clínicos autorizados.
 * IMPORTANCIA: Reutiliza presentación y limita los registros al usuario/mascota elegidos.
 */
/**
 * Pantalla de recetas para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { ClinicalScreen } from '../../components/client/ClinicalScreen';
/** Configura el componente clínico compartido para recetas. */
export default function Prescriptions(){return <ClinicalScreen kind="prescriptions"/>;}
