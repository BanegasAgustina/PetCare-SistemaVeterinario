import assert from 'node:assert/strict';
import { describe,it } from 'node:test';
import { hasCapabilityModule, hasPersonalCapabilityModule, modulesForCapabilities, personalModulesForCapabilities } from '../src/utils/capability-modules';
import { canEnterPersonalPath,personalPermissionsForPathname } from '../src/utils/personal-route-access';

describe('personal module capabilities',()=>{
  it('exposes only modules granted to a custom role',()=>{
    const permissions=['personal.pets.view','products.update_stock'];
    assert.equal(hasPersonalCapabilityModule(permissions),true);
    assert.equal(hasCapabilityModule(permissions),true);
    assert.deepEqual(personalModulesForCapabilities(permissions).map(item=>item.path),['/client/pets']);
    assert.deepEqual(modulesForCapabilities(permissions).map(item=>item.path),['/client/pets','/admin/products']);
  });
  it('does not grant administrative routes from personal permissions alone',()=>{
    assert.equal(hasCapabilityModule(['personal.store.purchase']),false);
    assert.equal(hasPersonalCapabilityModule(['personal.store.purchase']),true);
  });
  it('sends appointment creators directly to the request form and guards routes by personal permission',()=>{
    assert.deepEqual(personalModulesForCapabilities(['personal.appointments.create']).map(item=>item.path),['/client/appointments/request']);
    assert.deepEqual(modulesForCapabilities(['personal.appointments.create']).map(item=>item.path),['/client/appointments/request']);
    assert.equal(canEnterPersonalPath('GROOMER',['personal.appointments.create'],'/client/appointments/request'),true);
    assert.equal(canEnterPersonalPath('GROOMER',['personal.appointments.create'],'/client/appointments'),false);
  });
  it('allows pet managers to read what they manage and keeps other personal routes closed',()=>{
    assert.deepEqual(personalPermissionsForPathname('/client/pets/21/edit'),['personal.pets.view','personal.pets.manage']);
    assert.equal(canEnterPersonalPath('ADMIN',['personal.pets.manage'],'/client/pets'),true);
    assert.equal(canEnterPersonalPath('ADMIN',['pets.view_all'],'/client/pets'),false);
    assert.equal(canEnterPersonalPath('ADMIN',[],'/client/notifications'),false);
    assert.equal(canEnterPersonalPath('CLIENT',[],'/client/notifications'),true);
  });
});
