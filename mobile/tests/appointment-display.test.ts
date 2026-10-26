import test from 'node:test';
import assert from 'node:assert/strict';
import { appointmentDisplayValue,appointmentRouteId } from '../src/utils/appointment-display';

test('appointment detail navigation accepts database IDs and rejects missing or malformed route params',()=>{
  assert.equal(appointmentRouteId('27'),'27');
  assert.equal(appointmentRouteId(27),'27');
  assert.equal(appointmentRouteId(undefined),null);
  assert.equal(appointmentRouteId(['27']),null);
  assert.equal(appointmentRouteId('undefined'),null);
  assert.equal(appointmentRouteId('0'),null);
});

test('appointment fields show meaningful fallbacks instead of undefined',()=>{
  assert.equal(appointmentDisplayValue('Baño','Servicio no disponible'),'Baño');
  assert.equal(appointmentDisplayValue(undefined,'Profesional no informado'),'Profesional no informado');
  assert.equal(appointmentDisplayValue('   ','Mascota sin nombre'),'Mascota sin nombre');
  assert.equal(appointmentDisplayValue(12,'—'),'12');
});
