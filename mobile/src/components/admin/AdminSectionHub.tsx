// Este archivo se encarga de lo siguiente: Componente reutilizable del área administrativa; organiza formularios, listas o controles de gestión.

import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { useClientQuery } from '../../hooks/useClientQuery';
import { AppText } from '../ui/AppText';
import { PetCareCard, PetCareHeader, PetCareScreen, QueryState, money, type IconName } from '../client/PetCareUI';
import { canAccessAdminPath } from '../../utils/admin-route-access';

// Tipo AdminSection: define la forma o las opciones válidas de los datos usados por este módulo.
export type AdminSection = 'clinic' | 'store' | 'administration';
// Tipo CardSpec: define la forma o las opciones válidas de los datos usados por este módulo.
type CardSpec = { title: string; description: string; path: string; icon: IconName };
// Tipo StoreIndicatorSpec: define la forma o las opciones válidas de los datos usados por este módulo.
type StoreIndicatorSpec = { title: string; value: string | number; icon: IconName; path: string; params?: Record<string, string> };

// Función StoreIndicator: concentra la lógica dentro de este módulo.
function StoreIndicator({ title, value, icon, path, params }: StoreIndicatorSpec) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`${title}: ${value}`} onPress={() => router.push({ pathname: path as never, params } as never)} style={({ pressed }) => [styles.indicator, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}>
    <View style={[styles.icon, { backgroundColor: colors.accent }]}><Ionicons name={icon} size={22} color={colors.primary}/></View>
    <AppText variant="title" style={styles.value}>{value}</AppText>
    <AppText variant="caption" muted>{title}</AppText>
  </Pressable>;
}

// Configuración sections: reúne valores o reglas que consume el resto del módulo.
const sections: Record<AdminSection, { title: string; subtitle: string; cards: CardSpec[] }> = {
  clinic: { title: 'Clínica', subtitle: 'Servicios, pacientes, turnos y disponibilidad', cards: [
    { title: 'Servicios', description: 'Precios, duración, disponibilidad y profesionales habilitados.', path: '/admin/catalog/services', icon: 'medkit-outline' },
    { title: 'Pacientes', description: 'Mascotas, información clínica y turnos asociados.', path: '/admin/patients', icon: 'paw-outline' },
    { title: 'Turnos', description: 'Revisá solicitudes, agenda y estados operativos.', path: '/admin/agenda', icon: 'calendar-outline' },
    { title: 'Horarios', description: 'Administrá franjas y disponibilidad de atención.', path: '/admin/availability', icon: 'time-outline' },
  ] },
  store: { title: 'Tienda', subtitle: 'Catálogo, promociones, entregas y pedidos', cards: [
    { title: 'Productos y stock', description: 'Catálogo, precios, existencias y movimientos de stock.', path: '/admin/products', icon: 'pricetags-outline' },
    { title: 'Categorías', description: 'Organizá y mantené las categorías de la tienda.', path: '/admin/catalog/categories', icon: 'albums-outline' },
    { title: 'Promociones', description: 'Descuentos, vigencia y productos alcanzados.', path: '/admin/catalog/promotions', icon: 'pricetag-outline' },
    { title: 'Envíos y entregas', description: 'Modalidades de retiro y envío configuradas para el checkout.', path: '/admin/store-settings', icon: 'bicycle-outline' },
    { title: 'Pedidos', description: 'Pagos, comprobantes, preparación, retiro y entrega.', path: '/admin/store-orders', icon: 'receipt-outline' },
    { title: 'Banners y slider', description: 'Imágenes, vigencia, orden y vista previa de la tienda.', path: '/admin/store-banners', icon: 'images-outline' },
  ] },
  administration: { title: 'Administración', subtitle: 'Personas, perfiles de acceso y permisos', cards: [
    { title: 'Información de PetCare', description: 'Nombre, contacto, ubicación, horarios y presencia pública.', path: '/admin/general-information', icon: 'business-outline' },
    { title: 'Profesionales', description: 'Cuentas, estado, servicios y datos profesionales.', path: '/admin/professionals', icon: 'people-outline' },
    { title: 'Veterinarios', description: 'Datos profesionales, especialidades y asignaciones.', path: '/admin/veterinarians', icon: 'medkit-outline' },
    { title: 'Usuarios', description: 'Cuentas, estado y permisos individuales.', path: '/admin/users', icon: 'person-outline' },
    { title: 'Roles', description: 'Roles disponibles y permisos delegables.', path: '/admin/roles', icon: 'shield-outline' },
    { title: 'Permisos', description: 'Permisos por módulo con controles de delegación.', path: '/admin/permissions', icon: 'key-outline' },
    { title: 'Especialidades', description: 'Especialidades y tipos profesionales existentes.', path: '/admin/specialties', icon: 'list-outline' },
  ] },
};

// Función AdminSectionHub: concentra la lógica dentro de este módulo.
export function AdminSectionHub({ section }: { section: AdminSection }) {
  const auth = useAuth();
  const { colors } = useTheme();
  const admin = useAdmin();
  const canViewOrders = auth.hasPermission('orders.view_all');
  const canViewStock = auth.hasPermission('products.update_stock');
  const canLoadStoreStats = section === 'store' && canViewOrders;
  const loadStoreStats = useCallback(() => canLoadStoreStats ? admin.home() : Promise.resolve(null), [admin, canLoadStoreStats]);
  const storeStatsQuery = useClientQuery(loadStoreStats);
  const config = sections[section];
  const cards = config.cards.filter(card => canAccessAdminPath(card.path, auth.hasPermission));
  const storeStats = storeStatsQuery.data?.storeStats;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const indicators: StoreIndicatorSpec[] = [];
  if (section === 'store' && storeStats && canViewOrders) {
    indicators.push(
      { title: 'Ventas de hoy', value: money(storeStats.salesTodayCents), icon: 'trending-up-outline', path: '/admin/store-orders', params: { from: today, to: today } },
      { title: 'Pedidos nuevos', value: storeStats.newOrders, icon: 'bag-handle-outline', path: '/admin/store-orders', params: { status: 'PLACED' } },
    );
  }
  if (section === 'store' && storeStats && canViewStock) {
    indicators.push({ title: 'Stock bajo', value: storeStats.lowStockProducts, icon: 'warning-outline', path: '/admin/products', params: { stock: 'low' } });
  }
  return <PetCareScreen wide>
    <PetCareHeader title={config.title} subtitle={config.subtitle} hideForAdmin/>
    {section === 'store' && canViewOrders && <View style={styles.activity}>
      <AppText variant="subtitle">Actividad de la tienda</AppText>
      
<QueryState {...storeStatsQuery}/>
      {!!indicators.length && <View style={styles.indicatorGrid}>{indicators.map(indicator => <StoreIndicator key={indicator.title} {...indicator}/>)}</View>}
    </View>}
    {cards.length ? <View style={styles.grid}>{cards.map(card => <Pressable key={card.path} accessibilityRole="button" accessibilityLabel={`${card.title}. ${card.description}`} onPress={() => router.push(card.path as never)} style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}>
      <View style={[styles.icon, { backgroundColor: colors.accent }]}><Ionicons name={card.icon} size={22} color={colors.primary}/></View>
      <View style={styles.copy}><AppText variant="subtitle">{card.title}</AppText><AppText variant="caption" muted>{card.description}</AppText></View>
      <Ionicons name="chevron-forward" size={19} color={colors.muted}/>
    </Pressable>)}</View> : <PetCareCard><AppText variant="subtitle">No hay módulos habilitados</AppText><AppText muted>Tu cuenta no tiene permisos para operar en esta sección. El administrador principal puede revisar los accesos asignados.</AppText></PetCareCard>}
  </PetCareScreen>;
}

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({ activity: { gap: 12 }, indicatorGrid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, indicator: { flexGrow: 1, flexBasis: 180, maxWidth: 400, minWidth: 0, minHeight: 128, padding: 16, borderWidth: 1, borderRadius: 18, gap: 5 }, value: { fontSize: 25, lineHeight: 30 }, grid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, card: { flexGrow: 1, flexBasis: 280, maxWidth: 480, minHeight: 122, padding: 16, borderWidth: 1, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 13 }, icon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, minWidth: 0, gap: 5 } });
