import assert from 'node:assert/strict';
import test from 'node:test';
import { requiredCancellationReason } from '../src/utils/appointment-cancellation';

test('cancellation reasons are trimmed and must contain meaningful text',()=>{
  assert.equal(requiredCancellationReason('  Necesito reprogramar  '),'Necesito reprogramar');
  for(const value of ['', '   ', 'ok', 'x'.repeat(501)])
    assert.throws(()=>requiredCancellationReason(value),{code:'VALIDATION_ERROR'});
  assert.throws(()=>requiredCancellationReason(undefined),{code:'VALIDATION_ERROR'});
});
