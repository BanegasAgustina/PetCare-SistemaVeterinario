import test from 'node:test';
import assert from 'node:assert/strict';
import { adminRouter } from '../src/routes/admin.routes';
import { authRouter } from '../src/routes/auth.routes';
import { clientRouter } from '../src/routes/client.routes';
import { clinicRouter } from '../src/routes/clinic.routes';
import { apiRouter } from '../src/routes';
import { notificationJobsRouter } from '../src/routes/notification-jobs.routes';
import { publicSettingsRouter } from '../src/routes/settings.routes';
import { veterinarianAdminRouter, veterinarianPanelRouter, specialtiesAdminRouter } from '../src/routes/veterinarian.routes';

type Route = { path: string; methods: Record<string, boolean> };
type RouterStack = { stack: { route?: Route }[] };
const routes = (router: unknown) => (router as RouterStack).stack.flatMap(layer => layer.route ? [layer.route] : []);
const assertPost = (router: unknown, path: string) => assert.ok(routes(router).some(route => route.path === path && route.methods.post), `missing POST ${path}`);

test('las lecturas privadas usan POST y conservan rutas separadas de las escrituras de colección', () => {
  for (const router of [clientRouter, clinicRouter, adminRouter, veterinarianAdminRouter, veterinarianPanelRouter, specialtiesAdminRouter]) {
    assert.equal(routes(router).some(route => route.methods.get), false, 'no deben quedar lecturas internas por GET');
  }
  for (const [router, path] of [
    [clientRouter, '/pets/query'], [clientRouter, '/appointments/query'], [clientRouter, '/orders/query'],
    [clientRouter, '/notifications/preferences/query'], [clinicRouter, '/reservations/query'],
    [clinicRouter, '/store-banners/query'], [clinicRouter, '/admin/:kind/query'],
    [adminRouter, '/users/query'], [adminRouter, '/products/query'], [adminRouter, '/roles/query'],
    [veterinarianAdminRouter, '/query'], [specialtiesAdminRouter, '/query'],
  ] as const) assertPost(router, path);

  const rolePosts = routes(adminRouter).filter(route => route.path === '/roles' && route.methods.post);
  assert.equal(rolePosts.length, 1, 'POST /roles debe seguir reservado para crear roles');
  assertPost(adminRouter, '/roles/query');
});

test('los GET protocolarios y recursos públicos siguen disponibles', () => {
  assert.ok(routes(authRouter).some(route => route.path === '/oauth/:provider/callback' && route.methods.get));
  assert.ok(routes(apiRouter).some(route => route.path === '/health' && route.methods.get));
  assert.ok(routes(apiRouter).some(route => route.path === '/health/database' && route.methods.get));
  assert.ok(routes(publicSettingsRouter).some(route => route.path === '/general-information' && route.methods.get));
  assert.ok(routes(notificationJobsRouter).some(route => route.path === '/' && route.methods.get));
  assertPost(authRouter, '/me');
});
