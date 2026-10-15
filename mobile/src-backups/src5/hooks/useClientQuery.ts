/**
 * Gestiona carga, error y resultado de una consulta real. Reconsulta al recibir foco e ignora respuestas antiguas; solo una consulta exitosa permite interpretar un resultado vacío.
 */
import { useCallback,useRef,useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { friendlyError } from '../services/api';
/** Reconsulta al volver a la pantalla e ignora respuestas de una navegación anterior. */
export function useClientQuery<T>(load:()=>Promise<T>){
  const [data,setData]=useState<T|null>(null);const [error,setError]=useState<string|null>(null);const [loading,setLoading]=useState(true);const sequence=useRef(0);
  const reload=useCallback(()=>{const attempt=++sequence.current;setLoading(true);setError(null);setData(null);
    void load().then(value=>{if(attempt===sequence.current)setData(value);}).catch(failure=>{if(attempt===sequence.current)setError(friendlyError(failure));}).finally(()=>{if(attempt===sequence.current)setLoading(false);});
  },[load]);
  useFocusEffect(useCallback(()=>{reload();return()=>{sequence.current++;};},[reload]));
  return {data,error,loading,reload};
}
