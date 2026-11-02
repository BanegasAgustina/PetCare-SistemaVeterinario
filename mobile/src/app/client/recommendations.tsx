/**
 * ARCHIVO: recommendations.tsx
 * UBICACIÓN: mobile/src/app/client/recommendations.tsx
 * FUNCIÓN: Pantalla o ruta de la aplicación.
 * RESPONSABILIDAD: Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de recommendations.
 * CONEXIONES: Importa: mobile/src/components/client/ClinicalScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/**
 * Pantalla de recomendaciones clínicas para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { ClinicalScreen } from '../../components/client/ClinicalScreen';
// Función Recommendations: concentra la lógica dentro de este módulo.
export default function Recommendations(){return <ClinicalScreen kind="recommendations"/>;}
