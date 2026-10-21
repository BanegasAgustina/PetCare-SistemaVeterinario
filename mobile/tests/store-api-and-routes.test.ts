import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { apiRequest, ApiError } from '../src/services/api';
import { clientService } from '../src/services/client.service';
import { clinicService } from '../src/services/clinic.service';

test('client store services call the registered route suffixes', async () => {
  const paths: string[] = [];
  const request = async <T,>(endpoint: string): Promise<T> => { paths.push(endpoint); return [] as T; };
  const api = clientService(request);
  await api.promotions();
  await api.banners();
  await api.fulfillment();
  assert.deepEqual(paths, ['/client/store/promotions', '/client/store/banners', '/client/store/fulfillment']);
});

test('client checkout submits only an idempotency key, configured payment type and delivery details',async()=>{
 const requests:{path:string;method?:string;body?:unknown}[]=[];
 const request=async<T>(path:string,options?:{method?:'GET'|'POST'|'PUT'|'PATCH';body?:unknown}):Promise<T>=>{requests.push({path,method:options?.method,body:options?.body});return {} as T;};
 const api=clientService(request);
 await api.checkout({requestKey:'3a3c6736-c93d-4ac4-b699-8d7a812e4eb1',paymentMethod:'BANK_TRANSFER',paymentReference:'OP-1234',fulfillmentMethod:'DELIVERY',address:{recipientName:'Ana',phone:'1112345678',street:'Calle Uno',streetNumber:'10',unit:'',city:'La Plata',province:'Buenos Aires',postalCode:'1900',reference:''}});
 assert.deepEqual(requests,[{path:'/client/orders',method:'POST',body:{requestKey:'3a3c6736-c93d-4ac4-b699-8d7a812e4eb1',paymentMethod:'BANK_TRANSFER',paymentReference:'OP-1234',fulfillmentMethod:'DELIVERY',address:{recipientName:'Ana',phone:'1112345678',street:'Calle Uno',streetNumber:'10',unit:'',city:'La Plata',province:'Buenos Aires',postalCode:'1900',reference:''}}}]);
});

test('administrator store settings read and write the existing clinic configuration endpoint', async () => {
  const requests: { path: string; method?: string }[] = [];
  const request = async <T,>(path: string, options?: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' }): Promise<T> => {
    requests.push({ path, method: options?.method });
    return {} as T;
  };
  const api = clinicService(request);
  await api.storeFulfillment();
  await api.saveStoreFulfillment({ pickupEnabled: true, deliveryEnabled: false, zones: [] });
  assert.deepEqual(requests, [
    { path: '/clinic/store-fulfillment', method: undefined },
    { path: '/clinic/store-fulfillment', method: 'PUT' },
  ]);
});

test('API adds /api once, accepts an empty promotions list and reports stale route 404s clearly', async () => {
  const oldFetch = globalThis.fetch;
  const oldDev = Object.getOwnPropertyDescriptor(globalThis, '__DEV__');
  const oldApiUrl = process.env.EXPO_PUBLIC_API_URL;
  const requests: string[] = [];
  Object.defineProperty(globalThis, '__DEV__', { configurable: true, value: true });
  process.env.EXPO_PUBLIC_API_URL = 'https://petcare.example/api';
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    requests.push(String(input));
    return new Response(JSON.stringify({ success: true, data: [] }), { status: 200 });
  }) as typeof fetch;
  try {
    assert.deepEqual(await apiRequest('/client/store/promotions'), []);
    assert.equal(requests[0], 'https://petcare.example/api/client/store/promotions');

    globalThis.fetch = (async () => new Response(JSON.stringify({
      success: false, error: { code: 'NOT_FOUND', message: 'Ruta no encontrada.' },
    }), { status: 404 })) as typeof fetch;
    await assert.rejects(apiRequest('/client/store/promotions'), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 404);
      assert.match(error.message, /backend conectado todavía no tiene esta ruta/);
      return true;
    });
  } finally {
    globalThis.fetch = oldFetch;
    if (oldDev) Object.defineProperty(globalThis, '__DEV__', oldDev);
    else Reflect.deleteProperty(globalThis, '__DEV__');
    if (oldApiUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = oldApiUrl;
  }
});

test('store checkout routes connect storefront, product, cart, delivery and checkout', async () => {
  const root = path.resolve(__dirname, '../src/app/client/(tabs)/store');
  const routes = ['index.tsx', '[id].tsx', 'cart.tsx', 'delivery.tsx', 'checkout.tsx'];
  for (const route of routes) await readFile(path.join(root, route), 'utf8');
  const [store, product, cart, delivery] = await Promise.all([
    readFile(path.join(root, 'index.tsx'), 'utf8'),
    readFile(path.join(root, '[id].tsx'), 'utf8'),
    readFile(path.join(root, 'cart.tsx'), 'utf8'),
    readFile(path.join(root, 'delivery.tsx'), 'utf8'),
  ]);
  assert.match(store, /router\.navigate\('\/client\/store\/cart'\)/);
  assert.match(product, /router\.push\('\/client\/store\/cart'\)/);
  assert.match(cart, /router\.push\('\/client\/store\/checkout'\)/);
  assert.match(delivery, /Redirect href="\/client\/store\/checkout"/);
  const checkout = await readFile(path.join(root, 'checkout.tsx'), 'utf8');
  assert.match(checkout, /api\.checkout\(/);
  assert.match(checkout, /Pedido registrado/);
  assert.match(checkout, /Crypto\.randomUUID/);
  assert.doesNotMatch(checkout, /cardNumber|securityCode|secureTextEntry/);
});
