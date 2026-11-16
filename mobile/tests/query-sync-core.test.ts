import assert from 'node:assert/strict';
import { test } from 'node:test';
import { QuerySyncCoordinator } from '../src/services/query-sync-core';

function flush(): Promise<void> { return new Promise(resolve => setImmediate(resolve)); }

test('polls only after the configured interval and stops while inactive', async () => {
  let now = 0;
  let calls = 0;
  const sync = new QuerySyncCoordinator(() => now);
  sync.subscribe(() => { calls += 1; }, 10_000);

  sync.tick();
  assert.equal(calls, 0);
  now = 10_000;
  sync.setActive(false);
  sync.tick();
  assert.equal(calls, 0);
  sync.setActive(true);
  await flush();
  assert.equal(calls, 1);
});

test('invalidates every active query immediately after a local change', async () => {
  let now = 0;
  const calls: string[] = [];
  const sync = new QuerySyncCoordinator(() => now);
  sync.subscribe(() => { calls.push('agenda'); }, 10_000);
  sync.subscribe(() => { calls.push('catalog'); }, 30_000);

  sync.invalidateAll();
  await flush();
  assert.deepEqual(calls, ['agenda', 'catalog']);
});

test('limits parallel refreshes and picks up queued queries when one finishes', async () => {
  let now = 0;
  let releaseFirst!: () => void;
  let active = 0;
  let maxActive = 0;
  const calls: string[] = [];
  const sync = new QuerySyncCoordinator(() => now, 2);
  sync.subscribe(() => new Promise<void>(resolve => {
    calls.push('first'); active += 1; maxActive = Math.max(maxActive, active);
    releaseFirst = () => { active -= 1; resolve(); };
  }), 5_000);
  sync.subscribe(() => { calls.push('second'); active += 1; maxActive = Math.max(maxActive, active); active -= 1; }, 5_000);
  sync.subscribe(() => { calls.push('third'); active += 1; maxActive = Math.max(maxActive, active); active -= 1; }, 5_000);

  now = 5_000;
  sync.tick();
  await flush();
  assert.deepEqual(calls, ['first', 'second']);
  assert.equal(maxActive, 2);
  releaseFirst();
  await flush();
  sync.tick();
  await flush();
  assert.deepEqual(calls, ['first', 'second', 'third']);
});

test('backs off on failed refresh and recovers to the normal interval after success', async () => {
  let now = 0;
  let calls = 0;
  const sync = new QuerySyncCoordinator(() => now);
  sync.subscribe(() => { calls += 1; return calls > 1; }, 5_000);

  now = 5_000;
  sync.tick();
  await flush();
  now = 10_000;
  sync.tick();
  await flush();
  assert.equal(calls, 1);
  now = 15_000;
  sync.tick();
  await flush();
  assert.equal(calls, 2);
  now = 19_999;
  sync.tick();
  await flush();
  assert.equal(calls, 2);
  now = 20_000;
  sync.tick();
  await flush();
  assert.equal(calls, 3);
});
