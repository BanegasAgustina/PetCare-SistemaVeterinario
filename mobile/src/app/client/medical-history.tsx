// Este archivo se encarga de lo siguiente: Pantalla o navegación del área de clientes; muestra y permite gestionar la información del usuario y sus mascotas.

/**
 * Pantalla de historia clínica para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { ClinicalScreen } from '../../components/client/ClinicalScreen';
// Función History: concentra la lógica dentro de este módulo.
export default function History(){return <ClinicalScreen kind="medical-history"/>;}
