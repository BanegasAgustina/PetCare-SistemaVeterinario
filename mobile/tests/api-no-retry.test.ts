import assert from 'node:assert/strict';
import { test } from 'node:test';
import { apiRequest, ApiError } from '../src/services/api';
import { publishNotificationChange, subscribeToNotificationChanges } from '../src/services/notification-events';

test('no repite automáticamente consultas que reciben errores de esquema o base no disponible', async () => {
  const previousFetch = globalThis.fetch;
  const previousApiUrl = process.env.EXPO_PUBLIC_API_URL;
  const previousDev = Object.getOwnPropertyDescriptor(globalThis, '__DEV__');
  const requests: string[] = [];
  process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test/api';
  Object.defineProperty(globalThis, '__DEV__', { configurable: true, value: false });
  globalThis.fetch = async input => {
    requests.push(String(input));
    const code = requests.length === 1 ? 'SCHEMA_UPDATE_REQUIRED' : 'DB_UNAVAILABLE';
    return new Response(JSON.stringify({ success: false, error: { code, message: 'No disponible' } }), {
      status: code === 'DB_UNAVAILABLE' ? 503 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    for (const [index, code] of ['SCHEMA_UPDATE_REQUIRED', 'DB_UNAVAILABLE'].entries()) {
      await assert.rejects(apiRequest('/client/home',{method:'POST',body:{}}), error => error instanceof ApiError && error.code === code);
      assert.equal(requests.length, index + 1);
    }
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = previousApiUrl;
    if (previousDev) Object.defineProperty(globalThis, '__DEV__', previousDev);
    else delete (globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__;
  }
});

test('los cambios reales de notificaciones actualizan una vez las vistas suscritas', () => {
  let screenRefreshes = 0;
  let badgeRefreshes = 0;
  const unsubscribeScreen = subscribeToNotificationChanges(() => { screenRefreshes += 1; });
  const unsubscribeBadge = subscribeToNotificationChanges(() => { badgeRefreshes += 1; });

  publishNotificationChange();
  unsubscribeScreen();
  publishNotificationChange();
  unsubscribeBadge();

  assert.equal(screenRefreshes, 1);
  assert.equal(badgeRefreshes, 2);
});
