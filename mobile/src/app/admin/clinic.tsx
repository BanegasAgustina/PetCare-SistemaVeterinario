// Este archivo se encarga de lo siguiente: Pantalla o navegación del área administrativa; conecta la interfaz con las operaciones de administración.

//este archivo es el que se encarga de renderizar la sección de 
// administración del panel de administración.
import { AdminSectionHub } from '../../components/admin/AdminSectionHub';
// Función AdminClinicSection: concentra la lógica dentro de este módulo.
export default function AdminClinicSection() { return <AdminSectionHub section="clinic"/>; }
