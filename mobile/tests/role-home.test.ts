import assert from 'node:assert/strict';
import {test} from 'node:test';
import {roleHome} from '../src/utils/role-home';
import type {AuthUser} from '../src/types/auth';
test('login común dirige por rol del backend, sin consultar emails ni IDs',()=>{
  const user:AuthUser={id:'999',firstName:'Ana',lastName:'Pérez',email:'same@example.com',phone:null,role:'CLIENT'};
  assert.equal(roleHome(null),'/login');assert.equal(roleHome(user),'/client');
  assert.equal(roleHome({...user,role:'VETERINARIAN'}),'/vet');assert.equal(roleHome({...user,role:'SUPER_ADMIN'}),'/admin');assert.equal(roleHome({...user,role:'ADMIN'}),'/admin');
});
