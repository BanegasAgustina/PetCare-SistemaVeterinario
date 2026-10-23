import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { AppText } from '../ui/AppText';
import { PetCareCard, PetCareHeader, PetCareScreen, type IconName } from '../client/PetCareUI';

export type AdminSection = 'clinic' | 'store' | 'administration';
type CardSpec = { title: string; description: string; path: string; icon: IconName; permissions: string[] };
const sections: Record<AdminSection, { title: string; subtitle: string; cards: CardSpec[] }> = {
  clinic: { title: 'Clínica', subtitle: 'Servicios, pacientes, turnos y disponibilidad', cards: [
    { title: 'Servicios', description: 'Precios, duración, disponibilidad y profesionales habilitados.', path: '/admin/catalog/services', icon: 'medkit-outline', permissions: ['services.manage'] },
    { title: 'Pacientes', description: 'Mascotas, información clínica y turnos asociados.', path: '/admin/patients', icon: 'paw-outline', permissions: ['pets.view_information', 'pets.view_all'] },
    { title: 'Turnos', description: 'Revisá solicitudes, agenda y estados operativos.', path: '/admin/agenda', icon: 'calendar-outline', permissions: ['appointments.view_all'] },
    { title: 'Horarios', description: 'Administrá franjas y disponibilidad de atención.', path: '/admin/availability', icon: 'time-outline', permissions: ['schedule.manage'] },
  ] },
  store: { title: 'Tienda', subtitle: 'Catálogo, promociones, entregas y pedidos', cards: [
    { title: 'Productos y stock', description: 'Catálogo, precios, existencias y movimientos de stock.', path: '/admin/products', icon: 'pricetags-outline', permissions: ['products.update', 'products.update_stock', 'products.update_price'] },
    { title: 'Categorías', description: 'Organizá y mantené las categorías de la tienda.', path: '/admin/catalog/categories', icon: 'albums-outline', permissions: ['categories.manage'] },
    { title: 'Promociones', description: 'Descuentos, vigencia y productos alcanzados.', path: '/admin/catalog/promotions', icon: 'pricetag-outline', permissions: ['promotions.manage'] },
    { title: 'Envíos y entregas', description: 'Modalidades de retiro y envío configuradas para el checkout.', path: '/admin/store-settings', icon: 'bicycle-outline', permissions: ['store.settings.view', 'store.settings.manage'] },
    { title: 'Pedidos', description: 'Pagos, comprobantes, preparación, retiro y entrega.', path: '/admin/store-orders', icon: 'receipt-outline', permissions: ['orders.view_all'] },
    { title: 'Banners y slider', description: 'Imágenes, vigencia, orden y vista previa de la tienda.', path: '/admin/store-banners', icon: 'images-outline', permissions: ['store.banners.manage'] },
  ] },
  administration: { title: 'Administración', subtitle: 'Personas, perfiles de acceso y permisos', cards: [
    { title: 'Información de PetCare', description: 'Nombre, contacto, ubicación, horarios y presencia pública.', path: '/admin/general-information', icon: 'business-outline', permissions: ['settings.general.manage'] },
    { title: 'Profesionales', description: 'Cuentas, estado, servicios y datos profesionales.', path: '/admin/professionals', icon: 'people-outline', permissions: ['professionals.manage'] },
    { title: 'Veterinarios', description: 'Datos profesionales, especialidades y asignaciones.', path: '/admin/veterinarians', icon: 'medkit-outline', permissions: ['veterinarians.manage'] },
    { title: 'Usuarios', description: 'Cuentas, estado y permisos individuales.', path: '/admin/users', icon: 'person-outline', permissions: ['users.manage'] },
    { title: 'Roles', description: 'Roles disponibles y permisos delegables.', path: '/admin/roles', icon: 'shield-outline', permissions: ['roles.manage'] },
    { title: 'Permisos', description: 'Permisos por módulo con controles de delegación.', path: '/admin/permissions', icon: 'key-outline', permissions: ['permissions.manage'] },
    { title: 'Especialidades', description: 'Especialidades y tipos profesionales existentes.', path: '/admin/specialties', icon: 'list-outline', permissions: ['specialties.manage', 'professional_types.manage'] },
  ] },
};

export function AdminSectionHub({ section }: { section: AdminSection }) {
  const auth = useAuth();
  const { colors } = useTheme();
  const config = sections[section];
  const cards = config.cards.filter(card => card.permissions.some(permission => auth.hasPermission(permission)));
  return <PetCareScreen wide>
    <PetCareHeader title={config.title} subtitle={config.subtitle} hideForAdmin/>
    {cards.length ? <View style={styles.grid}>{cards.map(card => <Pressable key={card.path} accessibilityRole="button" accessibilityLabel={`${card.title}. ${card.description}`} onPress={() => router.push(card.path as never)} style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}>
      <View style={[styles.icon, { backgroundColor: colors.accent }]}><Ionicons name={card.icon} size={22} color={colors.primary}/></View>
      <View style={styles.copy}><AppText variant="subtitle">{card.title}</AppText><AppText variant="caption" muted>{card.description}</AppText></View>
      <Ionicons name="chevron-forward" size={19} color={colors.muted}/>
    </Pressable>)}</View> : <PetCareCard><AppText variant="subtitle">No hay módulos habilitados</AppText><AppText muted>Tu cuenta no tiene permisos para operar en esta sección. El administrador principal puede revisar los accesos asignados.</AppText></PetCareCard>}
  </PetCareScreen>;
}

const styles = StyleSheet.create({ grid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, card: { flexGrow: 1, flexBasis: 280, minHeight: 122, padding: 16, borderWidth: 1, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 13 }, icon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, minWidth: 0, gap: 5 } });
