import test from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response, RequestHandler } from 'express';
import type { RowDataPacket } from 'mysql2/promise';
import { adminRouter } from '../src/routes/admin.routes';
import { authenticate } from '../src/middlewares/auth.middleware';
import { databasePool } from '../src/config/database';
import { createAccessToken } from '../src/services/token.service';
import { pet } from '../src/repositories/client.repository';
import { patientScope, clinical } from '../src/repositories/clinic.repository';
import type { AuthUser } from '../src/types/auth';
import { AppError } from '../src/utils/app-error';
import { adminCatalog } from '../src/repositories/admin.repository';

type QueryRows = RowDataPacket[];
type QueryHandler = (sql: string, params: unknown[]) => QueryRows | Promise<QueryRows>;

const client: AuthUser = {
  id: '101', firstName: 'Cliente', lastName: 'Prueba', email: 'client@example.test',
  phone: null, role: 'CLIENT', permissions: [],
};
const veterinarian: AuthUser = {
  id: '202', firstName: 'Vet', lastName: 'Prueba', email: 'vet@example.test',
  phone: null, role: 'VETERINARIAN', permissions: ['pets.view_information', 'pets.view_assigned'],
};
const groomer: AuthUser = {
  id: '303', firstName: 'Pelu', lastName: 'Prueba', email: 'groomer@example.test',
  phone: null, role: 'GROOMER', permissions: ['medical_records.view', 'appointments.view_own'],
};
const admin: AuthUser = {
  id: '404', firstName: 'Admin', lastName: 'Prueba', email: 'admin@example.test',
  phone: null, role: 'ADMIN', permissions: [],
};

async function withDatabaseMock<T>(handler: QueryHandler, operation: () => Promise<T>): Promise<T> {
  const original = databasePool.execute;
  Object.defineProperty(databasePool, 'execute', {
    configurable: true,
    writable: true,
    value: async (sql: string, params: unknown[] = []) => [await handler(sql, params), []],
  });
  try { return await operation(); }
  finally { Object.defineProperty(databasePool, 'execute', { configurable: true, writable: true, value: original }); }
}

function routeGuards(path: string, method: 'get' | 'post' | 'put' | 'patch' | 'delete'): RequestHandler[] {
  type RouteLayer = { route?: { path: string; methods: Record<string, boolean>; stack: { handle: RequestHandler }[] } };
  const stack = (adminRouter as unknown as { stack: RouteLayer[] }).stack;
  const route = stack.find(layer => layer.route?.path === path && layer.route.methods[method])?.route;
  assert.ok(route, `No está registrada la ruta ${method.toUpperCase()} ${path}`);
  return route.stack.slice(0, -1).map(layer => layer.handle);
}

async function runGuard(guard: RequestHandler, user: AuthUser): Promise<unknown> {
  return new Promise(resolve => guard({} as Request, { locals: { authenticatedUser: user } } as unknown as Response, error => resolve(error)));
}
async function runGuards(guards: RequestHandler[], user: AuthUser): Promise<unknown> {
  for (const guard of guards) { const error=await runGuard(guard,user); if(error)return error; }
  return undefined;
}

async function runAuthentication(token: string) {
  const response = { locals: {} as Record<string, unknown> };
  const error = await new Promise<unknown>(resolve => authenticate(
    { headers: { authorization: `Bearer ${token}` } } as Request,
    response as unknown as Response,
    next => resolve(next),
  ));
  return { error, user: response.locals.authenticatedUser as AuthUser | undefined };
}

function signTestToken(userId: string): string {
  return createAccessToken(userId, 0).accessToken;
}

test('cliente no puede leer la mascota de otro propietario', async () => {
  let query = '';
  let params: unknown[] = [];
  await withDatabaseMock((sql, values) => { query = sql; params = values; return []; }, async () => {
    await assert.rejects(pet(client.id, '9001'), (error: unknown) => error instanceof AppError && error.status === 404);
  });
  assert.match(query, /p\.owner_id=\? AND p\.id=\? AND p\.is_active=1/);
  assert.deepEqual(params, [client.id, '9001']);
});

test('SECRETARY permanece en el catálogo histórico pero no queda habilitado para asignaciones nuevas', async () => {
  const actor:AuthUser={...admin,role:'SUPER_ADMIN',permissions:['roles.manage','appointments.view_own']};
  const result=await withDatabaseMock((sql):QueryRows=>{
    if(sql.startsWith('SELECT r.id,r.code,r.name'))return [{id:7,code:'SECRETARY',name:'Secretaría',assignedUsers:2},{id:8,code:'ADMIN',name:'Administrador',assignedUsers:1}] as unknown as QueryRows;
    if(sql.startsWith('SELECT p.id,p.code,p.name,p.description'))return [];
    if(sql.startsWith('SELECT rp.role_id'))return [{roleId:7,code:'appointments.view_own'}] as unknown as QueryRows;
    return [];
  },()=>adminCatalog(actor));
  assert.equal(result.roles.find(role=>role.code==='SECRETARY')?.assignedUsers,2);
  assert.equal(result.roles.find(role=>role.code==='SECRETARY')?.canAssign,false);
  assert.equal(result.roles.find(role=>role.code==='ADMIN')?.canAssign,true);
});

test('veterinario sin asignación no puede abrir un paciente', async () => {
  let query = '';
  let params: unknown[] = [];
  await withDatabaseMock((sql, values) => { query = sql; params = values; return []; }, async () => {
    await assert.rejects(patientScope(veterinarian, '9002'), (error: unknown) => error instanceof AppError && error.status === 404);
  });
  assert.match(query, /JOIN veterinarian_patients vp/);
  assert.match(query, /vt\.user_id=\?/);
  assert.deepEqual(params, ['9002', veterinarian.id]);
});

test('peluquería no puede consultar registros clínicos aunque envíe la ruta directamente', async () => {
  let queried = false;
  await withDatabaseMock(() => { queried = true; return []; }, async () => {
    await assert.rejects(clinical(groomer, '9003', 'medical-history'), (error: unknown) => error instanceof AppError && error.status === 403);
  });
  assert.equal(queried, false, 'la denegación debe ocurrir antes de consultar la historia clínica');
});

test('administrador sin permiso recibe 403 en el endpoint administrativo directo', async () => {
  const guards = routeGuards('/users/query', 'post');
  const error = await runGuards(guards, admin);
  assert.ok(error instanceof AppError);
  assert.equal((error as AppError).status, 403);
});

test('un rol personalizado solo entra al inventario cuando tiene un permiso de producto', async () => {
  const guards=routeGuards('/products/query','post');
  const stockkeeper:AuthUser={id:'606',firstName:'Encargado',lastName:'Depósito',email:'stock@example.test',phone:null,role:'ENCARGADO_DE_DEPOSITO',permissions:['products.update_stock']};
  const noGrant={...stockkeeper,permissions:[]};
  assert.equal(await runGuards(guards,stockkeeper),undefined);
  const error=await runGuards(guards,noGrant);
  assert.ok(error instanceof AppError);
  assert.equal((error as AppError).status,403);
});

test('authenticate rechaza una cuenta desactivada antes de cargar permisos', async () => {
  const priorSecret = process.env.JWT_ACCESS_SECRET;
  process.env.JWT_ACCESS_SECRET = 'authorization-boundary-test-secret-0123456789abcdef';
  try {
    const token = signTestToken('505');
    let permissionQuery = false;
    await withDatabaseMock(sql => {
      if (sql.includes('FROM users u JOIN roles r')) return [{
        id: '505', first_name: 'Inactivo', last_name: 'Prueba', email: 'inactive@example.test', phone: null,
        profile_photo_url: null, password_hash: 'unused', is_active: 0, email_verified_at: new Date(),
        session_version: 0, must_change_password: 0, role: 'ADMIN', role_name: 'Administrador',
      } as unknown as RowDataPacket];
      if (sql.includes('p.code,p.name')) permissionQuery = true;
      return [];
    }, async () => {
      const result = await runAuthentication(token);
      assert.ok(result.error instanceof AppError);
      assert.equal((result.error as AppError).status, 401);
      assert.equal(result.user, undefined);
    });
    assert.equal(permissionQuery, false);
  } finally {
    if (priorSecret === undefined) delete process.env.JWT_ACCESS_SECRET;
    else process.env.JWT_ACCESS_SECRET = priorSecret;
  }
});

test('authenticate vuelve a leer permisos revocados y el endpoint directo los deniega', async () => {
  const priorSecret = process.env.JWT_ACCESS_SECRET;
  process.env.JWT_ACCESS_SECRET = 'authorization-boundary-test-secret-0123456789abcdef';
  try {
    const token = signTestToken(admin.id);
    let permissionRead = 0;
    const userRow = {
      id: admin.id, first_name: admin.firstName, last_name: admin.lastName, email: admin.email,
      phone: null, profile_photo_url: null, password_hash: 'unused', is_active: 1,
      email_verified_at: new Date(), session_version: 0, must_change_password: 0,
      role: 'ADMIN', role_name: 'Administrador',
    } as unknown as RowDataPacket;
    await withDatabaseMock(sql => {
      if (sql.includes('SELECT u.id, u.first_name')) return [userRow];
      if (sql.includes('p.code,p.name')) {
        permissionRead += 1;
        return [{ code: 'users.manage', name: 'Usuarios', description: '', module_code: 'users', is_critical: 0,
          inherited: 0, override_value: permissionRead === 1 ? 1 : 0 } as unknown as RowDataPacket];
      }
      if (sql.includes('FROM veterinarians WHERE user_id=?')) return [];
      return [];
    }, async () => {
      const first = await runAuthentication(token);
      assert.equal(first.error, undefined);
      assert.equal(first.user?.permissions?.includes('users.manage'), true);
      const firstCheck = await runGuards(routeGuards('/users/query', 'post'), first.user!);
      assert.equal(firstCheck, undefined);

      const second = await runAuthentication(token);
      assert.equal(second.error, undefined);
      assert.equal(second.user?.permissions?.includes('users.manage'), false);
      const secondCheck = await runGuards(routeGuards('/users/query', 'post'), second.user!);
      assert.ok(secondCheck instanceof AppError);
      assert.equal((secondCheck as AppError).status, 403);
    });
    assert.equal(permissionRead, 2);
  } finally {
    if (priorSecret === undefined) delete process.env.JWT_ACCESS_SECRET;
    else process.env.JWT_ACCESS_SECRET = priorSecret;
  }
});

test('endpoint administrativo directo rechaza solicitudes sin token Bearer', async () => {
  const response = { locals: {} as Record<string, unknown> };
  const error = await new Promise<unknown>(resolve => authenticate(
    { headers: {} } as Request,
    response as unknown as Response,
    next => resolve(next),
  ));
  assert.ok(error instanceof AppError);
  assert.equal((error as AppError).status, 401);
});
