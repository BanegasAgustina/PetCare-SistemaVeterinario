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

type MenuItem = { label: string; path: string; icon: IconName; permission?: string; group?: string };
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
  { label: 'Reservas', path: 'reservations', icon: 'bag-handle-outline', permission: 'reservations.view_all', group: 'Tienda' },
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
  const isClient = user?.role === 'CLIENT';
  const [adminModules, setAdminModules] = useState<AdminModule[]>([]);
  const [open, setOpen] = useState(false);
  const [desktopExpanded, setDesktopExpanded] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [progress] = useState(() => new Animated.Value(0));
  const desktop = Platform.OS === 'web' && width >= 900;
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
    void request<{ unreadNotifications?: number }>('/client/home').then(result => { if (active) setUnreadNotifications(result.unreadNotifications ?? 0); }).catch(() => { if (active) setUnreadNotifications(0); });
    return () => { active = false; };
  }, [request, user?.id, isClient, pathname]);
  const items = useMemo<MenuItem[]>(() => {
    if (!user) return [];
    if (user.role === 'CLIENT') return clientItems;
    if (isAdmin) return [
      { label: 'Panel principal', path: '/admin', icon: 'grid-outline' },
      ...adminModules.map((module): MenuItem => ({ label: module.name, path: module.path, icon: iconFor(module.code), ...(['/admin/catalog/categories','/admin/catalog/products','/admin/catalog/promotions','/admin/products','/admin/reservations'].includes(module.path) ? {group:'Tienda'} : {}) })),
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
    <View style={styles.brand}><AppText muted>{user.roleName}</AppText></View>
    {items.map((item,index) => <View key={item.path}>{item.group && items.findIndex(entry=>entry.group===item.group)===index&&<AppText variant="caption" muted style={styles.groupLabel}>{item.group}</AppText>}<Pressable accessibilityRole="button" accessibilityState={{ selected: item.path === selected?.path }} onPress={() => navigate(item.path)} style={[styles.item, item.group&&styles.groupItem, item.path === selected?.path && { backgroundColor: colors.accent }]}>
      <Ionicons name={item.icon} size={20} color={item.path === selected?.path ? colors.primary : colors.muted}/><AppText numberOfLines={1} style={styles.itemText}>{item.label}</AppText>
    </Pressable></View>)}
    <View style={styles.spacer}/>
  </View>;

  return <AdminModulesContext.Provider value={isAdmin ? adminModules : []}><View style={[styles.root, { backgroundColor: colors.background }]}>
    <SafeAreaView edges={['top']} style={[styles.topSafe, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.topBar}>
        {!isClient && <Pressable accessibilityRole="button" accessibilityLabel={desktop ? (desktopExpanded ? 'Contraer menú' : 'Expandir menú') : (open ? 'Cerrar menú' : 'Abrir menú')} onPress={() => desktop ? setDesktopExpanded(value => !value) : setOpen(value => !value)} style={[styles.menuButton, { backgroundColor: colors.accent }]}>
          <Ionicons name={desktop ? 'menu' : (open ? 'close' : 'menu')} size={23} color={colors.text}/>
        </Pressable>}
        {isClient || isAdmin ? <Image source={require('../../assets/petcare-logo.png')} style={[isClient ? styles.clientTopLogo : styles.topLogo, { tintColor: colors.text }]} resizeMode="contain" accessibilityLabel="PetCare"/> : <AppText numberOfLines={1} style={styles.currentTitle}>{selected?.label ?? 'PetCare'}</AppText>}
        {isClient ? <Pressable accessibilityRole="button" accessibilityLabel={`Notificaciones${unreadNotifications ? `, ${unreadNotifications} sin leer` : ''}`} onPress={() => router.push('/client/notifications')} style={styles.profileButton}><Ionicons name="notifications-outline" size={23} color={colors.primary}/>{unreadNotifications>0&&<View style={[styles.notificationDot,{backgroundColor:colors.danger??'#d84343'}]}/>}</Pressable> : <Pressable accessibilityRole="button" accessibilityLabel="Perfil" onPress={() => router.push('/account')} style={styles.profileButton}><Ionicons name="person-circle-outline" size={25} color={colors.primary}/></Pressable>}
      </View>
    </SafeAreaView>
    {isAdmin && pathname !== '/admin' && <View style={[styles.adminPageBar,{backgroundColor:colors.surface,borderBottomColor:colors.border}]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={()=>router.canGoBack()?router.back():router.replace('/admin')} style={[styles.backButton,{backgroundColor:colors.accent}]}>
        <Ionicons name="arrow-back" size={21} color={colors.text}/>
      </Pressable>
      <View style={styles.adminPageHeading}>
        <AppText numberOfLines={1} style={styles.adminPageTitle}>{selected?.label ?? 'Administración'}</AppText>
        <AppText numberOfLines={1} variant="caption" muted>PetCare · Gestión de la clínica</AppText>
      </View>
    </View>}
    <View style={styles.body}>
      {desktop && desktopExpanded && drawer}
      <View style={styles.page}>{children}</View>
      {!desktop && !isClient && <View pointerEvents={open ? 'auto' : 'none'} style={StyleSheet.absoluteFill}>
        <Pressable onPress={() => setOpen(false)} style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: open ? 1 : 0 }]}/>
        <Animated.View style={[styles.mobileDrawer, { backgroundColor: colors.surface, borderColor: colors.border, transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-310, 0] }) }] }]} pointerEvents={open ? 'auto' : 'none'}>{drawer}</Animated.View>
      </View>}
    </View>
  </View></AdminModulesContext.Provider>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, topSafe: { borderBottomWidth: 1 }, topBar: { minHeight: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuButton: { width: 40, height: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, currentTitle: { flex: 1, minWidth: 0, fontSize: 17, fontWeight: '600' }, topLogo:{width:108,height:32,flex:1,alignSelf:'center'}, clientTopLogo:{width:152,height:44,flex:1,alignSelf:'center'}, profileButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }, notificationDot:{position:'absolute',top:7,right:7,width:9,height:9,borderRadius:5,borderWidth:1,borderColor:'#fff'},
  adminPageBar:{minHeight:76,paddingHorizontal:18,paddingVertical:11,flexDirection:'row',alignItems:'center',gap:12,borderBottomWidth:1},backButton:{width:40,height:40,borderRadius:20,alignItems:'center',justifyContent:'center'},adminPageHeading:{flex:1,minWidth:0,gap:1},adminPageTitle:{fontSize:19,fontWeight:'600'},
  body: { flex: 1, flexDirection: 'row', minHeight: 0 }, page: { flex: 1, minWidth: 0 }, drawer: { width: 292, padding: 16, borderRightWidth: 1, gap: 5, minHeight: '100%' }, desktopDrawer: { width: 252, paddingHorizontal: 15, paddingVertical: 18 }, mobileDrawer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 292, borderRightWidth: 1, elevation: 8 },
  brand: { minHeight: 66, justifyContent: 'center', gap: 3, marginBottom: 12 }, logo: { width: 132, height: 34, alignSelf: 'flex-start' }, groupLabel:{paddingHorizontal:11,paddingTop:12,paddingBottom:4,textTransform:'uppercase',letterSpacing:0.8},groupItem:{marginLeft:6},item: { minHeight: 44, paddingHorizontal: 11, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 11 }, itemText: { flex: 1, minWidth: 0 }, spacer: { flex: 1 }, backdrop: { backgroundColor: 'rgba(0,0,0,0.32)' },
});
