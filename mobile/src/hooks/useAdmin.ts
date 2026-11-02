/**
 * ARCHIVO: useAdmin.ts
 * UBICACIÓN: mobile/src/hooks/useAdmin.ts
 * FUNCIÓN: Hook de React para compartir estado o comportamiento.
 * RESPONSABILIDAD: Hook de React para compartir estado o comportamiento dentro de PetCare; agrupa las declaraciones de useAdmin.
 * CONEXIONES: Importa: mobile/src/hooks/useAuth.ts, mobile/src/services/admin.service.ts Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/components/admin/AdminSectionHub.tsx, mobile/src/components/admin/SpecialtiesScreen.tsx, mobile/src/components/clinic/CatalogScreen.tsx y 1 más
 * FUNCIONAMIENTO: Combina estado y ciclo de vida de React con dependencias del dominio y expone datos o acciones.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/**
 * Enlaza adminService con la solicitud autenticada de AuthContext. Las pantallas consumen esta instancia; el backend vuelve a comprobar los permisos administrativos.
 */
import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { adminService } from '../services/admin.service';
/** Crea una instancia memoizada de adminService enlazada al request autenticado de AuthContext. */
export function useAdmin(){const {request}=useAuth();return useMemo(()=>adminService(request),[request]);}
