/** La lista blanca de diagnóstico no acepta mensajes/propiedades arbitrarias del driver. */
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {safeRegisterError} from '../src/utils/register-diagnostics';
import {DatabaseError} from '../src/utils/database-error';
test('diagnóstico identifica autenticación MySQL sin publicar error.message, SQL ni credenciales',()=>{
  const raw={code:'ER_ACCESS_DENIED_ERROR',message:'password=SECRETO',sql:'SELECT SECRETO',response:'token=SECRETO'};
  const result=safeRegisterError(new DatabaseError('DB_UNAVAILABLE',503,'SECRETO',raw));
  assert.equal(result.code,'DB_UNAVAILABLE');assert.equal(result.driverCode,'ER_ACCESS_DENIED_ERROR');assert.ok(!JSON.stringify(result).includes('SECRETO'));
});
test('errores no reconocidos omiten códigos y mensajes arbitrarios',()=>{
  const result=safeRegisterError({code:'SECRETO',name:'SECRETO',message:'SECRETO'});
  assert.equal(result.code,'UNCLASSIFIED');assert.equal(result.driverCode,null);assert.ok(!JSON.stringify(result).includes('SECRETO'));
});
