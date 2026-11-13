import assert from 'node:assert/strict';
import test from 'node:test';
import type { AdminPermission } from '../src/types/admin';
import { customRolePermissionOptions,preservedCustomRolePermissions,rolePermissionHint } from '../src/utils/role-permission-selector';

const permission=(code:string,overrides:Partial<AdminPermission>={}):AdminPermission=>({
  id:code,code,name:code,description:'',module:'catalog',moduleName:'Catálogo',critical:false,canDelegate:true,...overrides,
});

test('el selector personalizado oculta permisos protegidos y conserva operaciones funcionales delegables',()=>{
  const permissions=[
    permission('products.create'),
    permission('products.update'),
    permission('appointments.manage'),
    permission('roles.manage',{critical:true}),
    permission('products.delete',{canDelegate:false}),
  ];
  assert.deepEqual(customRolePermissionOptions(permissions).map(item=>item.code),['products.create','products.update','appointments.manage']);
  assert.deepEqual(preservedCustomRolePermissions(permissions,['roles.manage','products.delete']),['roles.manage','products.delete']);
});

test('la política del catálogo mantiene oculta una función marcada crítica hasta corregirla en origen',()=>{
  const misclassified=permission('products.create',{critical:true});
  assert.deepEqual(customRolePermissionOptions([misclassified]),[]);
});

test('las restricciones profesionales se explican sin referencias a roles ni códigos técnicos',()=>{
  const hint=rolePermissionHint(permission('recommendations.create',{description:'Crear recomendaciones.'}));
  assert.match(hint,/habilitación profesional/);
  assert.match(hint,/acceso a pacientes y productos/);
  assert.doesNotMatch(hint,/ADMIN|SUPER_ADMIN|products\.view|RBAC|grant/i);
});
