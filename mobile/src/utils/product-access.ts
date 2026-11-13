/** Crear productos requiere acceso al módulo y permisos explícitos para el registro, precio y stock. */
const productCreatePermissions=['products.update','products.create','products.update_price','products.update_stock'] as const;
export function canCreateProduct(permissions:string[]|undefined):boolean{
  return productCreatePermissions.every(code=>permissions?.includes(code));
}
