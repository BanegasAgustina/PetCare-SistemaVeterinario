import assert from 'node:assert/strict';
import test from 'node:test';
import { canCreateProduct } from '../src/utils/product-access';

test('un rol personalizado puede crear productos con los cuatro permisos requeridos',()=>{
  assert.equal(canCreateProduct(['products.update','products.create','products.update_price','products.update_stock']),true);
});

test('crear productos queda oculto si falta cualquiera de los permisos requeridos',()=>{
  const permissions=['products.update','products.create','products.update_price','products.update_stock'];
  for(const missing of permissions)assert.equal(canCreateProduct(permissions.filter(code=>code!==missing)),false,`debe faltar ${missing}`);
  assert.equal(canCreateProduct(undefined),false);
});
