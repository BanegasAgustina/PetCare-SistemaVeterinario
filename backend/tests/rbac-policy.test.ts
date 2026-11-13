import assert from 'node:assert/strict';
import test from 'node:test';
import type { AuthUser } from '../src/types/auth';
import { assertAdminPermission, assertCapabilityPermission, assertTarget, assertDelegation, assertRolePermissionDelegation, assertNoNewCriticalCustomRolePermissions, canDelegatePermission, assertRoleAssignment } from '../src/utils/admin-authorization';
import { effectiveRolePermission } from '../src/types/authorization';

const actor=(role:string,permissions:string[]):AuthUser=>({
  id:'4',firstName:'Ana',lastName:'Test',email:'ana@example.test',phone:null,role,permissions,
});

test('un rol personalizado recibe solo operaciones cubiertas por sus permisos efectivos',()=>{
  const receptionist=actor('RECEPCIONISTA',['users.view_basic','appointments.view_all']);
  assert.doesNotThrow(()=>assertAdminPermission(receptionist,'users.view_basic','appointments.view_all'));
  assert.throws(()=>assertAdminPermission(receptionist,'roles.manage'),{status:403});
});

test('las capacidades críticas siguen limitadas a roles de sistema autorizados',()=>{
  assert.equal(effectiveRolePermission('ENCARGADO_TIENDA',true,true,null),false);
  assert.equal(effectiveRolePermission('ADMIN',true,true,null),true);
  assert.equal(effectiveRolePermission('ENCARGADO_TIENDA',false,true,null),true);
  assert.equal(effectiveRolePermission('ENCARGADO_TIENDA',true,false,true),false,'un override de usuario no debe saltar una restricción crítica');
});

test('los grants personalizados efectivos siguen la herencia y los overrides explícitos',()=>{
  assert.equal(effectiveRolePermission('RECEPCIONISTA',false,true,null),true);
  assert.equal(effectiveRolePermission('RECEPCIONISTA',false,true,false),false);
  assert.equal(effectiveRolePermission('RECEPCIONISTA',false,false,true),true);
});

test('los permisos personalizados se pueden delegar solo si el actor ya los tiene',()=>{
  const receptionist=actor('RECEPCIONISTA',['appointments.view_all']);
  assert.doesNotThrow(()=>assertDelegation(receptionist,['appointments.view_all']));
  assert.throws(()=>assertDelegation(receptionist,['orders.manage']),{status:403});
});

test('SUPER_ADMIN puede delegar permisos funcionales sin tenerlos y no puede delegar críticos implícitamente',()=>{
  const superAdmin=actor('SUPER_ADMIN',['roles.manage','permissions.manage']);
  const createProducts={code:'products.create',critical:false};
  const critical={code:'roles.manage',critical:true};
  assert.equal(canDelegatePermission(superAdmin,createProducts),true);
  assert.doesNotThrow(()=>assertRolePermissionDelegation(superAdmin,[createProducts]));
  assert.equal(canDelegatePermission(superAdmin,critical),true,'un permiso crítico requiere un grant explícito');
  assert.doesNotThrow(()=>assertRolePermissionDelegation(superAdmin,[critical]));
  assert.equal(canDelegatePermission(actor('SUPER_ADMIN',[]),critical),false);
  assert.throws(()=>assertRolePermissionDelegation(actor('SUPER_ADMIN',[]),[critical]),{status:403});
});

test('un ADMIN conserva delegación acotada a sus grants efectivos',()=>{
  const admin=actor('ADMIN',['roles.manage','products.update']);
  assert.doesNotThrow(()=>assertRolePermissionDelegation(admin,[{code:'products.update',critical:false}]));
  assert.throws(()=>assertRolePermissionDelegation(admin,[{code:'products.create',critical:false}]),{status:403});
});

test('SUPER_ADMIN puede asignar permisos funcionales delegados en roles personalizados',()=>{
  const superAdmin=actor('SUPER_ADMIN',['roles.manage']);
  assert.doesNotThrow(()=>assertRoleAssignment(superAdmin,'RECEPCIONISTA',['products.create','orders.manage']));
  assert.throws(()=>assertRoleAssignment(actor('ADMIN',['roles.manage']),'RECEPCIONISTA',['products.create']),{status:403});
});

test('un rol personalizado conserva permisos críticos existentes y rechaza nuevos',()=>{
  const legacyCritical={code:'products.create',critical:true};
  assert.doesNotThrow(()=>assertNoNewCriticalCustomRolePermissions('ENCARGADO',['products.create'],[legacyCritical]));
  assert.throws(()=>assertNoNewCriticalCustomRolePermissions('ENCARGADO',[],[legacyCritical]),{status:403});
  assert.doesNotThrow(()=>assertNoNewCriticalCustomRolePermissions('SUPER_ADMIN',[],[legacyCritical]));
});

test('crear productos requiere permisos funcionales efectivos sin depender del nombre del rol',()=>{
  const grants=['products.update','products.create','products.update_price','products.update_stock'];
  assert.doesNotThrow(()=>assertCapabilityPermission(actor('RECEPCIONISTA',grants),...grants));
  assert.throws(()=>assertCapabilityPermission(actor('RECEPCIONISTA',grants.filter(code=>code!=='products.create')),...grants),{status:403});
});

test('un rol personalizado no puede editar la cuenta exclusiva SUPER_ADMIN',()=>{
  assert.throws(()=>assertTarget(actor('RECEPCIONISTA',['users.manage']),{id:'9',role:'SUPER_ADMIN'}),{status:403});
  assert.doesNotThrow(()=>assertTarget(actor('SUPER_ADMIN',['users.manage']),{id:'9',role:'SUPER_ADMIN'}));
});
