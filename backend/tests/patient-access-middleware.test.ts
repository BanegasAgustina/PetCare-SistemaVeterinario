import assert from 'node:assert/strict';
import { test } from 'node:test';
import { patientQueryAuthorizationGuard, requireAnyPermission, requireRole } from '../src/middlewares/permission.middleware';

function run(handler: ReturnType<typeof requireAnyPermission> | ReturnType<typeof requireRole>, user: { role: string; permissions: string[] }) {
  let failure: unknown;
  handler({} as never, { locals: { authenticatedUser: user } } as never, error => { failure = error; });
  return failure;
}

test('patient query route accepts ADMIN with effective pets.view_all', () => {
  assert.equal(run(requireRole('VETERINARIAN', 'GROOMER', 'ADMIN', 'SUPER_ADMIN'), { role: 'ADMIN', permissions: ['pets.view_all'] }), undefined);
  assert.equal(run(requireAnyPermission('pets.view_information', 'pets.view_all', 'appointments.view_own'), { role: 'ADMIN', permissions: ['pets.view_all'] }), undefined);
});

test('patient query route rejects missing permissions and roles without broadening access', () => {
  assert.equal((run(requireAnyPermission('pets.view_information', 'pets.view_all', 'appointments.view_own'), { role: 'ADMIN', permissions: [] }) as { code: string }).code, 'FORBIDDEN');
  assert.equal((run(requireRole('VETERINARIAN', 'GROOMER', 'ADMIN', 'SUPER_ADMIN'), { role: 'SECRETARY', permissions: ['pets.view_all'] }) as { code: string }).code, 'FORBIDDEN');
});

test('patient query denial diagnostics contain only safe authorization facts', () => {
  const originalWarn = console.warn;
  let message = '';
  let failure: unknown;
  console.warn = value => { message = String(value); };
  try {
    patientQueryAuthorizationGuard('permission', requireAnyPermission('pets.view_information', 'pets.view_all', 'appointments.view_own'))(
      {} as never,
      { locals: { authenticatedUser: { id: 'private-user-id', email: 'private@example.test', role: 'ADMIN', permissions: [] }, authenticatedRoleId: '3', authenticatedAccountActive: true } } as never,
      error => { failure = error; },
    );
  } finally {
    console.warn = originalWarn;
  }
  assert.equal((failure as { code: string }).code, 'FORBIDDEN');
  assert.deepEqual(JSON.parse(message), {
    event: 'clinic.patient_query.authorization_denied',
    guard: 'permission',
    roleId: '3',
    roleCode: 'ADMIN',
    accountActive: true,
    effectivePermissions: { petsViewAll: false, petsViewInformation: false, appointmentsViewOwn: false },
  });
  assert.equal(message.includes('private-user-id'), false);
  assert.equal(message.includes('private@example.test'), false);
});
