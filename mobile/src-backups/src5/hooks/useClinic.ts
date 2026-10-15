/**
 * Enlaza clinicService con AuthContext para enviar el Bearer vigente. Comparte clínica entre paneles; no concede permisos por el nombre de la pantalla.
 */
import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { clinicService } from '../services/clinic.service';
export function useClinic(){const {request}=useAuth();return useMemo(()=>clinicService(request),[request]);}
