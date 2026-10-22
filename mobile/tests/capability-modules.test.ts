import assert from 'node:assert/strict';
import { describe,it } from 'node:test';
import { capabilityModules,hasCapabilityModule,modulesForCapabilities } from '../src/utils/capability-modules';

describe('custom role capability navigation',()=>{
  it('maps granted permissions only to registered application paths',()=>{
    const modules=modulesForCapabilities(['products.update_stock','categories.manage']);
    assert.deepEqual(modules.map(module=>module.path),['/admin/products','/admin/catalog/categories']);
    assert.ok(modules.every(module=>capabilityModules.some(registered=>registered.path===module.path)));
  });
  it('does not grant a workspace or route for unknown permissions',()=>{
    assert.equal(hasCapabilityModule(['future.module.execute']),false);
    assert.deepEqual(modulesForCapabilities(['future.module.execute']),[]);
  });
});
