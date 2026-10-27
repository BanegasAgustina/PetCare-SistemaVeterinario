import assert from 'node:assert/strict';
import test from 'node:test';
import { patientDetailPresentation } from '../src/constants/responsive';

test('patient chart stays in compact cards through phone, tablet, and small notebook widths', () => {
  for (const width of [320, 375, 390, 430, 768, 1024]) {
    const layout = patientDetailPresentation('web', width);
    assert.equal(layout.clinicalTables, false, `${width}px should not force a wide clinical table`);
  }
});

test('patient chart adds two columns at desktop and tables when the content area can fit them', () => {
  assert.deepEqual(patientDetailPresentation('web', 1024), { twoColumns: true, clinicalTables: false });
  assert.deepEqual(patientDetailPresentation('web', 1366), { twoColumns: true, clinicalTables: true });
  assert.deepEqual(patientDetailPresentation('web', 1920), { twoColumns: true, clinicalTables: true });
});

test('Android keeps the mobile presentation even if the emulator window is wide', () => {
  assert.deepEqual(patientDetailPresentation('android', 1920), { twoColumns: false, clinicalTables: false });
});
