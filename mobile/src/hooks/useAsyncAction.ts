/**
 * ARCHIVO: useAsyncAction.ts
 * UBICACIÓN: mobile/src/hooks/useAsyncAction.ts
 * FUNCIÓN: Hook de React para compartir estado o comportamiento.
 * RESPONSABILIDAD: Hook de React para compartir estado o comportamiento dentro de PetCare; agrupa las declaraciones de useAsyncAction.
 * CONEXIONES: Importa: mobile/src/services/api.ts Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/app/change-initial-password.tsx, mobile/src/app/client/(tabs)/appointments.tsx, mobile/src/app/client/appointments/request.tsx y 18 más
 * FUNCIONAMIENTO: Combina estado y ciclo de vida de React con dependencias del dominio y expone datos o acciones.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Comparte loading y error seguro y evita envíos duplicados o cambios tras desmontar. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { friendlyError } from '../services/api';

/** Devuelve loading/error/run; evita concurrencia, convierte fallos a mensaje público y no actualiza estado tras desmontar. */
export function useAsyncAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const run = useCallback(async (operation: () => Promise<unknown>): Promise<boolean> => {
    if (busy.current) return false;
    busy.current = true; setLoading(true); setError(null);
    try { await operation(); return true; }
    catch (failure) { if (mounted.current) setError(friendlyError(failure)); return false; }
    finally { busy.current = false; if (mounted.current) setLoading(false); }
  }, []);
  return { loading, error, run, clearError: () => setError(null) };
}
