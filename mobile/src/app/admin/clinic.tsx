/**
 * ARCHIVO: clinic.tsx
 * UBICACIÓN: mobile/src/app/admin/clinic.tsx
 * FUNCIÓN: Entrada al hub de operaciones de clínica.
 * RESPONSABILIDAD: Renderiza AdminSectionHub con enlaces a agenda, pacientes, profesionales y catálogos clínicos.
 * CONEXIONES: Importa: mobile/src/components/admin/AdminSectionHub.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → AdminSectionHub → componentes y servicios clínicos.
 * IMPORTANCIA: Agrupa accesos sin duplicar la navegación del panel.
 */
//este archivo es el que se encarga de renderizar la sección de 
// administración del panel de administración.
import { AdminSectionHub } from '../../components/admin/AdminSectionHub';
/** Renderiza el hub de clínica en el panel administrativo. */
export default function AdminClinicSection() { return <AdminSectionHub section="clinic"/>; }
