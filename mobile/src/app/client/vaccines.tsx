/**
 * ARCHIVO: vaccines.tsx
 * UBICACIÓN: mobile/src/app/client/vaccines.tsx
 * FUNCIÓN: Ruta de lectura de vacunas de las mascotas propias.
 * RESPONSABILIDAD: Configura ClinicalScreen para mostrar vaccines.
 * CONEXIONES: Importa: mobile/src/components/client/ClinicalScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → ClinicalScreen → consulta clínica autenticada con filtro de mascota opcional.
 * IMPORTANCIA: Facilita revisar antecedentes de vacunación desde el área cliente.
 */
/**
 * Pantalla de vacunas para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { ClinicalScreen } from '../../components/client/ClinicalScreen';
/** Configura el componente clínico compartido para vacunas. */
export default function Vaccines(){return <ClinicalScreen kind="vaccines"/>;}
