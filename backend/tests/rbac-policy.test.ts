import assert from 'node:assert/strict';
import test from 'node:test';
import type { AuthUser } from '../src/types/auth';
import { assertAdminPermission, assertTarget, assertDelegation } from '../src/utils/admin-authorization';
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

test('un rol personalizado no puede editar la cuenta exclusiva SUPER_ADMIN',()=>{
  assert.throws(()=>assertTarget(actor('RECEPCIONISTA',['users.manage']),{id:'9',role:'SUPER_ADMIN'}),{status:403});
  assert.doesNotThrow(()=>assertTarget(actor('SUPER_ADMIN',['users.manage']),{id:'9',role:'SUPER_ADMIN'}));
});
