import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessPersonalRoute, personalPermissionsForRoute } from '../src/utils/personal-access';

test('CLIENT retains existing personal routes without changing the database grants',()=>{
  assert.equal(canAccessPersonalRoute('CLIENT',[],'POST','/api/client/pets'),true);
  assert.equal(canAccessPersonalRoute('CLIENT',[],'POST','/api/client/orders'),true);
});

test('professional permission codes do not grant access to personal data',()=>{
  assert.equal(canAccessPersonalRoute('VETERINARIAN',['pets.view_all','appointments.view_own'],'POST','/api/client/pets/query'),false);
  assert.equal(canAccessPersonalRoute('GROOMER',['appointments.view_own'],'POST','/api/client/appointments'),false);
  assert.equal(canAccessPersonalRoute('ADMIN',['products.update','orders.view_all'],'POST','/api/client/orders/query'),false);
});

test('personal modules have separate read, write and purchase capabilities',()=>{
  assert.equal(canAccessPersonalRoute('VETERINARIAN',['personal.pets.view'],'POST','/api/client/pets/query'),true);
  assert.equal(canAccessPersonalRoute('VETERINARIAN',['personal.pets.view'],'POST','/api/client/pets'),false);
  assert.equal(canAccessPersonalRoute('DEPOT_MANAGER',['personal.appointments.create'],'POST','/api/client/appointments'),true);
  assert.equal(canAccessPersonalRoute('ADMIN',['personal.store.view'],'POST','/api/client/store/products'),true);
  assert.equal(canAccessPersonalRoute('ADMIN',['personal.store.view'],'PUT','/api/client/cart/42'),false);
  assert.equal(canAccessPersonalRoute('ADMIN',['personal.store.purchase'],'PUT','/api/client/cart/42'),true);
  assert.equal(canAccessPersonalRoute('ADMIN',['personal.orders.view'],'POST','/api/client/orders/42'),true);
  assert.equal(canAccessPersonalRoute('ADMIN',['personal.pets.manage'],'POST','/api/client/pets/query'),true);
  assert.equal(canAccessPersonalRoute('ADMIN',['personal.store.purchase'],'POST','/api/client/store/products'),true);
  assert.equal(canAccessPersonalRoute('ADMIN',['personal.appointments.create'],'POST','/api/client/pets/query'),true);
  assert.equal(canAccessPersonalRoute('ADMIN',['personal.appointments.create'],'POST','/api/client/pets/43'),false);
});

test('personal authorization denies unknown routes by default',()=>{
  assert.equal(personalPermissionsForRoute('GET','/api/client/arbitrary'),null);
  assert.equal(canAccessPersonalRoute('ADMIN',['personal.pets.view'],'GET','/api/client/arbitrary'),false);
  assert.equal(canAccessPersonalRoute('ADMIN',['personal.pets.view'],'POST','/api/client/pets/43'),true);
});
