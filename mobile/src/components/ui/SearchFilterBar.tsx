// Este archivo se encarga de lo siguiente: Componente visual reutilizable; mantiene una interacción o presentación común en la app.

/** Compatibilidad para listados existentes: deriva la estructura al toolbar compartido. */
import { Children, isValidElement, type PropsWithChildren } from 'react';
import { FilterDisclosure } from './FilterDisclosure';
import { AdminListToolbar } from '../admin/AdminListToolbar';

// Función SearchFilterBar: obtiene o consulta información dentro de este módulo.
export function SearchFilterBar({children}:PropsWithChildren){
  const items=Children.toArray(children);
  const first=items[0];
  const firstIsFilter=isValidElement(first)&&first.type===FilterDisclosure;
  const onlyFilter=firstIsFilter&&items.length===1;
  const actions=onlyFilter?first:items.slice(1);
  const hasActions=Array.isArray(actions)?actions.length>0:Boolean(actions);
  return <AdminListToolbar search={onlyFilter?undefined:first} actions={hasActions?<>{actions}</>:undefined}/>;
}
