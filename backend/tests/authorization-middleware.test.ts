import assert from 'node:assert/strict';
import test from 'node:test';
import type { Request, Response } from 'express';
import { requireAnyPermission, requirePatientScope, requirePermission, requirePersonalAccess, requireRole } from '../src/middlewares/permission.middleware';
import type { AuthUser, RoleCode } from '../src/types/auth';
import { AppError } from '../src/utils/app-error';

const roles: RoleCode[] = ['CLIENT', 'VETERINARIAN', 'GROOMER', 'SECRETARY', 'ADMIN', 'SUPER_ADMIN'];

function invoke(middleware: ReturnType<typeof requireRole>, user?: Partial<AuthUser>, request: Partial<Request> = {}): unknown {
  let received: unknown;
  middleware(
    { method: 'POST', path: '/', params: {}, ...request } as Request,
    { locals: { ...(user ? { authenticatedUser: user } : {}) } } as Response,
    error => { received = error; },
  );
  return received;
}

test('role guards allow each explicit role and deny a role outside the route policy', () => {
  for (const role of roles) assert.equal(invoke(requireRole(role), { role }), undefined, role);
  for (const role of roles.filter(value => value !== 'VETERINARIAN')) {
    const error = invoke(requireRole('VETERINARIAN'), { role });
    assert.ok(error instanceof AppError && error.status === 403, role);
  }
  assert.ok(invoke(requireRole('CLIENT')) instanceof AppError, 'missing identity is forbidden');
});

test('permission guards allow required grants and enforce all-versus-any semantics', () => {
  assert.equal(invoke(requirePermission('pets.view', 'appointments.view'), { permissions: ['pets.view', 'appointments.view'] }), undefined);
  assert.ok(invoke(requirePermission('pets.view', 'appointments.view'), { permissions: ['pets.view'] }) instanceof AppError);
  assert.equal(invoke(requireAnyPermission('appointments.manage', 'schedule.manage'), { permissions: ['schedule.manage'] }), undefined);
  assert.ok(invoke(requireAnyPermission('appointments.manage', 'schedule.manage'), { permissions: ['pets.view'] }) instanceof AppError);
});

test('staff personal access requires an explicit personal grant while CLIENT retains its own area', () => {
  assert.equal(invoke(requirePersonalAccess, { id: '1', role: 'CLIENT' }, { method: 'POST', path: '/api/client/pets/query' }), undefined);
  assert.equal(invoke(requirePersonalAccess, { id: '2', role: 'SECRETARY', permissions: ['personal.pets.view'] }, { method: 'POST', path: '/api/client/pets/query' }), undefined);
  assert.ok(invoke(requirePersonalAccess, { id: '3', role: 'SECRETARY', permissions: [] }, { method: 'POST', path: '/api/client/pets/query' }) instanceof AppError);
});

test('patient scope allows global pet permission without a query and rejects unrelated roles', () => {
  const request = { method: 'POST', path: '/api/clinic/patients/9', params: { petId: '9' } };
  assert.equal(invoke(requirePatientScope(), { id: '4', role: 'ADMIN', permissions: ['pets.view_all'] }, request), undefined);
  assert.ok(invoke(requirePatientScope(), { id: '5', role: 'GROOMER', permissions: ['pets.view_all'] }, request) instanceof AppError);
  assert.ok(invoke(requirePatientScope(), { id: '6', role: 'VETERINARIAN', permissions: [] }, request) instanceof AppError);
});
