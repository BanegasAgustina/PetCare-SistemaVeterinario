/**
 * ARCHIVO: useDebouncedValue.ts
 * UBICACIÓN: mobile/src/hooks/useDebouncedValue.ts
 * FUNCIÓN: Hook de React para compartir estado o comportamiento.
 * RESPONSABILIDAD: Hook de React para compartir estado o comportamiento dentro de PetCare; agrupa las declaraciones de useDebouncedValue.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/app/client/(tabs)/store/index.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/clinic/PatientsScreen.tsx
 * FUNCIONAMIENTO: Combina estado y ciclo de vida de React con dependencias del dominio y expone datos o acciones.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
import { useEffect, useState } from 'react';

/** Publica el valor nuevo después de delay ms y cancela el temporizador previo si vuelve a cambiar. */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
