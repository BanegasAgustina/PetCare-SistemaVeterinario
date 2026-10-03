import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { clinicService } from '../services/clinic.service';
export function useClinic(){const {request}=useAuth();return useMemo(()=>clinicService(request),[request]);}
