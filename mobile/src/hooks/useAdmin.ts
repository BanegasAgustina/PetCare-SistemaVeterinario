// Este archivo se encarga de lo siguiente: Hook reutilizable de React; concentra estado o comportamiento que pueden compartir varias pantallas.

/**
 * Enlaza adminService con la solicitud autenticada de AuthContext. Las pantallas consumen esta instancia; el backend vuelve a comprobar los permisos administrativos.
 */
import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { adminService } from '../services/admin.service';
// Función useAdmin: concentra la lógica dentro de este módulo.
export function useAdmin(){const {request}=useAuth();return useMemo(()=>adminService(request),[request]);}
