/** Comparte loading y error seguro y evita envíos duplicados o cambios tras desmontar. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { friendlyError } from '../services/api';

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
