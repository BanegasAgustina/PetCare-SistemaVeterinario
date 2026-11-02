import assert from 'node:assert/strict';
import test from 'node:test';
import { activePrimaryNavigationPath, type RoleNavigationItem } from '../src/utils/navigation-tabs';

const clientTabs: RoleNavigationItem[] = [
  { label: 'Inicio', path: '/client', icon: 'home-outline' },
  { label: 'Mis mascotas', path: '/client/pets', icon: 'paw-outline' },
  { label: 'Turnos', path: '/client/appointments', icon: 'calendar-outline' },
  { label: 'Tienda', path: '/client/store', icon: 'bag-outline' },
  { label: 'Mi perfil', path: '/client/profile', icon: 'person-outline' },
];

test('resuelve la pestaña cliente para rutas base e internas, con una sola seleccionada', () => {
  const routes = [
    ['/client', '/client'],
    ['/client/pets/123/edit', '/client/pets'],
    ['/client/appointments/request', '/client/appointments'],
    ['/client/store/checkout', '/client/store'],
    ['/client/profile/security', '/client/profile'],
  ] as const;

  for (const [pathname, expected] of routes) {
    const activePath = activePrimaryNavigationPath('CLIENT', pathname, clientTabs);
    assert.equal(activePath, expected, pathname);
    assert.equal(clientTabs.filter(tab => tab.path === activePath).length, 1, pathname);
  }
});

test('las rutas internas de personal se asignan a la pestaña disponible del rol', () => {
  const vetTabs: RoleNavigationItem[] = [
    { label: 'Inicio', path: '/vet', icon: 'home-outline' },
    { label: 'Agenda', path: '/vet/agenda', icon: 'calendar-outline' },
    { label: 'Pacientes', path: '/vet/patients', icon: 'paw-outline' },
    { label: 'Productos', path: '/vet/products', icon: 'bag-outline' },
  ];
  assert.equal(activePrimaryNavigationPath('VETERINARIAN', '/vet/appointment', vetTabs), '/vet/agenda');
  assert.equal(activePrimaryNavigationPath('VETERINARIAN', '/vet/patient', vetTabs), '/vet/patients');
});
