import assert from 'node:assert/strict';
import { describe,it } from 'node:test';
import { activePrimaryNavigationPath,selectPrimaryNavigation,selectSecondaryNavigation } from '../src/utils/navigation-tabs';

describe('shared bottom navigation',()=>{
	it('selects the veterinarian destinations first and keeps permitted secondary routes for Home',()=>{
		const items=['/vet','/vet/agenda','/vet/patients','/vet/clients','/vet/products','/vet/profile','/client/orders'].map(path=>({path,label:path,icon:'home-outline'}));
		const primary=selectPrimaryNavigation('VETERINARIAN',items);
		assert.deepEqual(primary.map(item=>item.path),['/vet','/vet/agenda','/vet/patients','/vet/products','/vet/profile']);
		assert.deepEqual(selectSecondaryNavigation('VETERINARIAN',items,primary).map(item=>item.path),['/vet/clients','/client/orders']);
	});
	it('keeps every route reachable for roles with more modules than tabs',()=>{
		const items=Array.from({length:8},(_,index)=>({path:`/module-${index}`,label:`Módulo ${index}`,icon:'home-outline'}));
		const primary=selectPrimaryNavigation('CUSTOM_ROLE',[{path:'/workspace',label:'Inicio',icon:'home-outline'},...items]);
		const secondary=selectSecondaryNavigation('CUSTOM_ROLE',[{path:'/workspace',label:'Inicio',icon:'home-outline'},...items],primary);
		assert.equal(primary.length,5);
		assert.equal(secondary.length,4);
		assert.equal(new Set([...primary,...secondary].map(item=>item.path)).size,9);
	});
	it('deduplicates routes shared by multiple permission entries',()=>{
		const items=[{path:'/secretary/agenda',label:'Agenda',icon:'calendar-outline'},{path:'/secretary/agenda',label:'Agenda',icon:'calendar-outline'},{path:'/secretary',label:'Inicio',icon:'home-outline'}];
		assert.deepEqual(selectPrimaryNavigation('SECRETARY',items).map(item=>item.path),['/secretary','/secretary/agenda']);
	});
	it('leaves admin modules in their section hubs instead of repeating them on Home',()=>{
		const items=[{path:'/admin/permissions',label:'Permisos',icon:'key-outline',group:'Administración'},{path:'/admin/reservations',label:'Reservas',icon:'bag-handle-outline',group:'Tienda'},{path:'/client/pets',label:'Mis mascotas',icon:'paw-outline'}];
		assert.deepEqual(selectSecondaryNavigation('ADMIN',items,[]).map(item=>item.path),['/client/pets']);
	});
	it('keeps a permitted primary destination active on detail and secondary screens',()=>{
		const pathsByRole:Record<string,string[]>={
			CLIENT:['/client','/client/pets','/client/appointments','/client/store','/client/profile'],
			VETERINARIAN:['/vet','/vet/agenda','/vet/patients','/vet/products','/vet/profile'],
			GROOMER:['/professional','/professional/agenda','/professional/patients','/professional/services','/account'],
			SECRETARY:['/secretary','/secretary/agenda','/secretary/patients','/secretary/reservations','/account'],
			ADMIN:['/admin','/admin/clinic','/admin/store','/admin/administration'],
		};
		const items=(paths:string[])=>paths.map(path=>({path,label:path,icon:'home-outline'}));
		assert.equal(activePrimaryNavigationPath('CLIENT','/client/orders/12',items(pathsByRole.CLIENT)),'/client/profile');
		assert.equal(activePrimaryNavigationPath('VETERINARIAN','/vet/patient',items(pathsByRole.VETERINARIAN)),'/vet/patients');
		assert.equal(activePrimaryNavigationPath('VETERINARIAN','/vet/profile',items(pathsByRole.VETERINARIAN)),'/vet/profile');
		assert.equal(activePrimaryNavigationPath('VETERINARIAN','/vet/client',items(pathsByRole.VETERINARIAN)),null);
		assert.equal(activePrimaryNavigationPath('GROOMER','/professional/appointment',items(pathsByRole.GROOMER)),'/professional/agenda');
		assert.equal(activePrimaryNavigationPath('SECRETARY','/secretary/reservation',items(pathsByRole.SECRETARY)),'/secretary/reservations');
		assert.equal(activePrimaryNavigationPath('SECRETARY','/account',items(pathsByRole.SECRETARY)),'/account');
		assert.equal(activePrimaryNavigationPath('SECRETARY','/secretary/client',items(pathsByRole.SECRETARY)),null);
		assert.equal(activePrimaryNavigationPath('ADMIN','/admin/catalog/products',items(pathsByRole.ADMIN)),'/admin/store');
		assert.equal(activePrimaryNavigationPath('ADMIN','/admin/users/12',items(pathsByRole.ADMIN)),'/admin/administration');
	});
});
