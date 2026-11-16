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
import { useCallback,useEffect,useRef,useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { friendlyError } from '../services/api';
import { subscribeLiveQuery } from '../services/query-sync';
import type { LiveRefresh } from '../services/query-sync-core';
/** Ejecuta load al enfocar, expone estados y permite reemplazar datos locales sin recargar; invalida respuestas antiguas. */
export function useClientQuery<T>(load:()=>Promise<T>,options:{intervalMs?:number}={}){
  const [data,setData]=useState<T|null>(null);const [error,setError]=useState<string|null>(null);const [loading,setLoading]=useState(true);const sequence=useRef(0);const dataRef=useRef<T|null>(null);const busy=useRef(false);const queued=useRef(false);const focused=useRef(false);const loadRef=useRef(load);const previousLoad=useRef(load);const rerun=useRef<()=>void>(()=>{});
  const reload=useCallback(async():Promise<boolean>=>{if(busy.current){queued.current=true;return true;}busy.current=true;const attempt=++sequence.current;if(dataRef.current===null)setLoading(true);setError(null);let succeeded=false;
    try{const value=await loadRef.current();if(attempt===sequence.current){const unchanged=dataRef.current!==null&&JSON.stringify(dataRef.current)===JSON.stringify(value);if(!unchanged){dataRef.current=value;setData(value);}setError(null);succeeded=true;}}
    catch(failure){if(attempt===sequence.current)setError(friendlyError(failure));}
    finally{if(attempt===sequence.current)setLoading(false);busy.current=false;if(queued.current&&focused.current){queued.current=false;rerun.current();}}
    return succeeded;
  },[]);
  useEffect(()=>{loadRef.current=load;if(previousLoad.current!==load){previousLoad.current=load;if(focused.current)void reload();}},[load,reload]);
  useEffect(()=>{rerun.current=()=>{void reload();};},[reload]);
  const replaceData=useCallback((value:T)=>{sequence.current++;dataRef.current=value;setData(value);setError(null);setLoading(false);},[]);
  const intervalMs=options.intervalMs??30_000;
  useFocusEffect(useCallback(()=>{focused.current=true;const unsubscribe=subscribeLiveQuery(reload,intervalMs);void reload();return()=>{focused.current=false;sequence.current++;unsubscribe();};},[reload,intervalMs]));
  return {data,error,loading,reload,replaceData};
}

/** Adds live revalidation to focused views that still manage their data outside useClientQuery. */
export function useLiveQueryRefresh(refresh:LiveRefresh,options:{intervalMs?:number;enabled?:boolean}={}){
  const refreshRef=useRef(refresh);useEffect(()=>{refreshRef.current=refresh;},[refresh]);
  const intervalMs=options.intervalMs??30_000,enabled=options.enabled??true;
  useFocusEffect(useCallback(()=>enabled?subscribeLiveQuery(()=>refreshRef.current(),intervalMs):undefined,[enabled,intervalMs]));
}
