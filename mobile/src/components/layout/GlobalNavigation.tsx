import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Animated, Image, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../ui/AppText';
import type { IconName } from '../client/PetCareUI';

type MenuItem = { label: string; path: string; icon: IconName; permission?: string };
type AdminModule = { code: string; name: string; path: string };
const AdminModulesContext = createContext<AdminModule[]>([]);
export function useAdminModules() { return useContext(AdminModulesContext); }
const clientItems: MenuItem[] = [
  { label: 'Inicio', path: '/client', icon: 'home-outline' },
  { label: 'Mis mascotas', path: '/client/pets', icon: 'paw-outline' },
  { label: 'Turnos', path: '/client/appointments', icon: 'calendar-outline' },
  { label: 'Tienda', path: '/client/store', icon: 'bag-handle-outline' },
  { label: 'Perfil', path: '/client/profile', icon: 'person-outline' },
];
const staffItems: MenuItem[] = [
  { label: 'Agenda y turnos', path: 'agenda', icon: 'calendar-outline', permission: 'appointments.view_own' },
  { label: 'Agenda y turnos', path: 'agenda', icon: 'calendar-outline', permission: 'appointments.view_all' },
  { label: 'Pacientes', path: 'patients', icon: 'paw-outline', permission: 'pets.view_information' },
  { label: 'Reservas', path: 'reservations', icon: 'bag-handle-outline', permission: 'reservations.view_all' },
  { label: 'Clientes', path: 'clients', icon: 'people-outline', permission: 'users.view_basic' },
];
function iconFor(code: string): IconName {
  if (code.includes('pet')) return 'paw-outline';
  if (code.includes('appointment') || code.includes('schedule')) return 'calendar-outline';
  if (code.includes('reservation')) return 'bag-handle-outline';
  if (code.includes('professional') || code.includes('veterinarian')) return 'medkit-outline';
  if (code.includes('user')) return 'people-outline';
  if (code.includes('role') || code.includes('permission')) return 'shield-checkmark-outline';
  if (code.includes('product') || code.includes('service') || code.includes('categor')) return 'pricetags-outline';
  return 'settings-outline';
}

export function GlobalNavigation({ children }: PropsWithChildren) {
  const auth = useAuth();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const { request, hasPermission, user } = auth;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const [adminModules, setAdminModules] = useState<AdminModule[]>([]);
  const [open, setOpen] = useState(false);
  const [desktopExpanded, setDesktopExpanded] = useState(true);
  const [progress] = useState(() => new Animated.Value(0));
  const desktop = Platform.OS === 'web' && width >= 900;
  const base = user?.role === 'VETERINARIAN' ? '/vet' : user?.role === 'GROOMER' ? '/professional' : '/secretary';
  useEffect(() => {
    let active = true;
    if (!isAdmin) return () => { active = false; };
    void request<{ modules: AdminModule[] }>('/admin/home').then(result => { if (active) setAdminModules(result.modules); }).catch(() => { if (active) setAdminModules([]); });
    return () => { active = false; };
  }, [request, user?.id, isAdmin]);
  const items = useMemo<MenuItem[]>(() => {
    if (!user) return [];
    if (user.role === 'CLIENT') return clientItems;
    if (isAdmin) return [
      { label: 'Panel principal', path: '/admin', icon: 'grid-outline' },
      ...adminModules.map((module): MenuItem => ({ label: module.name, path: module.path, icon: iconFor(module.code) })),
    ];
    const permitted: MenuItem[] = [
      { label: 'Inicio', path: base, icon: 'home-outline' },
      ...staffItems.filter(item => item.permission && hasPermission(item.permission)).map(item => ({ ...item, path: `${base}/${item.path}` })),
    ];
    return [...new Map(permitted.map(item => [item.path, item])).values()];
  }, [adminModules, hasPermission, user, base, isAdmin]);
  const selected = [...items].filter(item => pathname === item.path || pathname.startsWith(`${item.path}/`)).sort((a, b) => b.path.length - a.path.length)[0];

  useEffect(() => {
    Animated.timing(progress, { toValue: open ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  }, [open, progress]);
  if (!user) return <>{children}</>;
  const navigate = (path: string) => { setOpen(false); router.push(path as never); };
  const drawer = <View style={[styles.drawer, { backgroundColor: colors.surface, borderColor: colors.border }, desktop && styles.desktopDrawer]}>
    <View style={styles.brand}><Image source={require('../../assets/petcare-logo.png')} style={[styles.logo, { tintColor: colors.text }]} resizeMode="contain" accessibilityLabel="PetCare"/><AppText muted>{user.roleName}</AppText></View>
    {items.map(item => <Pressable key={item.path} accessibilityRole="button" accessibilityState={{ selected: item.path === selected?.path }} onPress={() => navigate(item.path)} style={[styles.item, item.path === selected?.path && { backgroundColor: colors.accent }]}>
      <Ionicons name={item.icon} size={20} color={item.path === selected?.path ? colors.primary : colors.muted}/><AppText numberOfLines={1} style={styles.itemText}>{item.label}</AppText>
    </Pressable>)}
    <View style={styles.spacer}/>
  </View>;

  return <AdminModulesContext.Provider value={isAdmin ? adminModules : []}><View style={[styles.root, { backgroundColor: colors.background }]}>
    <SafeAreaView edges={['top']} style={[styles.topSafe, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel={desktop ? (desktopExpanded ? 'Contraer menú' : 'Expandir menú') : (open ? 'Cerrar menú' : 'Abrir menú')} onPress={() => desktop ? setDesktopExpanded(value => !value) : setOpen(value => !value)} style={[styles.menuButton, { backgroundColor: colors.accent }]}>
          <Ionicons name={desktop ? 'menu' : (open ? 'close' : 'menu')} size={23} color={colors.text}/>
        </Pressable>
        <AppText numberOfLines={1} style={styles.currentTitle}>{selected?.label ?? 'PetCare'}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Perfil" onPress={() => router.push(user.role === 'CLIENT' ? '/client/profile' : '/account')} style={styles.profileButton}><Ionicons name="person-circle-outline" size={25} color={colors.primary}/></Pressable>
      </View>
    </SafeAreaView>
    <View style={styles.body}>
      {desktop && desktopExpanded && drawer}
      <View style={styles.page}>{children}</View>
      {!desktop && <View pointerEvents={open ? 'auto' : 'none'} style={StyleSheet.absoluteFill}>
        <Pressable onPress={() => setOpen(false)} style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: open ? 1 : 0 }]}/>
        <Animated.View style={[styles.mobileDrawer, { backgroundColor: colors.surface, borderColor: colors.border, transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-310, 0] }) }] }]} pointerEvents={open ? 'auto' : 'none'}>{drawer}</Animated.View>
      </View>}
    </View>
  </View></AdminModulesContext.Provider>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, topSafe: { borderBottomWidth: 1 }, topBar: { minHeight: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuButton: { width: 40, height: 40, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }, currentTitle: { flex: 1, minWidth: 0, fontSize: 17, fontWeight: '600' }, profileButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, flexDirection: 'row', minHeight: 0 }, page: { flex: 1, minWidth: 0 }, drawer: { width: 292, padding: 16, borderRightWidth: 1, gap: 5, minHeight: '100%' }, desktopDrawer: { width: 252, paddingHorizontal: 15, paddingVertical: 18 }, mobileDrawer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 292, borderRightWidth: 1, elevation: 8 },
  brand: { minHeight: 66, justifyContent: 'center', gap: 3, marginBottom: 12 }, logo: { width: 132, height: 34, alignSelf: 'flex-start' }, item: { minHeight: 44, paddingHorizontal: 11, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 11 }, itemText: { flex: 1, minWidth: 0 }, spacer: { flex: 1 }, backdrop: { backgroundColor: 'rgba(0,0,0,0.32)' },
});
