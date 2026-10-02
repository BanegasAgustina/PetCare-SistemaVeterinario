/// <reference types="node" />
/** Verifica validación y contratos de red sin simular componentes ni almacenar secretos. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateLoginForm, validateRegisterForm } from '../src/utils/auth-validation';
import { register, login, getCurrentUser } from '../src/services/auth.service';
import { ApiError, apiRequest } from '../src/services/api';

const values = { firstName: 'María', lastName: 'Pérez', email: ' MARIA@example.com ', phone: '+54 11 1234-5678', password: 'Prueba!123', confirmPassword: 'Prueba!123' };
const user = { id: '1', firstName: 'María', lastName: 'Pérez', email: 'maria@example.com', phone: '+541112345678', role: 'CLIENT', permissions: [], veterinarian: null };
test('validaciones frontend y confirmación local', () => {
  assert.deepEqual(validateRegisterForm(values), {});
  assert.ok(validateRegisterForm({ ...values, confirmPassword: 'Otra!123' }).confirmPassword);
  assert.ok(validateRegisterForm({ ...values, firstName: 'Ana2' }).firstName);
  assert.ok(validateRegisterForm({ ...values, lastName: '' }).lastName);
  assert.ok(validateRegisterForm({ ...values, email: 'inválido' }).email);
  assert.ok(validateRegisterForm({ ...values, phone: 'abc' }).phone);
  assert.ok(validateRegisterForm({ ...values, password: 'corta' }).password);
  assert.ok(validateRegisterForm({ ...values, password: `Aa1!${'é'.repeat(35)}` }).password);
  assert.ok(validateLoginForm({ email: '', password: '' }).email);
});
test('services envían solo campos permitidos y /me usa Bearer', async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.EXPO_PUBLIC_API_URL;
  process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000/api';
  const calls: { url: string; options?: RequestInit }[] = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    const data = String(url).endsWith('/login') ? { user, accessToken: 'test-token', tokenType: 'Bearer', expiresIn: 900 } : { user, verification: { verificationToken: 'a'.repeat(64), maskedEmail: 'ma***@example.com', retryAfterSeconds: 45, expiresAt: new Date(Date.now() + 600000).toISOString(), delivery: 'sent' } };
    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  };
  try {
    assert.deepEqual((await register(values)).user, user);
    const body = JSON.parse(calls[0].options?.body as string);
    assert.equal(body.email, 'maria@example.com');
    assert.equal(body.password, values.password);
    assert.equal(body.confirmPassword, undefined); assert.equal(body.role, undefined);
    const session = await login(values);
    assert.deepEqual(await getCurrentUser(session.accessToken), user);
    assert.equal((calls[2].options?.headers as Record<string, string>).Authorization, 'Bearer test-token');
  } finally { globalThis.fetch = originalFetch; if (originalUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = originalUrl; }
});
test('errores SQL remotos y errores de red se muestran como mensajes seguros', async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.EXPO_PUBLIC_API_URL;
  process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000/api';
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ success: false, error: { code: 'DB_ERROR', message: 'SQL información privada' } }), { status: 500 });
    await assert.rejects(apiRequest('/auth/login'), (error: unknown) => error instanceof ApiError && error.status === 500 && !error.message.includes('SQL'));
    globalThis.fetch = async () => { throw new Error('Detalle privado'); };
    await assert.rejects(apiRequest('/auth/login'), { code: 'NETWORK_ERROR' });
    delete process.env.EXPO_PUBLIC_API_URL;
    await assert.rejects(apiRequest('/auth/login'), { code: 'API_NOT_CONFIGURED' });
  } finally { globalThis.fetch = originalFetch; if (originalUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = originalUrl; }
});

test('/me vuelve a leer permisos revocados y perfil veterinario desde backend',async()=>{
  const originalFetch=globalThis.fetch;const originalUrl=process.env.EXPO_PUBLIC_API_URL;
  process.env.EXPO_PUBLIC_API_URL='http://localhost:3000/api';
  let permissions=['vaccines.view','appointments.view_own'];
  const profile={id:'44',licenseNumber:'MP-test',specialties:[{id:'7',name:'Catálogo de prueba'}]};
  globalThis.fetch=async()=>new Response(JSON.stringify({success:true,data:{user:{...user,role:'VETERINARIAN',permissions,veterinarian:profile}}}),{status:200});
  try {
    const before=await getCurrentUser('test-token');assert.ok(before.permissions?.includes('vaccines.view'));assert.deepEqual(before.veterinarian,profile);
    permissions=['appointments.view_own'];
    const after=await getCurrentUser('test-token');assert.ok(!after.permissions?.includes('vaccines.view'));assert.deepEqual(after.permissions,permissions);
  } finally {globalThis.fetch=originalFetch;if(originalUrl===undefined)delete process.env.EXPO_PUBLIC_API_URL;else process.env.EXPO_PUBLIC_API_URL=originalUrl;}
});
