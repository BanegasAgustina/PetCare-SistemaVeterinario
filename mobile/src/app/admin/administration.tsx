/**
 * ARCHIVO: administration.tsx
 * UBICACIÓN: mobile/src/app/admin/administration.tsx
 * FUNCIÓN: Entrada a la sección de administración general.
 * RESPONSABILIDAD: Renderiza el hub administrativo con la sección administration seleccionada.
 * CONEXIONES: Importa: mobile/src/components/admin/AdminSectionHub.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → esta ruta → AdminSectionHub → rutas de usuarios/roles/permisos.
 * IMPORTANCIA: Reutiliza un índice de administración y mantiene la ruta declarativa.
 */
//este archivo es el que se encarga de renderizar la sección de 
// administración del panel de administración.
import { AdminSectionHub } from "../../components/admin/AdminSectionHub";
/** Renderiza el hub configurado para administración. */
export default function AdminAdministrationSection() {
  return <AdminSectionHub section="administration" />;
}
