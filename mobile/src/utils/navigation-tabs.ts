/** Limita las pestañas principales y conserva el resto en el menú Más. */
export function splitNavigationTabs<T>(items:T[],limit=5){
  if(items.length<=limit)return {visible:items,overflow:[] as T[]};
  return {visible:items.slice(0,limit-1),overflow:items.slice(limit-1)};
}
