import assert from 'node:assert/strict';
import { describe,it } from 'node:test';
import { selectPrimaryNavigation,selectSecondaryNavigation } from '../src/utils/navigation-tabs';

describe('shared bottom navigation',()=>{
	it('selects the veterinarian destinations first and keeps permitted secondary routes for Home',()=>{
		const items=['/vet','/vet/agenda','/vet/patients','/vet/clients','/vet/products','/vet/profile','/client/orders'].map(path=>({path,label:path,icon:'home-outline'}));
		const primary=selectPrimaryNavigation('VETERINARIAN',items);
		assert.deepEqual(primary.map(item=>item.path),['/vet','/vet/agenda','/vet/patients','/vet/clients','/vet/products']);
		assert.deepEqual(selectSecondaryNavigation('VETERINARIAN',items,primary).map(item=>item.path),['/client/orders']);
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
});
