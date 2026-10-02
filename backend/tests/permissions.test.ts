/** Pruebas de políticas: herencia, denegación, escalamiento y validación de invitaciones. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomBytes } from 'node:crypto';
import type { Request,Response,RequestHandler } from 'express';
import { effectivePermission } from '../src/types/authorization';
import { requireRole,requirePermission } from '../src/middlewares/permission.middleware';
import { validateVet,validateInvitation,permissionOverrides } from '../src/validators/veterinarian.validator';
import { tokenHash } from '../src/services/invitation.service';
import { createAccessToken,verifyAccessToken,accessTokenSessionVersion } from '../src/services/token.service';
test('override explícito gana a herencia y ausencia conserva el rol',()=>{
  assert.equal(effectivePermission(true,null),true);assert.equal(effectivePermission(false,null),false);
  assert.equal(effectivePermission(true,false),false);assert.equal(effectivePermission(false,true),true);
});
function policy(handler:RequestHandler,user:unknown) {
  let failure:unknown;
  handler({} as Request,{locals:{authenticatedUser:user}} as unknown as Response,error=>{failure=error;});
  return failure;
}
test('permiso crítico no permite a cliente/veterinario superar la barrera de rol',()=>{
  for(const role of ['CLIENT','VETERINARIAN','ADMIN']) assert.equal((policy(requireRole('SUPER_ADMIN'),{role,permissions:['permissions.manage']}) as {status:number}).status,403);
  assert.equal(policy(requireRole('SUPER_ADMIN'),{role:'SUPER_ADMIN'}),undefined);
  assert.equal((policy(requirePermission('products.update'),{permissions:['products.view']}) as {status:number}).status,403);
  assert.equal(policy(requirePermission('products.view'),{permissions:['products.view']}),undefined);
});
const vet={firstName:'Ana',lastName:'Pérez',email:' ana@example.com ',phone:'',licenseNumber:'MP-123',isActive:true,specialtyIds:['1'],overrides:[]};
test('gestión rechaza rol, contraseñas, IDs, duplicados y datos inválidos',()=>{
  assert.equal(validateVet(vet).email,'ana@example.com');
  for(const change of [{role:'SUPER_ADMIN'},{password:'Permanente!1'},{password_hash:'hash'},{specialtyIds:[]},{specialtyIds:['1','1']},{specialtyIds:['0']},{isActive:'true'},{licenseNumber:''},{email:'incorrecto'}]) assert.throws(()=>validateVet({...vet,...change}),{code:'VALIDATION_ERROR'});
  assert.throws(()=>permissionOverrides([{code:'pets.view_all',allowed:'yes'}]),{code:'VALIDATION_ERROR'});
  assert.throws(()=>permissionOverrides([{code:'pets.view_all',allowed:true},{code:'pets.view_all',allowed:false}]),{code:'VALIDATION_ERROR'});
});
test('invitación requiere token 256 bits y contraseña válida; se almacena solo hash',()=>{
  const token=randomBytes(32).toString('hex');assert.equal(validateInvitation({token,password:'Segura!123'}).token,token);
  assert.notEqual(tokenHash(token),token);assert.equal(tokenHash(token).length,64);
  assert.throws(()=>validateInvitation({token:'corto',password:'Segura!123'}),{code:'INVALID_INVITATION'});
  assert.throws(()=>validateInvitation({token,password:'corta'}),{code:'VALIDATION_ERROR'});
});
test('JWT contiene versión de sesión y conserva validación de identidad',()=>{
  process.env.JWT_ACCESS_SECRET=randomBytes(48).toString('hex');
  const {accessToken}=createAccessToken('42',7);assert.equal(verifyAccessToken(accessToken),'42');assert.equal(accessTokenSessionVersion(accessToken),7);
});
