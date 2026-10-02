import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clientService,type ClientRequest } from '../src/services/client.service';
test('services Cliente no envían identidad libre ni precios y usan endpoints protegidos',async()=>{
  const calls:{path:string;body?:unknown}[]=[];
  const request:ClientRequest=async<T>(path:string,options?:Parameters<ClientRequest>[1])=>{calls.push({path,body:options?.body});return {} as T;};
  const api=clientService(request);
  await api.requestAppointment('7','9');await api.updateCart('3',2);await api.checkout('key');await api.clinical('vaccines','7');
  assert.deepEqual(calls[0],{path:'/client/appointments',body:{petId:'7',slotId:'9'}});
  assert.deepEqual(calls[1],{path:'/client/cart/3',body:{quantity:2}});
  assert.deepEqual(calls[2],{path:'/client/orders',body:{requestKey:'key'}});
  assert.equal(calls[3].path,'/client/clinical/vaccines?petId=7');
});
