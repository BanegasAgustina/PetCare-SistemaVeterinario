import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { clientService } from '../services/client.service';
export function useClient(){const {request}=useAuth();return useMemo(()=>clientService(request),[request]);}
