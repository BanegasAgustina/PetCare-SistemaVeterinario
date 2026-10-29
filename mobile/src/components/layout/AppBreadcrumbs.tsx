// Este archivo se encarga de lo siguiente: Componente de estructura visual y navegación; define cómo se acomodan las pantallas.

import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../ui/AppText';

// Tipo Destination: define la forma o las opciones válidas de los datos usados por este módulo.
type Destination = { label: string; path: string };
// Tipo Crumb: define la forma o las opciones válidas de los datos usados por este módulo.
type Crumb = { label: string; path?: string };
// Tipo Props: define la forma o las opciones válidas de los datos usados por este módulo.
type Props = { role: string; destinations: Destination[] };

// Configuración catalogLabels: reúne valores o reglas que consume el resto del módulo.
const catalogLabels: Record<string, string> = {
  services: 'Servicios', products: 'Productos', categories: 'Categorías', promotions: 'Promociones', types: 'Tipos profesionales', specialties: 'Especialidades',
};
// Configuración knownLabels: reúne valores o reglas que consume el resto del módulo.
const knownLabels: Record<string, string> = {
  '/admin': 'Inicio', '/admin/clinic': 'Clínica', '/admin/store': 'Tienda', '/admin/administration': 'Administración',
  '/admin/agenda': 'Turnos', '/admin/patients': 'Pacientes', '/admin/clients': 'Clientes', '/admin/professionals': 'Profesionales', '/admin/veterinarians': 'Veterinarios',
  '/admin/availability': 'Horarios', '/admin/products': 'Inventario y stock', '/admin/store-orders': 'Pedidos',
  '/admin/store-banners': 'Banners', '/admin/store-settings': 'Envíos y entregas', '/admin/roles': 'Roles', '/admin/permissions': 'Permisos',
  '/admin/users': 'Usuarios', '/admin/general-information': 'Información general', '/client': 'Inicio', '/client/pets': 'Mis mascotas',
  '/client/appointments': 'Turnos', '/client/store': 'Tienda', '/client/profile': 'Mi perfil', '/client/orders': 'Mis pedidos',
  '/client/medical-history': 'Historial médico', '/client/vaccines': 'Vacunas', '/client/prescriptions': 'Recetas', '/client/recommendations': 'Recomendaciones',
  '/client/notifications': 'Notificaciones', '/notifications': 'Notificaciones', '/vet': 'Inicio', '/vet/agenda': 'Agenda', '/vet/patients': 'Pacientes', '/vet/clients': 'Mis clientes',
  '/vet/products': 'Productos', '/professional': 'Inicio', '/professional/agenda': 'Mi agenda', '/professional/patients': 'Pacientes', '/professional/services': 'Servicios',
  '/workspace': 'Inicio', '/account': 'Mi cuenta',
};

// Función adminRoute: concentra la lógica dentro de este módulo.
function adminRoute(path: string): { group?: string; parent?: string; label: string } {
  if (path === '/admin/clinic') return { label: 'Clínica' };
  if (path === '/admin/store') return { label: 'Tienda' };
  if (path === '/admin/administration') return { label: 'Administración' };
  const catalog = /^\/admin\/catalog\/([^/]+)$/.exec(path);
  if (catalog) {
    const kind = catalog[1];
    return { group: ['products', 'categories', 'promotions'].includes(kind) ? '/admin/store' : '/admin/clinic', label: catalogLabels[kind] ?? 'Catálogo' };
  }
  if (path === '/admin/appointment') return { group: '/admin/clinic', parent: '/admin/agenda', label: 'Detalle del turno' };
  if (path === '/admin/patient') return { group: '/admin/clinic', parent: '/admin/patients', label: 'Ficha del paciente' };
  if (path === '/admin/client') return { group: '/admin/clinic', parent: '/admin/clients', label: 'Ficha del cliente' };
  const user = /^\/admin\/users\/([^/]+)$/.exec(path);
  if (user) return { group: '/admin/administration', parent: '/admin/users', label: user[1] === 'new' ? 'Crear usuario' : 'Editar usuario' };
  const veterinarian = /^\/admin\/veterinarians\/([^/]+)$/.exec(path);
  if (veterinarian) return { group: '/admin/clinic', parent: '/admin/veterinarians', label: veterinarian[1] === 'new' ? 'Crear veterinario' : 'Editar veterinario' };
  if (path === '/admin/veterinarians/specialties') return { group: '/admin/clinic', parent: '/admin/veterinarians', label: 'Especialidades' };
  const direct: Record<string, { group: string; label: string }> = {
    '/admin/agenda': { group: '/admin/clinic', label: 'Turnos' }, '/admin/patients': { group: '/admin/clinic', label: 'Pacientes' }, '/admin/clients': { group: '/admin/clinic', label: 'Clientes' },
    '/admin/professionals': { group: '/admin/clinic', label: 'Profesionales' }, '/admin/veterinarians': { group: '/admin/clinic', label: 'Veterinarios' },
    '/admin/availability': { group: '/admin/clinic', label: 'Horarios' }, '/admin/products': { group: '/admin/store', label: 'Inventario y stock' },
    '/admin/store-orders': { group: '/admin/store', label: 'Pedidos' },
    '/admin/store-banners': { group: '/admin/store', label: 'Banners' }, '/admin/store-settings': { group: '/admin/store', label: 'Envíos y entregas' },
    '/admin/roles': { group: '/admin/administration', label: 'Roles' }, '/admin/permissions': { group: '/admin/administration', label: 'Permisos' },
    '/admin/users': { group: '/admin/administration', label: 'Usuarios' }, '/admin/general-information': { group: '/admin/administration', label: 'Información general' },
  };
  const entry = direct[path];
  return entry ? { ...entry } : { label: 'Administración' };
}

// Función resolveCrumbs: concentra la lógica dentro de este módulo.
function resolveCrumbs(path: string, role: string, destinations: Destination[]): Crumb[] {
  const allowed = new Set(destinations.map(item => item.path));
  const root = role === 'ADMIN' || role === 'SUPER_ADMIN' ? '/admin'
    : role === 'CLIENT' ? '/client' : role === 'VETERINARIAN' ? '/vet' : role === 'GROOMER' ? '/professional'
      : '/workspace';
  if (path === root) return [{ label: knownLabels[root] ?? 'Inicio' }];

  if (path.startsWith('/admin/')) {
    const detail = adminRoute(path);
    const trail: Crumb[] = [{ label: knownLabels[root] ?? 'Inicio', path: allowed.has(root) ? root : undefined }];
    if (detail.group && allowed.has(detail.group)) trail.push({ label: knownLabels[detail.group], path: detail.group });
    if (detail.parent && allowed.has(detail.parent)) trail.push({ label: knownLabels[detail.parent] ?? detail.parent.split('/').pop()!, path: detail.parent });
    const current = detail.label || destinations.find(item => item.path === path)?.label || 'Administración';
    trail.push({ label: current });
    return deduplicate(trail);
  }

  const leaf = resolveRoleRoute(path, role);
  const trail: Crumb[] = [{ label: knownLabels[root] ?? 'Inicio', path: allowed.has(root) ? root : undefined }];
  if (leaf.parent && leaf.parent !== root && allowed.has(leaf.parent)) trail.push({ label: knownLabels[leaf.parent] ?? 'Sección', path: leaf.parent });
  trail.push({ label: leaf.label || destinations.find(item => item.path === path)?.label || 'PetCare' });
  return deduplicate(trail);
}

// Función resolveRoleRoute: concentra la lógica dentro de este módulo.
function resolveRoleRoute(path: string, role: string): { parent?: string; label: string } {
  const patterns: [RegExp, (match: RegExpExecArray) => { parent?: string; label: string }][] = [
    [/^\/client\/pets\/new$/, () => ({ parent: '/client/pets', label: 'Agregar mascota' })],
    [/^\/client\/pets\/[^/]+\/edit$/, () => ({ parent: '/client/pets', label: 'Editar mascota' })],
    [/^\/client\/pets\/[^/]+$/, () => ({ parent: '/client/pets', label: 'Detalle de mascota' })],
    [/^\/client\/appointments\/request$/, () => ({ parent: '/client/appointments', label: 'Solicitar turno' })],
    [/^\/client\/appointments\/[^/]+$/, () => ({ parent: '/client/appointments', label: 'Detalle del turno' })],
    [/^\/client\/store\/cart$/, () => ({ parent: '/client/store', label: 'Carrito' })],
    [/^\/client\/store\/checkout$/, () => ({ parent: '/client/store', label: 'Confirmar compra' })],
    [/^\/client\/store\/delivery$/, () => ({ parent: '/client/store', label: 'Entrega' })],
    [/^\/client\/store\/[^/]+$/, () => ({ parent: '/client/store', label: 'Producto' })],
    [/^\/client\/orders\/[^/]+$/, () => ({ parent: '/client/orders', label: 'Detalle del pedido' })],
    [/^\/client\/profile\/edit$/, () => ({ parent: '/client/profile', label: 'Editar perfil' })],
    [/^\/client\/profile\/(appearance|security)$/, match => ({ parent: '/client/profile', label: match[1] === 'appearance' ? 'Apariencia' : 'Seguridad' })],
    [/^\/client\/payment-intents\/[^/]+$/, () => ({ parent: '/client/orders', label: 'Transferencia bancaria' })],
    [/^\/(vet|professional)\/appointment$/, match => ({ parent: `/${match[1]}/${match[1] === 'professional' ? 'agenda' : 'agenda'}`, label: 'Detalle del turno' })],
    [/^\/(vet|professional)\/patient$/, match => ({ parent: `/${match[1]}/patients`, label: 'Ficha de paciente' })],
    [/^\/vet\/record$/, () => ({ parent: '/vet/patients', label: 'Registro clínico' })],
    [/^\/vet\/client$/, () => ({ parent: '/vet/clients', label: 'Ficha del cliente' })],
    [/^\/account$/, () => ({ label: 'Mi cuenta' })],
  ];
  for (const [pattern, resolve] of patterns) { const match = pattern.exec(path); if (match) return resolve(match); }
  const direct = knownLabels[path];
  if (direct) return { parent: rootForPath(path, role), label: direct };
  return { label: 'PetCare' };
}

// Función rootForPath: concentra la lógica dentro de este módulo.
function rootForPath(path: string, role: string): string | undefined {
  const roleRoot = role === 'CLIENT' ? '/client' : role === 'VETERINARIAN' ? '/vet' : role === 'GROOMER' ? '/professional' : '/workspace';
  return path === roleRoot ? undefined : roleRoot;
}

// Función deduplicate: concentra la lógica dentro de este módulo.
function deduplicate(crumbs: Crumb[]): Crumb[] { return crumbs.filter((crumb, index) => index === 0 || crumb.label !== crumbs[index - 1]?.label); }

// Función AppBreadcrumbs: concentra la lógica dentro de este módulo.
export function AppBreadcrumbs({ role, destinations }: Props) {
  const pathname = usePathname();
  const { colors } = useTheme();
  const crumbs = resolveCrumbs(pathname, role, destinations);
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.container} accessibilityRole="navigation" accessibilityLabel="Migas de pan">
    {crumbs.map((crumb, index) => <View key={`${crumb.label}-${index}`} style={styles.crumb}>
      {index > 0 && <Ionicons name="chevron-forward" size={14} color={colors.muted} accessible={false}/>}
      {crumb.path ? <Pressable accessibilityRole="link" onPress={() => router.navigate(crumb.path as never)} style={styles.link}><AppText variant="caption" numberOfLines={1} style={{ color: colors.muted }}>{crumb.label}</AppText></Pressable>
        : <AppText accessibilityRole="text" accessibilityLabel={`Ubicación actual: ${crumb.label}`} variant="caption" numberOfLines={1} style={{ color: colors.text, fontWeight: '700' }}>{crumb.label}</AppText>}
    </View>)}
  </ScrollView>;
}

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({
  scroll: { flexGrow: 0, flexShrink: 0, width: '100%', maxHeight: 38 },
  container: { minHeight: 34, alignItems: 'center', gap: 9, paddingHorizontal: 24 },
  crumb: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 240 },
  link: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 2 },
});
