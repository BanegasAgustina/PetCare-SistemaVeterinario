/** Conserva un solo acceso por destino exacto sin fusionar rutas de nombres parecidos. */
export function uniqueNavigationDestinations<T extends {path:string}>(items:T[]):T[]{
  const destinations=new Set<string>();
  return items.filter(item=>{
    if(destinations.has(item.path))return false;
    destinations.add(item.path);
    return true;
  });
}
