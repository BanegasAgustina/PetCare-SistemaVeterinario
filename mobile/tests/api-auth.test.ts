import assert from 'node:assert/strict';
import test from 'node:test';
import { AUTH_REQUEST_TIMEOUT_MS, ApiError, apiRequest, buildApiEndpoint, developmentApiUrl, requestFailureCode, requestTimeoutMs, resolveApiUrl } from '../src/services/api';
import * as authApi from '../src/services/auth.service';

const productionApi = 'https://pet-care-sistema-veterinario.vercel.app/api';

test('Expo Go development config resolves the production API and keeps /api in auth URLs', async () => {
  const configured = developmentApiUrl(undefined, '192.168.1.20:8081', undefined, true, productionApi);
  assert.equal(configured, productionApi);
  assert.equal(resolveApiUrl(configured, 'development', true, true), productionApi);
  assert.equal(buildApiEndpoint(productionApi, '/auth/login'), `${productionApi}/auth/login`);
  assert.equal(buildApiEndpoint(productionApi, '/api/auth/refresh'), `${productionApi}/auth/refresh`);
});

test('login and refresh call /api endpoints and receive the auth timeout allowance', async () => {
  const oldApiUrl = process.env.EXPO_PUBLIC_DEV_API_URL;
  const oldAppEnv = process.env.EXPO_PUBLIC_APP_ENV;
  const oldDev = (globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__;
  const oldFetch = globalThis.fetch;
  const requestedUrls: string[] = [];
  const requestIds: string[] = [];
  (globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ = true;
  process.env.EXPO_PUBLIC_DEV_API_URL = productionApi;
  process.env.EXPO_PUBLIC_APP_ENV = 'development';
  globalThis.fetch = (async (input: RequestInfo | URL, init?:RequestInit) => {
    requestedUrls.push(String(input));
    const requestId=new Headers(init?.headers).get('X-Request-ID');
    assert.ok(requestId);
    requestIds.push(requestId);
    return new Response(JSON.stringify({
      success: true,
      data: {
        user: { id: '1', firstName: 'Ana', lastName: 'Vega', email: 'ana@example.com', phone: null, role: 'CLIENT', permissions: [] },
        accessToken: 'access-token', tokenType: 'Bearer', expiresIn: 900, refreshToken: 'a'.repeat(64),
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;

  try {
    await authApi.login({ email: 'ana@example.com', password: 'valid-password' });
    await authApi.refresh('a'.repeat(64));
    assert.deepEqual(requestedUrls, [
      `${productionApi}/auth/login`,
      `${productionApi}/auth/refresh`,
    ]);
    assert.equal(new Set(requestIds).size,2,'cada solicitud debe tener un ID de correlación distinto');
    assert.equal(requestTimeoutMs('/auth/login'), AUTH_REQUEST_TIMEOUT_MS);
    assert.equal(requestTimeoutMs('/api/auth/refresh'), AUTH_REQUEST_TIMEOUT_MS);
    assert.equal(requestTimeoutMs('/auth/me'), 12000);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldApiUrl === undefined) delete process.env.EXPO_PUBLIC_DEV_API_URL;
    else process.env.EXPO_PUBLIC_DEV_API_URL = oldApiUrl;
    if (oldAppEnv === undefined) delete process.env.EXPO_PUBLIC_APP_ENV;
    else process.env.EXPO_PUBLIC_APP_ENV = oldAppEnv;
    if (oldDev === undefined) delete (globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__;
    else (globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ = oldDev;
  }
});

test('clasifica timeout y error de red por separado sin inferir DNS o TLS',()=>{
  assert.equal(requestFailureCode(true),'REQUEST_TIMEOUT');
  assert.equal(requestFailureCode(false),'NETWORK_ERROR');
});

test('registra error de red con endpoint y duración sin incluir cuerpo sensible',async()=>{
  const oldApiUrl=process.env.EXPO_PUBLIC_DEV_API_URL;
  const oldAppEnv=process.env.EXPO_PUBLIC_APP_ENV;
  const oldDev=(globalThis as typeof globalThis & {__DEV__?:boolean}).__DEV__;
  const oldFetch=globalThis.fetch;
  const oldWarn=console.warn;
  const warnings:unknown[][]=[];
  (globalThis as typeof globalThis & {__DEV__?:boolean}).__DEV__=true;
  process.env.EXPO_PUBLIC_DEV_API_URL=productionApi;
  process.env.EXPO_PUBLIC_APP_ENV='development';
  globalThis.fetch=(async()=>{throw new TypeError('Network request failed');}) as typeof fetch;
  console.warn=(...args:unknown[])=>warnings.push(args);
  try{
    await assert.rejects(apiRequest('/auth/login',{method:'POST',body:{email:'hidden@example.test',password:'must-not-be-logged'}}),(error:unknown)=>error instanceof ApiError&&error.code==='NETWORK_ERROR');
    const record=JSON.parse(String(warnings[0]?.[1])) as Record<string,unknown>;
    assert.equal(record.endpoint,`${productionApi}/auth/login`);
    assert.equal(record.code,'NETWORK_ERROR');
    assert.equal(record.status,0);
    assert.equal(typeof record.durationMs,'number');
    assert.equal(typeof record.requestId,'string');
    assert.equal(JSON.stringify(record).includes('must-not-be-logged'),false);
  }finally{
    globalThis.fetch=oldFetch;console.warn=oldWarn;
    if(oldApiUrl===undefined)delete process.env.EXPO_PUBLIC_DEV_API_URL;else process.env.EXPO_PUBLIC_DEV_API_URL=oldApiUrl;
    if(oldAppEnv===undefined)delete process.env.EXPO_PUBLIC_APP_ENV;else process.env.EXPO_PUBLIC_APP_ENV=oldAppEnv;
    if(oldDev===undefined)delete (globalThis as typeof globalThis & {__DEV__?:boolean}).__DEV__;else (globalThis as typeof globalThis & {__DEV__?:boolean}).__DEV__=oldDev;
  }
});

test('un abort causado por el timer queda registrado como timeout y correlacionado',async()=>{
  const oldApiUrl=process.env.EXPO_PUBLIC_DEV_API_URL;
  const oldAppEnv=process.env.EXPO_PUBLIC_APP_ENV;
  const oldDev=(globalThis as typeof globalThis & {__DEV__?:boolean}).__DEV__;
  const oldFetch=globalThis.fetch;
  const oldWarn=console.warn;
  const oldSetTimeout=globalThis.setTimeout;
  const warnings:unknown[][]=[];
  (globalThis as typeof globalThis & {__DEV__?:boolean}).__DEV__=true;
  process.env.EXPO_PUBLIC_DEV_API_URL=productionApi;
  process.env.EXPO_PUBLIC_APP_ENV='development';
  globalThis.setTimeout=((handler:TimerHandler,delay?:number,...args:unknown[])=>{
    if(delay===AUTH_REQUEST_TIMEOUT_MS){const handle=oldSetTimeout(()=>undefined,60000);queueMicrotask(()=>{if(typeof handler==='function')handler(...args);});return handle;}
    return oldSetTimeout(handler,delay,...args);
  }) as typeof setTimeout;
  globalThis.fetch=(async(_input:RequestInfo|URL,init?:RequestInit)=>new Promise<Response>((_resolve,reject)=>{
    const signal=init?.signal as AbortSignal;
    if(signal.aborted)reject(new DOMException('Aborted','AbortError'));
    else signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});
  })) as typeof fetch;
  console.warn=(...args:unknown[])=>warnings.push(args);
  try{
    await assert.rejects(apiRequest('/auth/login',{method:'POST',body:{email:'hidden@example.test',password:'must-not-be-logged'}}),(error:unknown)=>error instanceof ApiError&&error.code==='REQUEST_TIMEOUT');
    const record=JSON.parse(String(warnings[0]?.[1])) as Record<string,unknown>;
    assert.equal(record.code,'REQUEST_TIMEOUT');
    assert.equal(record.timedOut,true);
    assert.equal(record.status,0);
    assert.equal(typeof record.requestId,'string');
    assert.equal(typeof record.durationMs,'number');
    assert.equal(JSON.stringify(record).includes('must-not-be-logged'),false);
  }finally{
    globalThis.setTimeout=oldSetTimeout;globalThis.fetch=oldFetch;console.warn=oldWarn;
    if(oldApiUrl===undefined)delete process.env.EXPO_PUBLIC_DEV_API_URL;else process.env.EXPO_PUBLIC_DEV_API_URL=oldApiUrl;
    if(oldAppEnv===undefined)delete process.env.EXPO_PUBLIC_APP_ENV;else process.env.EXPO_PUBLIC_APP_ENV=oldAppEnv;
    if(oldDev===undefined)delete (globalThis as typeof globalThis & {__DEV__?:boolean}).__DEV__;else (globalThis as typeof globalThis & {__DEV__?:boolean}).__DEV__=oldDev;
  }
});
