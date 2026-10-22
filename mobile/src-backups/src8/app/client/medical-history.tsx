/**
 * Pantalla de historia clínica para CLIENT autenticado. Usa los hooks y servicios autenticados de su módulo (/client o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { ClinicalScreen } from '../../components/client/ClinicalScreen';
export default function History(){return <ClinicalScreen kind="medical-history"/>;}
