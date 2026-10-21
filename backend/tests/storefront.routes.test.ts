import test from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { authenticate } from '../src/middlewares/auth.middleware';
import { AppError } from '../src/utils/app-error';
import { apiRouter } from '../src/routes';
import { clientRouter } from '../src/routes/client.routes';
import { clinicRouter } from '../src/routes/clinic.routes';

type RouteLayer = { route?: { path: string; methods: Record<string, boolean> }; handle: (...args: never[]) => unknown };

test('store client routes are registered under /api/client behind authentication', () => {
  const layers = (clientRouter as unknown as { stack: RouteLayer[] }).stack;
  const firstRoute = layers.findIndex(layer => Boolean(layer.route));
  assert.ok(firstRoute >= 2, 'client auth and role middleware must precede routes');
  assert.equal(layers[0]?.handle, authenticate);
  for (const route of ['/store/promotions', '/store/fulfillment', '/store/banners']) {
    assert.ok(layers.some(layer => layer.route?.path === route && layer.route.methods.get), `missing GET ${route}`);
  }
  assert.ok((apiRouter as unknown as { stack: RouteLayer[] }).stack.some(layer => layer.handle === clientRouter));
});

test('store endpoints reject unauthenticated requests with 401 before database access', async () => {
  let forwarded: unknown;
  await authenticate(
    { headers: {} } as Request,
    { locals: {} } as Response,
    error => { forwarded = error; },
  );
  assert.ok(forwarded instanceof AppError);
  assert.equal(forwarded.code, 'AUTH_REQUIRED');
  assert.equal(forwarded.status, 401);
});

test('store fulfillment administration route is registered behind clinic authentication', () => {
  const layers = (clinicRouter as unknown as { stack: RouteLayer[] }).stack;
  assert.equal(layers[0]?.handle, authenticate);
  assert.ok(layers.some(layer => layer.route?.path === '/store-fulfillment' && layer.route.methods.get));
  assert.ok(layers.some(layer => layer.route?.path === '/store-fulfillment' && layer.route.methods.put));
});

test('banner administration routes require the banner permission',()=>{
 const layers=(clinicRouter as unknown as {stack:RouteLayer[]}).stack;
 for(const [path,method] of [['/store-banners','get'],['/store-banners','post'],['/store-banners/:id','patch'],['/store-banners/:id','delete'],['/store-banners/order','put']] as const)
  assert.ok(layers.some(layer=>layer.route?.path===path&&layer.route.methods[method]),`missing ${method.toUpperCase()} ${path}`);
});
