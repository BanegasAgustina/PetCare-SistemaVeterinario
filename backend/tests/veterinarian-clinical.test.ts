import assert from 'node:assert/strict';
import test from 'node:test';
import { clientClinicalRecord } from '../src/utils/clinical-presentation';

test('client projection retains owner instructions and prescription fields, but excludes veterinary-only notes',()=>{
  const result=clientClinicalRecord({
    title:'Consulta',content:'Reposo y control en una semana.',dose:'5 mg',frequency:'Cada 12 horas',duration:'5 días',
    internalNotes:'Dolor a la palpación.',appointmentId:'42',reason:'Cojera',diagnosis:'Esguince',treatment:'Reposo',
  });
  assert.deepEqual(result,{title:'Consulta',content:'Reposo y control en una semana.',dose:'5 mg',frequency:'Cada 12 horas',duration:'5 días'});
});

test('client projection does not alter the source medical record',()=>{
  const source={content:'Indicaciones',internalNotes:'Nota privada',diagnosis:'Diagnóstico'};
  clientClinicalRecord(source);
  assert.deepEqual(source,{content:'Indicaciones',internalNotes:'Nota privada',diagnosis:'Diagnóstico'});
});
