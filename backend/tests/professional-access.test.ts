import test from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response, RequestHandler } from 'express';
import { clinicRouter } from '../src/routes/clinic.routes';
import { AppError } from '../src/utils/app-error';
import type { AuthUser } from '../src/types/auth';

type RouteLayer={route?:{path:string;methods:Record<string,boolean>;stack:{handle:RequestHandler}[]}};
const routeLayers=(clinicRouter as unknown as {stack:RouteLayer[]}).stack;
function guards(path:string,method:'get'|'put') {
 const route=routeLayers.find(layer=>layer.route?.path===path&&layer.route.methods[method])?.route;
 assert.ok(route,`missing ${method.toUpperCase()} ${path}`);
 return route.stack.slice(0,-1).map(layer=>layer.handle);
}
async function runGuard(guard:RequestHandler,user:AuthUser) {
 return new Promise<unknown>(resolve=>guard({} as Request,{locals:{authenticatedUser:user}} as unknown as Response,error=>resolve(error)));
}
const groomer=(permissions:string[]):AuthUser=>({id:'31',firstName:'Alex',lastName:'Groomer',email:'groomer@example.test',phone:null,role:'GROOMER',permissions,professional:{typeId:'8',name:'Peluquería',isClinical:false,serviceIds:['9']}});

test('groomer patient endpoints require appointment permission before repository access',async()=>{
 for(const [path,method] of [['/patients','get'],['/patients/:id','get']] as const){
  const chain=guards(path,method);assert.equal(chain.length,2);
  assert.equal(await runGuard(chain[0]!,groomer([])),undefined);
  const denied=await runGuard(chain[1]!,groomer([]));assert.ok(denied instanceof AppError);assert.equal((denied as AppError).status,403);
  assert.equal(await runGuard(chain[1]!,groomer(['appointments.view_own'])),undefined);
 }
});

test('grooming record read and write endpoints require separate view and update grants',async()=>{
 const read=guards('/grooming/appointments/:id/record','get');
 const write=guards('/grooming/appointments/:id/record','put');
 assert.ok((await runGuard(read[1]!,groomer([]))) instanceof AppError);
 assert.equal(await runGuard(read[1]!,groomer(['appointments.view_own'])),undefined);
 assert.ok((await runGuard(write[1]!,groomer(['appointments.view_own']))) instanceof AppError);
 assert.equal(await runGuard(write[1]!,groomer(['appointments.update_own'])),undefined);
});
