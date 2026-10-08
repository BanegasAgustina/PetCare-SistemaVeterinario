/**
 * Enlaza clientService con la sesión de AuthContext. Mantiene un servicio estable para consultar datos reales; la propiedad de cada recurso se decide en backend.
 */
import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { clientService } from '../services/client.service';
export function useClient(){const {request}=useAuth();return useMemo(()=>clientService(request),[request]);}
