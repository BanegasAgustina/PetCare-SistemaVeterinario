import assert from 'node:assert/strict';
import test from 'node:test';
import type { AuthUser } from '../src/types/auth';
import {
  assertAdminPermission,
  assertCapabilityPermission,
  assertDelegation,
  assertRoleAssignment,
  assertTarget,
} from '../src/utils/admin-authorization';
import { AppError } from '../src/utils/app-error';

function actor(role: string, permissions: string[] = []): AuthUser {
  return {
    id: '7',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.invalid',
    phone: null,
    role,
    permissions,
  };
}

test('admin permission requires both an administrative role and the grant', () => {
  assert.equal(assertAdminPermission(actor('ADMIN', ['users.manage']), 'users.manage'), undefined);
  assert.throws(
    () => assertAdminPermission(actor('CLIENT', ['users.manage']), 'users.manage'),
    (error: unknown) => error instanceof AppError && error.code === 'FORBIDDEN',
  );
  assert.throws(
    () => assertAdminPermission(actor('ADMIN'), 'users.manage'),
    (error: unknown) => error instanceof AppError && error.code === 'FORBIDDEN',
  );
});

test('capability permission is based on the effective grant for custom roles', () => {
  assert.equal(assertCapabilityPermission(actor('CUSTOM_STAFF', ['schedule.manage']), 'schedule.manage'), undefined);
  assert.throws(
    () => assertCapabilityPermission(actor('CUSTOM_STAFF'), 'schedule.manage'),
    (error: unknown) => error instanceof AppError && error.status === 403,
  );
});

test('permission delegation cannot exceed the actor effective grants', () => {
  assert.equal(assertDelegation(actor('ADMIN', ['users.manage']), ['users.manage']), undefined);
  assert.throws(
    () => assertDelegation(actor('ADMIN', ['users.manage']), ['users.manage', 'permissions.manage']),
    (error: unknown) => error instanceof AppError && error.code === 'FORBIDDEN',
  );
});

test('an admin cannot target a super admin account', () => {
  assert.throws(
    () => assertTarget(actor('ADMIN'), { id: '9', role: 'SUPER_ADMIN' }),
    (error: unknown) => error instanceof AppError && error.code === 'FORBIDDEN',
  );
  assert.equal(assertTarget(actor('SUPER_ADMIN'), { id: '9', role: 'SUPER_ADMIN' }), undefined);
});

test('role assignment keeps retired and protected role rules server-side', () => {
  const superAdmin = actor('SUPER_ADMIN', ['roles.manage', 'permissions.manage']);
  assert.throws(
    () => assertRoleAssignment(superAdmin, 'SECRETARY', []),
    (error: unknown) => error instanceof AppError && error.code === 'ROLE_RETIRED',
  );
  assert.throws(
    () => assertRoleAssignment(superAdmin, 'VETERINARIAN', []),
    (error: unknown) => error instanceof AppError && error.code === 'VET_PROFILE_REQUIRED',
  );
  assert.throws(
    () => assertRoleAssignment(actor('ADMIN', ['roles.manage']), 'SUPER_ADMIN', []),
    (error: unknown) => error instanceof AppError && error.code === 'FORBIDDEN',
  );
});
