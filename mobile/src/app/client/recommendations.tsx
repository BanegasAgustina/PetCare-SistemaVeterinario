/**
 * ARCHIVO: recommendations.tsx
 * UBICACIÓN: mobile/src/app/client/recommendations.tsx
 * FUNCIÓN: Ruta de lectura de recomendaciones clínicas propias.
 * RESPONSABILIDAD: Configura ClinicalScreen para mostrar recommendations.
 * CONEXIONES: Importa: mobile/src/components/client/ClinicalScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → ClinicalScreen → consultas de registros clínicos de cliente.
 * IMPORTANCIA: Agrupa el tipo de registro con la pantalla compartida.
 */
/**
 * Pantalla de recomendaciones clínicas para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { ClinicalScreen } from '../../components/client/ClinicalScreen';
/** Configura el componente clínico compartido para recomendaciones. */
export default function Recommendations(){return <ClinicalScreen kind="recommendations"/>;}
