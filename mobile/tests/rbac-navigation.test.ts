import assert from 'node:assert/strict';
import test from 'node:test';
import { readAccessSession } from '../src/services/auth.service';
import { hasAdministrativeShellCapability, hasCapabilityModule, modulesForCapabilities } from '../src/utils/capability-modules';
import { roleHome } from '../src/utils/role-home';
import { selectPrimaryNavigation } from '../src/utils/navigation-tabs';

const session=(role:string,permissions:string[],professional?:{typeId:string;name:string;isClinical:boolean;serviceIds:string[]})=>({
  accessToken:'access-token',tokenType:'Bearer' as const,expiresIn:900,refreshToken:'a'.repeat(64),
  user:{id:'7',firstName:'Ana',lastName:'Test',email:'ana@example.test',phone:null,role,permissions,...(professional?{professional}: {})},
});

test('acepta códigos de roles personalizados válidos entregados por la API',()=>{
  assert.equal(readAccessSession(session('RECEPCIONISTA',['users.view_basic','appointments.view_all'])).user.role,'RECEPCIONISTA');
  assert.throws(()=>readAccessSession(session('rol-inventado',['appointments.view_all'])));
});

test('combina módulos personalizados desde permisos efectivos sin exigir un código de rol conocido',()=>{
  const permissions=['appointments.view_all','products.update_stock','categories.manage'];
  assert.equal(hasCapabilityModule(permissions),true);
  assert.deepEqual(modulesForCapabilities(permissions).map(module=>module.path),['/admin/agenda','/admin/products','/admin/catalog/categories']);
  assert.equal(roleHome({id:'7',firstName:'Ana',lastName:'Test',email:'ana@example.test',phone:null,role:'ENCARGADA',permissions}),'/admin');
});

test('elige el navbar inferior de los destinos efectivos sin clasificar por código de rol',()=>{
  const items=[
    {label:'Panel principal',path:'/admin',icon:'home-outline'},
    {label:'Turnos',path:'/admin/agenda',icon:'calendar-outline'},
    {label:'Productos',path:'/admin/products',icon:'pricetags-outline'},
    {label:'Categorías',path:'/admin/catalog/categories',icon:'albums-outline'},
    {label:'Perfil',path:'/account',icon:'person-outline'},
  ];
  assert.deepEqual(selectPrimaryNavigation('ROL_NUEVO',items).map(item=>item.path),['/admin','/admin/agenda','/admin/products','/admin/catalog/categories']);
});

test('detecta una identidad profesional desde el perfil persistido, no por el nombre del rol',()=>{
  const user=readAccessSession(session('VETERINARIO_ESPECIALISTA',[],{typeId:'3',name:'Clínico',isClinical:true,serviceIds:[]})).user;
  assert.equal(roleHome(user),'/vet');
});

test('mantiene el panel profesional para permisos de trabajo propio y permite combinar administración',()=>{
  const clinical=readAccessSession(session('CLINICO', ['appointments.view_own','pets.view_information'],{typeId:'3',name:'Clínico',isClinical:true,serviceIds:[]})).user;
  assert.equal(roleHome(clinical),'/vet');
  assert.equal(hasAdministrativeShellCapability(clinical.permissions),false);
  const mixed={...clinical,permissions:[...(clinical.permissions??[]),'products.update_stock']};
  assert.equal(roleHome(mixed),'/admin');
  assert.equal(hasAdministrativeShellCapability(mixed.permissions),true);
});
