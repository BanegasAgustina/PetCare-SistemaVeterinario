import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSingleFlight } from '../src/utils/single-flight';

test('concurrent profile refresh callers share one operation', async () => {
  const runOnce = createSingleFlight<void>();
  let calls = 0;
  let resolveOperation!: () => void;
  const operation = new Promise<void>(resolve => { resolveOperation = resolve; });
  const first = runOnce(async () => { calls += 1; await operation; });
  const second = runOnce(async () => { calls += 1; });
  assert.equal(calls, 1);
  resolveOperation();
  await Promise.all([first, second]);
  await runOnce(async () => { calls += 1; });
  assert.equal(calls, 2);
});
