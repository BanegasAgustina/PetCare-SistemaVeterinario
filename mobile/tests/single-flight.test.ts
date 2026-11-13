import assert from 'node:assert/strict';
import test from 'node:test';
import { createSingleFlight } from '../src/utils/single-flight';

test('concurrent refresh callers share one in-flight operation', async () => {
  const singleFlight = createSingleFlight<string>();
  let resolveOperation!: (value: string) => void;
  let calls = 0;
  const task = () => {
    calls += 1;
    return new Promise<string>((resolve) => { resolveOperation = resolve; });
  };

  const first = singleFlight(task);
  const second = singleFlight(task);
  assert.equal(calls, 1);
  assert.equal(first, second);
  resolveOperation('rotated-session');
  assert.deepEqual(await Promise.all([first, second]), ['rotated-session', 'rotated-session']);
});

test('a failed refresh releases the single-flight slot for the next attempt', async () => {
  const singleFlight = createSingleFlight<string>();
  await assert.rejects(singleFlight(async () => { throw new Error('network failure'); }), /network failure/);
  assert.equal(await singleFlight(async () => 'recovered'), 'recovered');
});
