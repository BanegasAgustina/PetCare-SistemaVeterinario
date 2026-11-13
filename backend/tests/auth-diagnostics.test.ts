import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import type { Request,Response } from 'express';
import { authRequestDiagnostics } from '../src/middlewares/auth-diagnostics.middleware';

test('registra login correlacionado sin leer ni registrar el cuerpo de credenciales',()=>{
  const response=new EventEmitter() as EventEmitter&{statusCode:number;setHeader:(name:string,value:string)=>void};
  response.statusCode=200;
  const headers:Record<string,string>={};
  response.setHeader=(name,value)=>{headers[name]=value;};
  const request={method:'POST',path:'/login',get:(name:string)=>name.toLowerCase()==='x-request-id'?'petcare-request-123':''} as Request;
  let continued=false;
  const lines:string[]=[];
  const original=console.info;
  console.info=(...args:unknown[])=>{lines.push(String(args[1]));};
  try{
    authRequestDiagnostics(request,response as unknown as Response,()=>{continued=true;});
    response.emit('finish');
  }finally{console.info=original;}
  assert.equal(continued,true);
  assert.equal(headers['X-Request-ID'],'petcare-request-123');
  assert.equal(lines.length,2);
  const received=JSON.parse(lines[0]) as Record<string,unknown>;
  const completed=JSON.parse(lines[1]) as Record<string,unknown>;
  assert.equal(received.requestId,'petcare-request-123');
  assert.equal(received.endpoint,'/api/auth/login');
  assert.equal(received.event,'received');
  assert.equal(completed.requestId,'petcare-request-123');
  assert.equal(completed.endpoint,'/api/auth/login');
  assert.equal(completed.status,200);
  assert.equal(typeof completed.durationMs,'number');
  assert.equal(completed.completed,true);
});

test('no agrega diagnósticos a rutas ajenas a login y refresh',()=>{
  const response=new EventEmitter() as EventEmitter&{statusCode:number;setHeader:(name:string,value:string)=>void};
  response.statusCode=200;response.setHeader=()=>undefined;
  let continued=false;
  authRequestDiagnostics({method:'POST',path:'/register',get:()=>undefined} as unknown as Request,response as unknown as Response,()=>{continued=true;});
  assert.equal(continued,true);
  assert.equal(response.listenerCount('finish'),0);
});
