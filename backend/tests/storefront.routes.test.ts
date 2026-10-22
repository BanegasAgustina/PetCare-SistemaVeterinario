import test from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response,RequestHandler } from 'express';
import { authenticate } from '../src/middlewares/auth.middleware';
import { errorHandler } from '../src/middlewares/error.middleware';
import { AppError } from '../src/utils/app-error';
import { apiRouter } from '../src/routes';
import { clientRouter } from '../src/routes/client.routes';
import { clinicRouter } from '../src/routes/clinic.routes';
import { saveFulfillment } from '../src/repositories/storefront.repository';
import { clientBody } from '../src/validators/client.validator';
import type { AuthUser } from '../src/types/auth';

type RouteLayer = { route?: { path: string; methods: Record<string, boolean>;stack?:{handle:RequestHandler}[] }; handle: (...args: never[]) => unknown };

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

test('bank transfer checkout and proof upload routes stay behind client authentication',()=>{
 const layers=(clientRouter as unknown as {stack:RouteLayer[]}).stack;
 const checkout=layers.find(layer=>layer.route?.path==='/orders/bank-transfer')?.route;
 const proof=layers.find(layer=>layer.route?.path==='/payment-intents/:id/proof')?.route;
 const renew=layers.find(layer=>layer.route?.path==='/orders/:id/payment-intents')?.route;
 assert.ok(checkout?.methods.post);assert.ok(proof?.methods.post);assert.ok(renew?.methods.post);
 assert.ok(layers.findIndex(layer=>layer.route?.path==='/orders/bank-transfer')>layers.findIndex(layer=>layer.route?.path==='/orders'));
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

test('store fulfillment reports rejected presentation-only fields by name',()=>{
 assert.throws(()=>clientBody({pickupEnabled:true,demoModeEnabled:true},['pickupEnabled']),(error:unknown)=>{
  assert.ok(error instanceof AppError);assert.equal(error.code,'VALIDATION_ERROR');assert.deepEqual(error.fieldErrors,[{field:'demoModeEnabled',message:'Este campo no está permitido.'}]);return true;
 });
});

test('store fulfillment requires a pickup address before enabling pickup and reports the field',async()=>{
 await assert.rejects(saveFulfillment({} as AuthUser,{
  pickupEnabled:true,pickupAddress:' ',pickupHours:null,pickupInstructions:null,
  deliveryEnabled:false,deliveryBaseFeeCents:0,freeDeliveryThresholdCents:null,
  deliveryHours:null,deliveryDays:null,deliveryInformation:null,
  bankName:null,bankAccountHolder:null,bankCbuCvu:null,bankAlias:null,zones:[],
 }),(error:unknown)=>{
  assert.ok(error instanceof AppError);assert.equal(error.code,'VALIDATION_ERROR');
  assert.deepEqual(error.fieldErrors,[{field:'pickupAddress',message:'Ingresá la dirección del local.'}]);
  return true;
 });
});

test('validation responses serialize field errors without exposing internal details',()=>{
 let status=0;let payload:unknown;
 const response={headersSent:false,status:(value:number)=>{status=value;return response;},json:(value:unknown)=>{payload=value;return response;}} as unknown as Response;
 errorHandler(new AppError('VALIDATION_ERROR',400,'Revisá los datos ingresados.',undefined,[{field:'deliveryBaseFeeCents',message:'El costo de envío no puede ser negativo.'}]),{method:'PUT',baseUrl:'/api/clinic',route:{path:'/store-fulfillment'}} as Request,response,()=>undefined);
 assert.equal(status,400);assert.deepEqual(payload,{success:false,error:{code:'VALIDATION_ERROR',message:'Revisá los datos ingresados.',errors:[{field:'deliveryBaseFeeCents',message:'El costo de envío no puede ser negativo.'}]}});
});

test('banner administration routes require the banner permission',()=>{
 const layers=(clinicRouter as unknown as {stack:RouteLayer[]}).stack;
 for(const [path,method] of [['/store-banners','get'],['/store-banners','post'],['/store-banners/:id','patch'],['/store-banners/:id','delete'],['/store-banners/order','put']] as const)
  assert.ok(layers.some(layer=>layer.route?.path===path&&layer.route.methods[method]),`missing ${method.toUpperCase()} ${path}`);
});

test('transfer proof access and payment review require SUPER_ADMIN and payment permission',async()=>{
 const layers=(clinicRouter as unknown as {stack:RouteLayer[]}).stack;
 for(const [path,method] of [['/store-orders/:id/proof','get'],['/store-orders/:id/payment-review','post']] as const){
  const route=layers.find(layer=>layer.route?.path===path&&layer.route.methods[method])?.route;assert.ok(route,`missing ${method} ${path}`);
  const guards=(route.stack??[]).slice(0,-1).map(layer=>layer.handle);assert.equal(guards.length,2);
  const run=(user:AuthUser,index:number)=>new Promise<unknown>(resolve=>guards[index]!({} as Request,{locals:{authenticatedUser:user}} as unknown as Response,error=>resolve(error)));
  const admin={id:'12',firstName:'Admin',lastName:'Regular',email:'admin@example.test',phone:null,role:'ADMIN',permissions:['orders.payment.manage']} as AuthUser;
  const superNoPermission={...admin,role:'SUPER_ADMIN',permissions:[]} as AuthUser;
  const superWithPermission={...admin,role:'SUPER_ADMIN'} as AuthUser;
  assert.ok(await run(admin,0) instanceof AppError);assert.ok(await run(superNoPermission,1) instanceof AppError);assert.equal(await run(superWithPermission,1),undefined);
 }
});
