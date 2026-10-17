import test from 'node:test';
import assert from 'node:assert/strict';
import { clearWebOAuthProof, clearWebSession, hasWebOAuthProof, readWebOAuthProof, readWebSession, saveWebOAuthProof, saveWebSession } from '../src/services/web-session-store';
import type { StoredSession } from '../src/types/auth';

test('web session survives a fresh read and is cleared on logout', () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { sessionStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
    } },
  });
  try {
    const session: StoredSession = { accessToken: 'access-token', refreshToken: 'a'.repeat(64), expiresAt: 123456 };
    saveWebSession(session);
    assert.deepEqual(readWebSession(), session);
    clearWebSession();
    assert.equal(readWebSession(), null);
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});

test('invalid web session data is discarded', () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const values = new Map<string, string>([['petcare.access-session', '{"accessToken":""}']]);
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { sessionStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
    } },
  });

  test('web OAuth proof survives the provider redirect and expires after ten minutes', () => {
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
    const values = new Map<string, string>();
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { sessionStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => { values.set(key, value); },
        removeItem: (key: string) => { values.delete(key); },
      } },
    });
    try {
      const proof='b'.repeat(64);
      saveWebOAuthProof(proof);
      assert.equal(hasWebOAuthProof(), true);
      assert.equal(readWebOAuthProof(), proof);
      values.set('petcare.oauth-proof', JSON.stringify({ proof, createdAt: Date.now() - 11 * 60 * 1000 }));
      assert.equal(readWebOAuthProof(), null);
      assert.equal(values.has('petcare.oauth-proof'), false);
      saveWebOAuthProof(proof);
      clearWebOAuthProof();
      assert.equal(hasWebOAuthProof(), false);
    } finally {
      if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
      else Reflect.deleteProperty(globalThis, 'window');
    }
  });
  try {
    assert.equal(readWebSession(), null);
    assert.equal(values.has('petcare.access-session'), false);
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});
