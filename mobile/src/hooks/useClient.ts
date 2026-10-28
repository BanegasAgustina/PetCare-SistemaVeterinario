// Este archivo se encarga de lo siguiente: Hook reutilizable de React; concentra estado o comportamiento que pueden compartir varias pantallas.

/**
 * Enlaza clientService con la sesión de AuthContext. Mantiene un servicio estable para consultar datos reales; la propiedad de cada recurso se decide en backend.
 */
import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { clientService } from '../services/client.service';
// Función useClient: concentra la lógica dentro de este módulo.
export function useClient(){const {request}=useAuth();return useMemo(()=>clientService(request),[request]);}
