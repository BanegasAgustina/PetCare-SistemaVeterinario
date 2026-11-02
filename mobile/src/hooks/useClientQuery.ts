/**
 * ARCHIVO: useClientQuery.ts
 * UBICACIÓN: mobile/src/hooks/useClientQuery.ts
 * FUNCIÓN: Hook de React para compartir estado o comportamiento.
 * RESPONSABILIDAD: Hook de React para compartir estado o comportamiento dentro de PetCare; agrupa las declaraciones de useClientQuery.
 * CONEXIONES: Importa: mobile/src/services/api.ts Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/index.tsx, mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/store-settings.tsx y 33 más
 * FUNCIONAMIENTO: Combina estado y ciclo de vida de React con dependencias del dominio y expone datos o acciones.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/**
 * Gestiona carga, error y resultado de una consulta real. Reconsulta al recibir foco e ignora respuestas antiguas; solo una consulta exitosa permite interpretar un resultado vacío.
 */
import { useCallback,useRef,useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { friendlyError } from '../services/api';
/** Ejecuta load al enfocar la pantalla y expone data/error/loading/reload; invalida respuestas de intentos anteriores. */
export function useClientQuery<T>(load:()=>Promise<T>){
  const [data,setData]=useState<T|null>(null);const [error,setError]=useState<string|null>(null);const [loading,setLoading]=useState(true);const sequence=useRef(0);
  const reload=useCallback(()=>{const attempt=++sequence.current;setLoading(true);setError(null);setData(null);
    void load().then(value=>{if(attempt===sequence.current)setData(value);}).catch(failure=>{if(attempt===sequence.current)setError(friendlyError(failure));}).finally(()=>{if(attempt===sequence.current)setLoading(false);});
  },[load]);
  useFocusEffect(useCallback(()=>{reload();return()=>{sequence.current++;};},[reload]));
  return {data,error,loading,reload};
}
