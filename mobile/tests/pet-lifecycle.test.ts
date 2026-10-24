import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { clientService } from '../src/services/client.service';

describe('pet lifecycle API', () => {
  it('lists inactive pets only when the owner requests them', async () => {
    const requests: { path: string; method?: string; body?: unknown }[] = [];
    const api = clientService(async (path, options) => { requests.push({ path, method: options?.method, body: options?.body }); return [] as never; });
    await api.pets();
    await api.pets(true);
    assert.deepEqual(requests, [
      { path: '/client/pets/query', method: 'POST', body: {} },
      { path: '/client/pets/query', method: 'POST', body: { includeInactive: 'true' } },
    ]);
  });

  it('reactivates an owned pet through the authenticated client route', async () => {
    const requests: { path: string; method?: string; body?: unknown }[] = [];
    const api = clientService(async (path, options) => { requests.push({ path, method: options?.method, body: options?.body }); return {} as never; });
    await api.reactivatePet('42');
    assert.deepEqual(requests, [{ path: '/client/pets/42/reactivate', method: 'PATCH', body: {} }]);
  });
});
