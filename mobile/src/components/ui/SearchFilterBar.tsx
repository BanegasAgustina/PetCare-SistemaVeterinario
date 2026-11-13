/**
 * ARCHIVO: SearchFilterBar.tsx
 * UBICACIÓN: mobile/src/components/ui/SearchFilterBar.tsx
 * FUNCIÓN: Adaptador de compatibilidad que organiza búsqueda/ordenamiento en el toolbar compartido.
 * RESPONSABILIDAD: Mantener una API simple para pantallas de clínica existentes.
 * CONEXIONES: Importa: mobile/src/components/ui/FilterDisclosure.tsx, mobile/src/components/admin/AdminListToolbar.tsx Se utiliza desde: mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/AvailabilityScreen.tsx, mobile/src/components/clinic/ClientsScreen.tsx, mobile/src/components/clinic/ClinicProductsScreen.tsx
 * FUNCIONAMIENTO: Compone AdminListToolbar y pasa contenido y control de orden sin ejecutar consultas ni guardar filtros.
 * IMPORTANCIA: Permite compartir presentación entre listados sin mover la lógica de datos.
 */
/** Compatibilidad para listados existentes: deriva la estructura al toolbar compartido. */
import { Children, isValidElement, type PropsWithChildren, type ReactNode } from 'react';
import { FilterDisclosure } from './FilterDisclosure';
import { AdminListToolbar } from '../admin/AdminListToolbar';

/** Organiza el campo de búsqueda, filtros y acciones en una barra adaptable. */
export function SearchFilterBar({children,sort}:PropsWithChildren<{sort?:ReactNode}>){
  const items=Children.toArray(children);
  const first=items[0];
  const firstIsFilter=isValidElement(first)&&first.type===FilterDisclosure;
  const onlyFilter=firstIsFilter&&items.length===1;
  const actions=onlyFilter?first:items.slice(1);
  const hasActions=Array.isArray(actions)?actions.length>0:Boolean(actions);
  return <AdminListToolbar search={onlyFilter?undefined:first} sort={sort} actions={hasActions?<>{actions}</>:undefined}/>;
}
