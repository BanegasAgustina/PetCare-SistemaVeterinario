import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { apiRequest, ApiError } from '../src/services/api';
import { clientService } from '../src/services/client.service';
import { clinicService } from '../src/services/clinic.service';
import type { FulfillmentSettings } from '../src/types/client';

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
  const request=async<T>(path:string,options?:{method?:'GET'|'POST'|'PUT'|'PATCH'|'DELETE';body?:unknown}):Promise<T>=>{requests.push({path,method:options?.method,body:options?.body});return {} as T;};
 const api=clientService(request);
 await api.checkout({requestKey:'3a3c6736-c93d-4ac4-b699-8d7a812e4eb1',paymentMethod:'BANK_TRANSFER',paymentReference:'OP-1234',fulfillmentMethod:'DELIVERY',address:{recipientName:'Ana',phone:'1112345678',street:'Calle Uno',streetNumber:'10',unit:'',city:'La Plata',province:'Buenos Aires',postalCode:'1900',reference:''}});
 assert.deepEqual(requests,[{path:'/client/orders',method:'POST',body:{requestKey:'3a3c6736-c93d-4ac4-b699-8d7a812e4eb1',paymentMethod:'BANK_TRANSFER',paymentReference:'OP-1234',fulfillmentMethod:'DELIVERY',address:{recipientName:'Ana',phone:'1112345678',street:'Calle Uno',streetNumber:'10',unit:'',city:'La Plata',province:'Buenos Aires',postalCode:'1900',reference:''}}}]);
});

test('real transfer and proof upload use the registered authenticated client routes',async()=>{
 const requests:{path:string;method?:string;body?:unknown;contentType?:string;headers?:Record<string,string>}[]=[];
 const request=async<T>(path:string,options?:{method?:'GET'|'POST'|'PUT'|'PATCH'|'DELETE';body?:unknown;contentType?:string;headers?:Record<string,string>}):Promise<T>=>{requests.push({path,method:options?.method,body:options?.body,contentType:options?.contentType,headers:options?.headers});return {} as T;};
 const api=clientService(request);await api.bankTransferCheckout({requestKey:'3a3c6736-c93d-4ac4-b699-8d7a812e4eb1',fulfillmentMethod:'PICKUP',buyerName:'Ana Cliente',buyerEmail:'ana@example.com',buyerDni:'12345678'});
 await api.uploadPaymentProof('27',new Blob(['%PDF-1.7']), 'application/pdf','OP-123');await api.renewTransferIntent('481');
 assert.equal(requests[0].path,'/client/orders/bank-transfer');assert.equal(requests[0].method,'POST');assert.equal((requests[0].body as Record<string,unknown>).buyerDni,'12345678');
 assert.deepEqual({path:requests[1].path,method:requests[1].method,contentType:requests[1].contentType,headers:requests[1].headers},{path:'/client/payment-intents/27/proof',method:'POST',contentType:'application/pdf',headers:{'X-Payment-Reference':'OP-123'}});assert.equal(requests[2].path,'/client/orders/481/payment-intents');
});

test('clinical sections keep a route back to the client home through their shared header',async()=>{
 const root=path.resolve(process.cwd(),'src');
 const [home,header,clinical,...routes]=await Promise.all(['app/client/(tabs)/index.tsx','components/client/PetCareUI.tsx','components/client/ClinicalScreen.tsx','app/client/medical-history.tsx','app/client/vaccines.tsx','app/client/prescriptions.tsx'].map(file=>readFile(path.join(root,file),'utf8')));
 for(const route of routes)assert.match(route,/ClinicalScreen/);
 assert.match(home,/router\.push\('\/client\/medical-history'\)/);assert.match(home,/router\.push\('\/client\/vaccines'\)/);assert.match(home,/router\.push\('\/client\/prescriptions'\)/);
 assert.match(clinical,/PetCareHeader[^>]+homeBack/);assert.match(header,/homeBack\?router\.replace\(roleHome\(user\)\)/);
});

test('shared PetCare background keeps the original decor visible and non-interactive', async () => {
  const root = path.resolve(process.cwd(), 'src');
  const [petCare, screenContainer] = await Promise.all([
    readFile(path.join(root, 'components/client/PetCareUI.tsx'), 'utf8'),
    readFile(path.join(root, 'components/layout/ScreenContainer.tsx'), 'utf8'),
  ]);
  assert.match(petCare, /pointerEvents="none" accessible=\{false\} style=\{styles\.decoration\}/);
  assert.equal((petCare.match(/<Ionicons name="paw"/g) ?? []).length, 6);
  assert.equal((petCare.match(/<Ionicons name="leaf/g) ?? []).length, 3);
  assert.equal((petCare.match(/<Ionicons name="heart/g) ?? []).length, 2);
  assert.match(petCare, /opacity:0\.09/);
  assert.match(petCare, /🐱/);
  assert.match(petCare, /🐶/);
  assert.match(screenContainer, /pointerEvents="none" accessible=\{false\} style=\{styles\.decoration\}/);
});

test('administrator store settings read and write the existing clinic configuration endpoint', async () => {
  const requests: { path: string; method?: string; body?: unknown }[] = [];
  const request = async <T,>(path: string, options?: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown }): Promise<T> => {
    requests.push({ path, method: options?.method, body: options?.body });
    return {} as T;
  };
  const api = clinicService(request);
  await api.storeFulfillment();
  const settings: FulfillmentSettings = { demoModeEnabled:true,pickupEnabled:true,pickupAddress:'Mitre 123',pickupHours:'9 a 18',pickupInstructions:null,deliveryEnabled:true,deliveryBaseFeeCents:120000,freeDeliveryThresholdCents:null,deliveryHours:null,deliveryDays:null,deliveryInformation:null,bankName:null,bankAccountHolder:null,bankCbuCvu:null,bankAlias:null,zones:[{id:'7',name:'Centro',province:'Buenos Aires',city:'La Plata',postalCodePrefix:null,feeCents:150000,isActive:true}] };
  await api.saveStoreFulfillment(settings);
  assert.equal(requests[0]?.path,'/clinic/store-fulfillment');
  assert.equal(requests[1]?.path,'/clinic/store-fulfillment');assert.equal(requests[1]?.method,'PUT');
  assert.deepEqual(requests[1]?.body,{pickupEnabled:true,pickupAddress:'Mitre 123',pickupHours:'9 a 18',pickupInstructions:null,deliveryEnabled:true,deliveryBaseFeeCents:120000,freeDeliveryThresholdCents:null,deliveryHours:null,deliveryDays:null,deliveryInformation:null,bankName:null,bankAccountHolder:null,bankCbuCvu:null,bankAlias:null,zones:[{id:'7',name:'Centro',province:'Buenos Aires',city:'La Plata',postalCodePrefix:null,feeCents:150000,isActive:true}]});
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

    globalThis.fetch = (async () => new Response(JSON.stringify({ success:false,error:{code:'VALIDATION_ERROR',message:'El costo de envío no puede ser negativo.',errors:[{field:'deliveryBaseFeeCents',message:'El costo de envío no puede ser negativo.'}]} }), { status:400 })) as typeof fetch;
    await assert.rejects(apiRequest('/clinic/store-fulfillment',{method:'PUT',body:{}}),(error:unknown)=>{
      assert.ok(error instanceof ApiError);assert.equal(error.message,'El costo de envío no puede ser negativo.');assert.deepEqual(error.fieldErrors,[{field:'deliveryBaseFeeCents',message:'El costo de envío no puede ser negativo.'}]);return true;
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
  assert.match(checkout, /Pedido de demostración registrado/);
  assert.match(checkout, /Crypto\.randomUUID/);
  assert.match(checkout, /validateDemoCard\(card\)/);
  assert.match(checkout, /Transferencia bancaria\{!transferConfigured\?' · No disponible':''\}/);
  assert.match(checkout, /Tarjeta de prueba · No disponible/);
  assert.match(checkout, /STORE_DEMO_MODE=true/);
  assert.match(checkout, /Medios de pago no disponibles/);
  assert.match(checkout, /secureTextEntry/);
  assert.doesNotMatch(checkout, /api\.checkout\(\{[^}]*card\./s);
});
