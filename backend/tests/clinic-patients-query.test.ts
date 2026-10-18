import test from 'node:test';
import assert from 'node:assert/strict';
import { patientListOrdering, patientNextAppointmentExpression } from '../src/repositories/clinic.repository';

test('patient recent ordering uses pet creation time and appointment dates from the joined slot', () => {
  assert.equal(patientListOrdering.recent, 'p.created_at DESC');
  assert.match(patientNextAppointmentExpression, /FROM client_appointments appt JOIN client_appointment_slots slot ON slot\.id=appt\.slot_id/);
  assert.match(patientNextAppointmentExpression, /MIN\(slot\.starts_at\)/);
  assert.doesNotMatch(patientNextAppointmentExpression, /appt\.starts_at/);
});
