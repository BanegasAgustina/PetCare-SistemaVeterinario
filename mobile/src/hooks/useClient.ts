/**
 * ARCHIVO: useClient.ts
 * UBICACIÓN: mobile/src/hooks/useClient.ts
 * FUNCIÓN: Hook de React para compartir estado o comportamiento.
 * RESPONSABILIDAD: Hook de React para compartir estado o comportamiento dentro de PetCare; agrupa las declaraciones de useClient.
 * CONEXIONES: Importa: mobile/src/hooks/useAuth.ts, mobile/src/services/client.service.ts Se utiliza desde: mobile/src/app/client/(tabs)/appointments.tsx, mobile/src/app/client/(tabs)/index.tsx, mobile/src/app/client/(tabs)/pets.tsx, mobile/src/app/client/(tabs)/store/[id].tsx, mobile/src/app/client/(tabs)/store/cart.tsx, mobile/src/app/client/(tabs)/store/checkout.tsx, mobile/src/app/client/(tabs)/store/index.tsx, mobile/src/app/client/appointments/[id].tsx y 10 más
 * FUNCIONAMIENTO: Combina estado y ciclo de vida de React con dependencias del dominio y expone datos o acciones.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/**
 * Enlaza clientService con la sesión de AuthContext. Mantiene un servicio estable para consultar datos reales; la propiedad de cada recurso se decide en backend.
 */
import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { clientService } from '../services/client.service';
/** Crea una instancia memoizada de clientService enlazada al request autenticado de AuthContext. */
export function useClient(){const {request}=useAuth();return useMemo(()=>clientService(request),[request]);}
