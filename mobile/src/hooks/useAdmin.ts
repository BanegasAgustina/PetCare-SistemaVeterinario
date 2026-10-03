import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { adminService } from '../services/admin.service';
export function useAdmin(){const {request}=useAuth();return useMemo(()=>adminService(request),[request]);}
