import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { roleCodeFromName } from '../src/utils/role-code';
import { assertRoleAssignment } from '../src/utils/admin-authorization';
import type { AuthUser } from '../src/types/auth';
import { AppError } from '../src/utils/app-error';

describe('custom role codes', () => {
  it('creates stable uppercase codes from Spanish role names', () => {
    assert.equal(roleCodeFromName('Encargado de depósito'), 'ENCARGADO_DE_DEPOSITO');
  });
  it('limits codes to the existing schema width and removes trailing separators', () => {
    assert.equal(roleCodeFromName('Un rol personalizado extraordinariamente largo para PetCare').length, 32);
    assert.equal(roleCodeFromName('Recepcionista /'), 'RECEPCIONISTA');
  });
  it('leaves names without ASCII letters unusable as role codes', () => {
    assert.equal(roleCodeFromName('🐾'), '');
  });
  it('retires Secretary from new assignment while leaving existing accounts on their current role', () => {
    const actor:AuthUser={id:'1',firstName:'Admin',lastName:'Prueba',email:'admin@example.test',phone:null,role:'SUPER_ADMIN',permissions:['roles.manage']};
    assert.throws(()=>assertRoleAssignment(actor,'SECRETARY',[]),(error:unknown)=>error instanceof AppError&&error.code==='ROLE_RETIRED');
  });
});
