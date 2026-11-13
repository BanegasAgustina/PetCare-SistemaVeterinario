import assert from 'node:assert/strict';
import test from 'node:test';
import { readAccessSession } from '../src/services/auth.service';
import { hasAdministrativeShellCapability, hasCapabilityModule, modulesForCapabilities } from '../src/utils/capability-modules';
import { isClientAccount,isClinicalProfessional,roleHome } from '../src/utils/role-home';
import { activePrimaryNavigationPath,selectPrimaryNavigation,selectProfessionalQuickAccess } from '../src/utils/navigation-tabs';
import { uniqueNavigationDestinations } from '../src/utils/navigation-dedupe';

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

test('prioriza las cuatro pestañas veterinarias y excluye módulos secundarios',()=>{
  const items=[
    {label:'Inicio',path:'/vet',icon:'home-outline'},
    {label:'Agenda',path:'/vet/agenda',icon:'calendar-outline'},
    {label:'Pacientes',path:'/vet/patients',icon:'paw-outline'},
    {label:'Mis clientes',path:'/vet/clients',icon:'people-outline'},
    {label:'Productos',path:'/vet/products',icon:'pricetags-outline'},
    {label:'Servicios',path:'/admin/catalog/services',icon:'pricetags-outline'},
  ];
  assert.deepEqual(selectPrimaryNavigation('CUSTOM_CLINICIAN',items).map(item=>item.path),['/vet','/vet/agenda','/vet/patients','/vet/products']);
  assert.deepEqual(selectPrimaryNavigation('CUSTOM_CLINICIAN',items.filter(item=>item.path!=='/vet/products')).map(item=>item.path),['/vet','/vet/agenda','/vet/patients']);
});

test('prioriza las tres pestañas de peluquería y no agrega productos',()=>{
  const items=[
    {label:'Inicio',path:'/professional',icon:'home-outline'},
    {label:'Mi agenda',path:'/professional/agenda',icon:'calendar-outline'},
    {label:'Pacientes',path:'/professional/patients',icon:'paw-outline'},
    {label:'Servicios',path:'/professional/services',icon:'pricetags-outline'},
    {label:'Productos',path:'/admin/products',icon:'pricetags-outline'},
  ];
  assert.deepEqual(selectPrimaryNavigation('CUSTOM_GROOMER',items).map(item=>item.path),['/professional','/professional/patients','/professional/agenda']);
});

test('el tab bar del cliente prioriza perfil y deja pedidos como destino secundario',()=>{
  const items=[
    {label:'Inicio',path:'/client',icon:'home-outline'},
    {label:'Mis mascotas',path:'/client/pets',icon:'paw-outline'},
    {label:'Turnos',path:'/client/appointments',icon:'calendar-outline'},
    {label:'Tienda',path:'/client/store',icon:'bag-handle-outline'},
    {label:'Mi perfil',path:'/client/profile',icon:'person-outline'},
    {label:'Mis pedidos',path:'/client/orders',icon:'receipt-outline'},
  ];
  assert.deepEqual(selectPrimaryNavigation('CLIENT',items).map(item=>item.path),['/client','/client/pets','/client/appointments','/client/store','/client/profile']);
});

test('la pestaña seleccionada sigue la sección autorizada en pantallas secundarias',()=>{
  const veterinary=[
    {label:'Inicio',path:'/vet',icon:'home-outline'},
    {label:'Agenda',path:'/vet/agenda',icon:'calendar-outline'},
    {label:'Pacientes',path:'/vet/patients',icon:'paw-outline'},
    {label:'Productos',path:'/vet/products',icon:'pricetags-outline'},
  ];
  assert.equal(activePrimaryNavigationPath('CUSTOM_CLINICIAN','/vet/appointment',veterinary),'/vet/agenda');
  assert.equal(activePrimaryNavigationPath('CUSTOM_CLINICIAN','/vet/products',veterinary),'/vet/products');
  assert.equal(activePrimaryNavigationPath('CUSTOM_CLINICIAN','/notifications',veterinary),null);
  const client=selectPrimaryNavigation('CLIENT',[
    {label:'Inicio',path:'/client',icon:'home-outline'},
    {label:'Mis mascotas',path:'/client/pets',icon:'paw-outline'},
    {label:'Turnos',path:'/client/appointments',icon:'calendar-outline'},
    {label:'Tienda',path:'/client/store',icon:'bag-handle-outline'},
    {label:'Mi perfil',path:'/client/profile',icon:'person-outline'},
    {label:'Mis pedidos',path:'/client/orders',icon:'receipt-outline'},
  ]);
  assert.equal(activePrimaryNavigationPath('CLIENT','/client/orders',client),'/client/profile');
});

test('los accesos rápidos profesionales incluyen solo destinos personales autorizados y clientes del veterinario',()=>{
  const items=[
    {label:'Mis mascotas',path:'/client/pets',icon:'paw-outline'},
    {label:'Mis turnos',path:'/client/appointments',icon:'calendar-outline'},
    {label:'Mis clientes',path:'/vet/clients',icon:'people-outline'},
    {label:'Productos',path:'/admin/products',icon:'pricetags-outline'},
    {label:'Turnos',path:'/admin/agenda',icon:'calendar-outline'},
    {label:'Servicios',path:'/professional/services',icon:'pricetags-outline'},
  ];
  const primary=[
    {label:'Inicio',path:'/vet',icon:'home-outline'},
    {label:'Agenda',path:'/vet/agenda',icon:'calendar-outline'},
    {label:'Pacientes',path:'/vet/patients',icon:'paw-outline'},
    {label:'Productos',path:'/vet/products',icon:'pricetags-outline'},
  ];
  assert.deepEqual(selectProfessionalQuickAccess('/vet',items,primary).map(item=>item.path),['/client/pets','/client/appointments','/vet/clients']);
  assert.deepEqual(selectProfessionalQuickAccess('/professional',items,primary).map(item=>item.path),['/client/pets','/client/appointments']);
});

test('detecta una identidad profesional desde el perfil persistido, no por el nombre del rol',()=>{
  const user=readAccessSession(session('VETERINARIO_ESPECIALISTA',[],{typeId:'3',name:'Clínico',isClinical:true,serviceIds:[]})).user;
  assert.equal(roleHome(user),'/vet');
  assert.equal(isClinicalProfessional(user),true);
});

test('un rol personalizado con perfil profesional clínico usa la base de rutas veterinarias',()=>{
  const clinical=readAccessSession(session('CLINICO_PERSONALIZADO',['appointments.view_own'],{typeId:'3',name:'Clínico',isClinical:true,serviceIds:[]})).user;
  assert.equal(roleHome(clinical),'/vet');
  assert.equal(isClinicalProfessional(clinical),true);
  const nonClinical=readAccessSession(session('PROFESIONAL_PERSONALIZADO',['appointments.view_own'],{typeId:'5',name:'Peluquería',isClinical:false,serviceIds:[]})).user;
  assert.equal(roleHome(nonClinical),'/professional');
  assert.equal(isClinicalProfessional(nonClinical),false);
});

test('un permiso personal no cambia la navegación de una cuenta de empleado a la de cliente',()=>{
  const staff=readAccessSession(session('RECEPCIONISTA',['personal.profile.manage','personal.pets.view'])).user;
  const client=readAccessSession(session('CLIENT',['personal.profile.manage','personal.pets.view'])).user;
  assert.equal(isClientAccount(staff),false);
  assert.equal(isClientAccount(client),true);
});

test('mantiene el panel profesional para permisos de trabajo propio y permite combinar administración',()=>{
  const clinical=readAccessSession(session('CLINICO', ['appointments.view_own','pets.view_information'],{typeId:'3',name:'Clínico',isClinical:true,serviceIds:[]})).user;
  assert.equal(roleHome(clinical),'/vet');
  assert.equal(hasAdministrativeShellCapability(clinical.permissions),false);
  const mixed={...clinical,permissions:[...(clinical.permissions??[]),'products.update_stock']};
  assert.equal(roleHome(mixed),'/vet');
  assert.equal(hasAdministrativeShellCapability(mixed.permissions),true);
});

test('deduplica el mismo destino por ruta y conserva destinos distintos aunque compartan etiqueta',()=>{
  const items=[
    {label:'Clientes',path:'/admin/clients',icon:'people-outline'},
    {label:'Clientes',path:'/admin/clients',icon:'people-outline'},
    {label:'Mis clientes',path:'/vet/clients',icon:'people-outline'},
  ];
  assert.deepEqual(uniqueNavigationDestinations(items).map(item=>item.path),['/admin/clients','/vet/clients']);
});

test('combina módulos de un rol personalizado y elimina accesos repetidos del panel administrativo',()=>{
  const permissions=['users.view_basic','products.view','products.update_stock','appointments.view_all'];
  const modules=modulesForCapabilities(permissions).map(module=>({label:module.name,path:module.path,icon:'settings-outline'}));
  const merged=uniqueNavigationDestinations([...modules,{label:'Clientes',path:'/admin/clients',icon:'people-outline'}]);
  assert.equal(merged.filter(item=>item.path==='/admin/clients').length,1);
  assert.deepEqual(merged.map(item=>item.path),['/admin/agenda','/admin/clients','/admin/products']);
});
