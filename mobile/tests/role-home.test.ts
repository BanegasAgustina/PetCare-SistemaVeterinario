/** Contratos de navegación sin React Native: fixtures exclusivos del test, nunca del producto. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roleHome } from '../src/utils/role-home';
import { hasPermission } from '../src/utils/authorization';
import type { AuthUser } from '../src/types/auth';
test('Cada rol de MySQL entra a su panel y permisos no se deducen del email',()=>{
  const paths={CLIENT:'/client',VETERINARIAN:'/vet',GROOMER:'/professional',SECRETARY:'/secretary',ADMIN:'/admin',SUPER_ADMIN:'/admin'} as const;
  assert.equal(roleHome(null),'/login');
  for(const [role,route] of Object.entries(paths)){
    const user:AuthUser={id:'42',email:'admin@example.invalid',firstName:'Prueba',lastName:'Interna',phone:null,role:role as AuthUser['role'],permissions:[]};
    assert.equal(roleHome(user),route);assert.equal(hasPermission(user,'permissions.manage'),false);
  }
});
