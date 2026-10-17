import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { subscribeToNotificationChanges } from '../../services/notification-events';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { softSurfaceShadow } from '../../constants/surface';
import { AppText } from '../ui/AppText';
import type { IconName } from '../client/PetCareUI';
import { PetCareLogo } from './PetCareLogo';

type MenuItem = { label: string; path: string; icon: IconName; permission?: string; group?: string };
type AdminModule = { code: string; name: string; path: string };
const AdminModulesContext = createContext<AdminModule[]>([]);
export function useAdminModules() { return useContext(AdminModulesContext); }
const adminGroups = ['General', 'Clínica', 'Tienda', 'Administración'] as const;
function adminGroup(path: string): typeof adminGroups[number] {
  if (path === '/admin') return 'General';
  if (['/admin/patients','/admin/agenda','/admin/veterinarians','/admin/professionals','/admin/catalog/services','/admin/specialties'].includes(path)) return 'Clínica';
  if (['/admin/reservations','/admin/products','/admin/catalog/products'].includes(path)) return 'Tienda';
  return 'Administración';
}
function adminLabel(module: AdminModule) {
  const labels: Record<string,string> = {
    '/admin/patients':'Pacientes','/admin/agenda':'Turnos','/admin/veterinarians':'Veterinarios','/admin/professionals':'Profesionales',
    '/admin/catalog/services':'Servicios','/admin/reservations':'Reservas','/admin/products':'Productos y stock',
    '/admin/catalog/products':'Productos','/admin/specialties':'Tipos y especialidades','/admin/users':'Usuarios','/admin/roles':'Roles','/admin/permissions':'Permisos',
  };
  return labels[module.path] ?? module.name;
}
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
  { label: 'Reservas', path: 'reservations', icon: 'bag-handle-outline', permission: 'reservations.view_all', group: 'Tienda' },
  // Permite a secretaría consultar el catálogo cuando MySQL le concede products.view.
  { label: 'Productos', path: 'products', icon: 'pricetags-outline', permission: 'products.view', group: 'Tienda' },
  { label: 'Clientes', path: 'clients', icon: 'people-outline', permission: 'users.view_basic' },
];
const veterinarianItems: MenuItem[] = [
  { label: 'Inicio', path: '/vet', icon: 'home-outline' },
  { label: 'Agenda y turnos', path: '/vet/agenda', icon: 'calendar-outline', permission: 'appointments.view_own' },
  { label: 'Agenda y turnos', path: '/vet/agenda', icon: 'calendar-outline', permission: 'appointments.view_all' },
  { label: 'Pacientes', path: '/vet/patients', icon: 'paw-outline', permission: 'pets.view_information' },
  { label: 'Mis clientes', path: '/vet/clients', icon: 'people-outline', permission: 'pets.view_information' },
  { label: 'Productos', path: '/vet/products', icon: 'pricetags-outline', permission: 'products.view' },
  { label: 'Mi perfil', path: '/vet/profile', icon: 'person-outline' },
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
  const [containerWidth, setContainerWidth] = useState(width);
  const pathname = usePathname();
  const { request, hasPermission, user } = auth;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isClient = user?.role === 'CLIENT';
  const isVeterinarian = user?.role === 'VETERINARIAN';
  const [adminModules, setAdminModules] = useState<AdminModule[]>([]);
  const [open, setOpen] = useState(false);
  const [desktopExpanded, setDesktopExpanded] = useState(true);
  const [highlightedAdminPath, setHighlightedAdminPath] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string,boolean>>({});
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [progress] = useState(() => new Animated.Value(0));
  const desktop = Platform.OS === 'web' && Math.min(width, containerWidth) >= 1024;
  const base = user?.role === 'VETERINARIAN' ? '/vet' : user?.role === 'GROOMER' ? '/professional' : '/secretary';
  useEffect(() => {
    let active = true;
    if (!isAdmin) return () => { active = false; };
    void request<{ modules: AdminModule[] }>('/admin/home').then(result => { if (active) setAdminModules(result.modules); }).catch(() => { if (active) setAdminModules([]); });
    return () => { active = false; };
  }, [request, user?.id, user?.role, isAdmin]);
  useEffect(() => {
    let active = true;
    if (!isClient) return () => { active = false; };
    const refreshUnread=()=>void request<{ unreadNotifications?: number }>('/client/home').then(result => { if (active) setUnreadNotifications(result.unreadNotifications ?? 0); }).catch(() => { if (active) setUnreadNotifications(0); });
    refreshUnread();
    const unsubscribe=subscribeToNotificationChanges(refreshUnread);
    const interval=setInterval(refreshUnread,30_000);
    return () => { active = false;unsubscribe();clearInterval(interval); };
  }, [request, user?.id, isClient, pathname]);
  const items = useMemo<MenuItem[]>(() => {
    if (!user) return [];
    if (user.role === 'CLIENT') return clientItems;
    if (isAdmin) return [
      { label: 'Panel principal', path: '/admin', icon: 'grid-outline', group: adminGroup('/admin') },
      ...[...new Map(adminModules.filter(module=>!['/admin/availability','/admin/catalog/categories','/admin/catalog/promotions','/admin/catalog/types','/admin/catalog/specialties'].includes(module.path)).map(module=>[module.path,module])).values()].map((module): MenuItem => ({ label: adminLabel(module), path: module.path, icon: iconFor(module.code), group: adminGroup(module.path) })),
    ];
    if (user.role === 'VETERINARIAN') return [...new Map(veterinarianItems.filter(item=>(!item.permission||hasPermission(item.permission)||(item.path==='/vet/products'&&hasPermission('prescriptions.create')))&&(!['/vet/patients','/vet/clients'].includes(item.path)||hasPermission('pets.view_all')||hasPermission('pets.view_assigned'))).map(item=>[item.path,item])).values()];
    const permitted: MenuItem[] = [
      { label: 'Inicio', path: base, icon: 'home-outline' },
      ...staffItems.filter(item => item.permission && hasPermission(item.permission)).map(item => ({ ...item, path: `${base}/${item.path}` })),
    ];
    return [...new Map(permitted.map(item => [item.path, item])).values()];
  }, [adminModules, hasPermission, user, base, isAdmin]);
  const selected = [...items].filter(item => pathname === item.path || pathname.startsWith(`${item.path}/`)).sort((a, b) => b.path.length - a.path.length)[0];
  const adminBack = () => {
    if (pathname.startsWith('/admin/users/')) return router.replace('/admin/users');
    if (pathname.startsWith('/admin/veterinarians/')) return router.replace('/admin/veterinarians');
    if (['/admin/roles', '/admin/permissions', '/admin/users', '/admin/veterinarians'].includes(pathname)) return router.replace('/admin');
    return router.canGoBack() ? router.back() : router.replace('/admin');
  };

  useEffect(() => {
    Animated.timing(progress, { toValue: open ? 1 : 0, duration: 220, useNativeDriver: false }).start();
  }, [open, progress]);
  if (!user) return <>{children}</>;
  const navigate = (path: string) => { setOpen(false); router.push(path as never); };
  const renderItem = (item: MenuItem) => <Pressable key={item.path} accessibilityRole="button" accessibilityState={{ selected: item.path === selected?.path }} onPress={() => navigate(item.path)} onHoverIn={() => { if (desktop && isAdmin) setHighlightedAdminPath(item.path); }} onHoverOut={() => { if (desktop && isAdmin) setHighlightedAdminPath(value => value === item.path ? null : value); }} onFocus={() => { if (desktop && isAdmin) setHighlightedAdminPath(item.path); }} onBlur={() => { if (desktop && isAdmin) setHighlightedAdminPath(value => value === item.path ? null : value); }} style={[styles.item, desktop && isAdmin && highlightedAdminPath === item.path && { backgroundColor: colors.accent }, item.path === selected?.path && { backgroundColor: colors.accent, borderLeftColor: colors.primary, borderLeftWidth: 3 }]}>
    <Ionicons name={item.icon} size={20} color={item.path === selected?.path ? colors.primary : colors.muted}/><AppText numberOfLines={1} style={styles.itemText}>{item.label}</AppText>
  </Pressable>;
  const drawer = <View style={[styles.drawer, softSurfaceShadow(colors.primary), { backgroundColor: colors.surface, borderColor: colors.border }, desktop && isAdmin && styles.adminDesktopDrawer]}>
    <View style={styles.brand}><AppText numberOfLines={desktop && isAdmin ? 1 : undefined} ellipsizeMode={desktop && isAdmin ? 'tail' : undefined} muted>{user.roleName}</AppText></View>
    <ScrollView style={[styles.drawerMenu, desktop && isAdmin && styles.adminDesktopDrawerMenu]} contentContainerStyle={styles.menuContent} keyboardShouldPersistTaps="handled">
      {isAdmin ? adminGroups.map(group => {
        const groupItems = items.filter(item => item.group === group);
        if (!groupItems.length) return null;
        const collapsed = !desktop && Boolean(collapsedGroups[group]);
        return <View key={group}>
          {desktop
            ? <View style={styles.groupHeading}><AppText variant="caption" muted style={styles.groupLabel}>{group}</AppText></View>
            : <Pressable accessibilityRole="button" accessibilityState={{ expanded: !collapsed }} onPress={() => setCollapsedGroups(value => ({ ...value, [group]: !value[group] }))} style={styles.groupHeading}>
              <AppText variant="caption" muted style={styles.groupLabel}>{group}</AppText>
              <Ionicons name={collapsed ? 'chevron-forward' : 'chevron-down'} size={16} color={colors.muted}/>
            </Pressable>}
          {!collapsed && groupItems.map(renderItem)}
        </View>;
      }) : items.map(renderItem)}
    </ScrollView>
  </View>;

  return <AdminModulesContext.Provider value={isAdmin ? adminModules : []}><View onLayout={event => setContainerWidth(current => current === event.nativeEvent.layout.width ? current : event.nativeEvent.layout.width)} style={[styles.root, { backgroundColor: colors.background }]}>
    <SafeAreaView edges={['top']} style={[styles.topSafe, softSurfaceShadow(colors.primary), { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={[styles.topBar, desktop && isAdmin && styles.adminDesktopTopBar]}>
        {!isClient && <Pressable accessibilityRole="button" accessibilityLabel={desktop && isAdmin ? 'Menú de navegación siempre visible' : desktop ? (desktopExpanded ? 'Contraer menú' : 'Expandir menú') : (open ? 'Cerrar menú' : 'Abrir menú')} onPress={() => desktop ? (isAdmin ? setDesktopExpanded(true) : setDesktopExpanded(value => !value)) : setOpen(value => !value)} style={[styles.menuButton, { backgroundColor: colors.accent }]}>
          <Ionicons name={desktop ? 'menu' : (open ? 'close' : 'menu')} size={23} color={colors.text}/>
        </Pressable>}
        {isClient || isAdmin || isVeterinarian ? <PetCareLogo style={isClient ? styles.clientTopLogo : styles.topLogo}/> : <AppText numberOfLines={1} style={styles.currentTitle}>{selected?.label ?? 'PetCare'}</AppText>}
        {isClient&&<Pressable accessibilityRole="button" accessibilityLabel={unreadNotifications>0?`Notificaciones, ${unreadNotifications} sin leer`:'Notificaciones'} onPress={()=>router.push('/client/notifications')} style={styles.profileButton}><Ionicons name="notifications-outline" size={23} color={colors.primary}/>{unreadNotifications>0&&<View style={[styles.notificationDot,{backgroundColor:colors.danger??'#d84343',width:unreadNotifications>9?22:17,height:17,minWidth:17,top:3,right:3,borderRadius:9,borderWidth:0,alignItems:'center',justifyContent:'center'}]}><Text style={{color:'#fff',fontSize:9,fontWeight:'700',lineHeight:12}}>{unreadNotifications>99?'99+':unreadNotifications}</Text></View>}</Pressable>}
        {!isClient&&<Pressable accessibilityRole="button" accessibilityLabel="Mi perfil" onPress={()=>router.push(isVeterinarian?'/vet/profile':'/account')} style={styles.profileButton}><Ionicons name="person-circle-outline" size={25} color={colors.primary}/></Pressable>}
      </View>
    </SafeAreaView>
    {isAdmin && pathname !== '/admin' && <View style={[styles.adminPageBar, desktop && styles.adminDesktopPageBar,{backgroundColor:colors.surface,borderBottomColor:colors.border}]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={adminBack} style={[styles.backButton,{backgroundColor:colors.accent}]}>
        <Ionicons name="arrow-back" size={21} color={colors.text}/>
      </Pressable>
      <View style={styles.adminPageHeading}>
        <AppText numberOfLines={1} style={styles.adminPageTitle}>{selected?.label ?? 'Administración'}</AppText>
        <AppText numberOfLines={1} variant="caption" muted>PetCare · Gestión de la clínica</AppText>
      </View>
    </View>}
    <View style={styles.body}>
      {desktop && (isAdmin || desktopExpanded) && drawer}
      <View style={styles.page}>{children}</View>
      {!desktop && !isClient && <View pointerEvents={open ? 'auto' : 'none'} style={StyleSheet.absoluteFill}>
        <Pressable onPress={() => setOpen(false)} style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: open ? 1 : 0 }]}/>
        <Animated.View style={[styles.mobileDrawer, { backgroundColor: colors.surface, borderColor: colors.border, transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-310, 0] }) }] }]} pointerEvents={open ? 'auto' : 'none'}>{drawer}</Animated.View>
      </View>}
    </View>
  </View></AdminModulesContext.Provider>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, topSafe: { borderBottomWidth: 1 }, topBar: { minHeight: 60, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }, adminDesktopTopBar:{minHeight:68,paddingHorizontal:28,gap:16},
  menuButton: { width: 44, height: 44, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, currentTitle: { flex: 1, minWidth: 0, fontSize: 17, fontWeight: '600', textAlign: 'center' }, topLogo:{width:108,height:32,flex:1,alignSelf:'center'}, clientTopLogo:{position:'absolute',width:152,height:44,left:'50%',marginLeft:-76}, profileButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, notificationDot:{position:'absolute',top:7,right:7,width:9,height:9,borderRadius:5,borderWidth:1,borderColor:'#fff'},
  adminPageBar:{minHeight:64,paddingHorizontal:16,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:10,borderBottomWidth:1},adminDesktopPageBar:{minHeight:72,paddingHorizontal:28,gap:14},backButton:{width:42,height:42,borderRadius:12,alignItems:'center',justifyContent:'center'},adminPageHeading:{flex:1,minWidth:0,gap:1},adminPageTitle:{fontSize:18,fontWeight:'600'},
  body: { flex: 1, flexDirection: 'row', minHeight: 0 }, page: { flex: 1, minWidth: 0 }, drawer: { flex:1,width: 292, padding: 16, borderRightWidth: 1, gap: 5, minHeight: '100%' }, drawerMenu:{flex:1},menuContent:{gap:5,paddingBottom:16},adminDesktopDrawer:{flex:0,flexGrow:0,flexShrink:0,flexBasis:280,width:280,minWidth:280,maxWidth:280,alignSelf:'stretch',minHeight:0,paddingHorizontal:18,paddingVertical:20},adminDesktopDrawerMenu:{flex:1,minHeight:0,width:'100%'},mobileDrawer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 292, borderRightWidth: 1, elevation: 8 },
  brand: { minHeight: 58, justifyContent: 'center', gap: 3, marginBottom: 4 }, logo: { width: 132, height: 34, alignSelf: 'flex-start' }, groupHeading:{minHeight:38,paddingHorizontal:8,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},groupLabel:{textTransform:'uppercase',letterSpacing:0.8},item: { minHeight: 44, paddingHorizontal: 11, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 11 }, itemText: { flex: 1, minWidth: 0 }, backdrop: { backgroundColor: 'rgba(0,0,0,0.32)' },
});
