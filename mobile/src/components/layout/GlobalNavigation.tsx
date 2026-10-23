import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { subscribeToNotificationChanges } from '../../services/notification-events';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { roleLabel } from '../../utils/role-label';
import { softSurfaceShadow } from '../../constants/surface';
import { AppText } from '../ui/AppText';
import type { IconName } from '../client/PetCareUI';
import { PetCareLogo } from './PetCareLogo';
import { modulesForCapabilities, personalModulesForCapabilities } from '../../utils/capability-modules';
import { RoleBottomNavigation } from './RoleBottomNavigation';
import { ConfirmModal } from '../ui/ConfirmModal';
import { desktopSidebarWidth, isWebAtLeast, responsiveLayout } from '../../constants/responsive';

type MenuItem = { label: string; path: string; icon: IconName; permission?: string; group?: string };
type AdminModule = { code: string; name: string; path: string };
const noAdminModules: AdminModule[] = [];
const AdminModulesContext = createContext<AdminModule[]>([]);
const AdminModulesLoadingContext = createContext(false);
const scheduleAdminModule: AdminModule = { code: 'schedule.manage', name: 'Horarios', path: '/admin/availability' };
export function useAdminModules() { return useContext(AdminModulesContext); }
export function useAdminModulesLoading() { return useContext(AdminModulesLoadingContext); }
const adminGroups = ['Inicio', 'Clínica', 'Tienda', 'Administración'] as const;
function adminGroup(path: string): typeof adminGroups[number] {
  if (path === '/admin') return 'Inicio';
  if (['/admin/patients','/admin/agenda','/admin/availability','/admin/veterinarians','/admin/professionals','/admin/catalog/services','/admin/specialties'].includes(path)) return 'Clínica';
  if (['/admin/products','/admin/catalog/products','/admin/catalog/categories','/admin/catalog/promotions','/admin/store-settings','/admin/store-orders','/admin/store-banners'].includes(path)) return 'Tienda';
  return 'Administración';
}
function adminLabel(module: AdminModule) {
  const labels: Record<string,string> = {
    '/admin/patients':'Pacientes','/admin/agenda':'Turnos','/admin/veterinarians':'Veterinarios','/admin/professionals':'Profesionales',
    '/admin/catalog/services':'Servicios','/admin/availability':'Horarios','/admin/products':'Inventario y stock',
    '/admin/catalog/products':'Productos','/admin/catalog/categories':'Categorías','/admin/catalog/promotions':'Promociones y descuentos','/admin/store-banners':'Banners y slider','/admin/store-settings':'Envíos y entregas','/admin/store-orders':'Pedidos','/admin/specialties':'Tipos y especialidades','/admin/users':'Usuarios','/admin/roles':'Roles','/admin/permissions':'Permisos',
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
const groomerItems: MenuItem[] = [
  { label: 'Panel principal', path: '/professional', icon: 'home-outline' },
  { label: 'Mi agenda', path: '/professional/agenda', icon: 'calendar-outline', permission: 'appointments.view_own' },
  { label: 'Mis mascotas atendidas', path: '/professional/patients', icon: 'paw-outline', permission: 'appointments.view_own' },
  { label: 'Servicios', path: '/professional/services', icon: 'pricetags-outline', permission: 'appointments.view_own' },
  { label: 'Mi perfil', path: '/account', icon: 'person-outline' },
];
function iconFor(code: string): IconName {
  if (code.includes('pet')) return 'paw-outline';
  if (code.includes('appointment') || code.includes('schedule')) return 'calendar-outline';
  if (code.includes('reservation') || code.includes('store') || code.includes('order')) return 'bag-handle-outline';
  if (code.includes('profile')) return 'person-outline';
  if (code.includes('professional') || code.includes('veterinarian')) return 'medkit-outline';
  if (code.includes('user')) return 'people-outline';
  if (code.includes('role') || code.includes('permission')) return 'shield-checkmark-outline';
  if (code.includes('product') || code.includes('service') || code.includes('categor')) return 'pricetags-outline';
  return 'settings-outline';
}

const adminTabs = [
  { label: 'Inicio', path: '/admin', icon: 'home-outline' as const },
  { label: 'Clínica', path: '/admin/clinic', icon: 'medkit-outline' as const },
  { label: 'Tienda', path: '/admin/store', icon: 'bag-handle-outline' as const },
  { label: 'Administración', path: '/admin/administration', icon: 'settings-outline' as const },
];

function AdminBottomNavigation({ pathname, personalItems }: { pathname: string; personalItems: MenuItem[] }) {
  const personalActive=personalItems.find(item=>pathname===item.path||pathname.startsWith(`${item.path}/`))?.path;
  const active = personalActive??(pathname === '/admin' ? '/admin' : pathname.startsWith('/admin/clinic') ? '/admin/clinic' : pathname.startsWith('/admin/store') || pathname.startsWith('/admin/products') || pathname.startsWith('/admin/catalog/') && !pathname.includes('services') ? '/admin/store' : pathname.startsWith('/admin/catalog/services') || pathname.startsWith('/admin/patients') || pathname.startsWith('/admin/agenda') || pathname.startsWith('/admin/availability') ? '/admin/clinic' : '/admin/administration');
  return <RoleBottomNavigation items={[...adminTabs,...personalItems]} activePath={active} onNavigate={path=>router.replace(path as never)}/>;
}

function isAdminFullScreenRoute(pathname: string) {
  return /^\/admin\/(?:patient|appointment|reservation)(?:\/[^/]+)?$/.test(pathname)
    || /^\/admin\/(?:users|veterinarians)\/[^/]+$/.test(pathname)
    || pathname==='/account';
}

function isVeterinarianFullScreenRoute(pathname: string) {
  return ['/vet/profile', '/vet/appointment', '/vet/patient', '/vet/record', '/vet/client', '/vet/clients'].includes(pathname);
}
function isRoleDetailRoute(pathname:string) {
  return /^\/(?:professional|secretary)\/(?:appointment|patient|reservation|client)(?:\/[^/]+)?$/.test(pathname)
    || /^\/admin\/(?:patient|appointment|reservation)$/.test(pathname)
    || ['/client/store/cart','/client/store/checkout','/client/store/delivery'].includes(pathname)
    || /^\/client\/store\/[^/]+$/.test(pathname);
}

function VeterinarianBottomNavigation({ pathname, items }: { pathname: string; items: MenuItem[] }) {
  const active = [...items].filter(tab => pathname === tab.path || pathname.startsWith(`${tab.path}/`)).sort((a, b) => b.path.length - a.path.length)[0];
  return <RoleBottomNavigation items={items} activePath={active?.path??pathname} onNavigate={path=>router.replace(path as never)}/>;
}

export function GlobalNavigation({ children }: PropsWithChildren) {
  const auth = useAuth();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(width);
  const pathname = usePathname();
  const { request, hasPermission, user } = auth;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isCustomRole = Boolean(user && !['CLIENT','VETERINARIAN','GROOMER','SECRETARY','ADMIN','SUPER_ADMIN'].includes(user.role));
  const isClient = user?.role === 'CLIENT';
  const isVeterinarian = user?.role === 'VETERINARIAN';
  const [adminModulesResult, setAdminModulesResult] = useState<{ userId: string | null; modules: AdminModule[] }>({ userId: null, modules: [] });
  const adminModules = adminModulesResult.userId === user?.id ? adminModulesResult.modules : noAdminModules;
  const adminModulesLoading = isAdmin && adminModulesResult.userId !== user?.id;
  const visibleAdminModules = useMemo(() => isAdmin && hasPermission('schedule.manage') && !adminModules.some(module => module.path === scheduleAdminModule.path) ? [...adminModules, scheduleAdminModule] : adminModules, [adminModules, hasPermission, isAdmin]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const desktop = isWebAtLeast(Platform.OS, Math.min(width, containerWidth), responsiveLayout.breakpoints.desktop);
  const base = user?.role === 'VETERINARIAN' ? '/vet' : user?.role === 'GROOMER' ? '/professional' : '/secretary';
  useEffect(() => {
    let active = true;
    if (!isAdmin || !user?.id) return () => { active = false; };
    void request<{ modules: AdminModule[] }>('/admin/home').then(result => { if (active) setAdminModulesResult({ userId: user.id, modules: result.modules }); }).catch(() => { if (active) setAdminModulesResult({ userId: user.id, modules: [] }); });
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
    const personalItems: MenuItem[]=personalModulesForCapabilities(user.permissions).map(module=>({label:module.name,path:module.path,icon:iconFor(module.code)}));
    if (isAdmin) return [
      { label: 'Panel principal', path: '/admin', icon: 'grid-outline', group: adminGroup('/admin') },
      ...[...new Map(visibleAdminModules.filter(module=>!['/admin/catalog/types','/admin/catalog/specialties','/admin/reservations'].includes(module.path)).map(module=>[module.path,module])).values()].map((module): MenuItem => ({ label: adminLabel(module), path: module.path, icon: iconFor(module.code), group: adminGroup(module.path) })),
      ...personalItems,
    ];
    if (isCustomRole) return [
      { label: 'Inicio', path: '/workspace', icon: 'home-outline' },
      ...modulesForCapabilities(user.permissions).map(module=>({label:module.name,path:module.path,icon:iconFor(module.code)})),
      { label:'Perfil',path:'/account',icon:'person-outline' },
    ];
    if (user.role === 'VETERINARIAN') return [...new Map([
      ...veterinarianItems.filter(item => (!item.permission || hasPermission(item.permission) || (item.path === '/vet/products' && hasPermission('prescriptions.create')))
        && (!['/vet/patients','/vet/clients'].includes(item.path) || hasPermission('pets.view_all') || hasPermission('pets.view_assigned'))),
      ...personalItems,
    ].map(item => [item.path,item])).values()];
    if (user.role === 'GROOMER') return [...groomerItems.filter(item=>!item.permission||hasPermission(item.permission)), ...personalItems];
    const permitted: MenuItem[] = [
      { label: 'Inicio', path: base, icon: 'home-outline' },
      ...staffItems.filter(item => item.permission && hasPermission(item.permission)).map(item => ({ ...item, path: `${base}/${item.path}` })),
      ...personalItems,
      { label:'Perfil',path:'/account',icon:'person-outline' },
    ];
    return [...new Map(permitted.map(item => [item.path, item])).values()];
  }, [visibleAdminModules, hasPermission, user, base, isAdmin, isCustomRole]);
  const selected = [...items].filter(item => pathname === item.path || pathname.startsWith(`${item.path}/`)).sort((a, b) => b.path.length - a.path.length)[0];
  const desktopItems = useMemo(() => isClient
    ? [...items, { label: unreadNotifications ? `Notificaciones (${unreadNotifications})` : 'Notificaciones', path: '/client/notifications', icon: 'notifications-outline' as const }]
    : items, [items, isClient, unreadNotifications]);
  const desktopSelected = [...desktopItems].filter(item => pathname === item.path || pathname.startsWith(`${item.path}/`)).sort((a, b) => b.path.length - a.path.length)[0];
  const adminBack = () => {
    if (pathname.startsWith('/admin/users/')) return router.replace('/admin/users');
    if (pathname.startsWith('/admin/veterinarians/')) return router.replace('/admin/veterinarians');
    if (['/admin/roles', '/admin/permissions', '/admin/users', '/admin/veterinarians'].includes(pathname)) return router.replace('/admin');
    return router.canGoBack() ? router.back() : router.replace('/admin');
  };

  if (!user) return <>{children}</>;
  const navigate = (path: string) => router.replace(path as never);

  if (isAdmin && desktop) return <AdminModulesContext.Provider value={adminModules}><AdminModulesLoadingContext.Provider value={adminModulesLoading}><View onLayout={event => setContainerWidth(current => current === event.nativeEvent.layout.width ? current : event.nativeEvent.layout.width)} style={[styles.desktopRoot, { backgroundColor: colors.background }]}>
    <DesktopSidebar items={desktopItems} activePath={desktopSelected?.path ?? null} onNavigate={navigate} />
    <View style={styles.desktopPage}>{children}</View>
  </View></AdminModulesLoadingContext.Provider></AdminModulesContext.Provider>;

  if (isAdmin) return <AdminModulesContext.Provider value={adminModules}><AdminModulesLoadingContext.Provider value={adminModulesLoading}><View onLayout={event => setContainerWidth(current => current === event.nativeEvent.layout.width ? current : event.nativeEvent.layout.width)} style={[styles.root, { backgroundColor: colors.background }]}>
    {!desktop&&<SafeAreaView edges={['top']} style={[styles.topSafe, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.adminTopBar}><PetCareLogo style={styles.adminTopLogo}/><Pressable accessibilityRole="button" accessibilityLabel="Mi perfil" onPress={() => router.push('/account')} style={styles.profileButton}><Ionicons name="person-circle-outline" size={27} color={colors.primary}/></Pressable></View>
    </SafeAreaView>}
    <View style={styles.adminPage}>{children}</View>
    {!isAdminFullScreenRoute(pathname)&&!isRoleDetailRoute(pathname)&&<AdminBottomNavigation pathname={pathname} personalItems={personalModulesForCapabilities(user.permissions).map(module=>({label:module.name,path:module.path,icon:iconFor(module.code)}))}/>}
  </View></AdminModulesLoadingContext.Provider></AdminModulesContext.Provider>;

  if (isVeterinarian && desktop) return <AdminModulesContext.Provider value={[]}><AdminModulesLoadingContext.Provider value={false}><View onLayout={event => setContainerWidth(current => current === event.nativeEvent.layout.width ? current : event.nativeEvent.layout.width)} style={[styles.desktopRoot, { backgroundColor: colors.background }]}>
    <DesktopSidebar items={desktopItems} activePath={desktopSelected?.path ?? null} onNavigate={navigate} />
    <View style={styles.desktopPage}>{children}</View>
  </View></AdminModulesLoadingContext.Provider></AdminModulesContext.Provider>;

  if (isVeterinarian) return <AdminModulesContext.Provider value={[]}><AdminModulesLoadingContext.Provider value={false}><View style={[styles.root, { backgroundColor: colors.background }]}>
    {!desktop&&<SafeAreaView edges={['top']} style={[styles.topSafe, softSurfaceShadow(colors.primary), { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.veterinarianTopBar}>
        <PetCareLogo style={styles.veterinarianTopLogo}/>
        <Pressable accessibilityRole="button" accessibilityLabel="Mi perfil" onPress={() => router.push('/vet/profile')} style={styles.profileButton}><Ionicons name="person-circle-outline" size={27} color={colors.primary}/></Pressable>
      </View>
    </SafeAreaView>}
    <View style={styles.adminPage}>{children}</View>
    {!isVeterinarianFullScreenRoute(pathname)&&!isRoleDetailRoute(pathname)&&<VeterinarianBottomNavigation pathname={pathname} items={items}/>}
  </View></AdminModulesLoadingContext.Provider></AdminModulesContext.Provider>;

  return <AdminModulesContext.Provider value={isAdmin ? adminModules : []}><AdminModulesLoadingContext.Provider value={isAdmin && adminModulesLoading}><View onLayout={event => setContainerWidth(current => current === event.nativeEvent.layout.width ? current : event.nativeEvent.layout.width)} style={[styles.root, { backgroundColor: colors.background }]}>
    {!desktop&&<SafeAreaView edges={['top']} style={[styles.topSafe, softSurfaceShadow(colors.primary), { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.topBar}>
        {isClient || isAdmin || isVeterinarian ? <PetCareLogo style={isClient ? styles.clientTopLogo : styles.topLogo}/> : <AppText numberOfLines={1} style={styles.currentTitle}>{selected?.label ?? 'PetCare'}</AppText>}
        {isClient&&<Pressable accessibilityRole="button" accessibilityLabel={unreadNotifications>0?`Notificaciones, ${unreadNotifications} sin leer`:'Notificaciones'} onPress={()=>router.push('/client/notifications')} style={styles.profileButton}><Ionicons name="notifications-outline" size={23} color={colors.primary}/>{unreadNotifications>0&&<View style={[styles.notificationDot,{backgroundColor:colors.highlight,width:unreadNotifications>9?22:17,height:17,minWidth:17,top:3,right:3,borderRadius:9,borderWidth:0,alignItems:'center',justifyContent:'center'}]}><Text style={{color:colors.onHighlight,fontSize:9,fontWeight:'700',lineHeight:12}}>{unreadNotifications>99?'99+':unreadNotifications}</Text></View>}</Pressable>}
        {!isClient&&<Pressable accessibilityRole="button" accessibilityLabel="Mi perfil" onPress={()=>router.push(isVeterinarian?'/vet/profile':'/account')} style={styles.profileButton}><Ionicons name="person-circle-outline" size={25} color={colors.primary}/></Pressable>}
      </View>
    </SafeAreaView>}
    {isAdmin && !desktop && pathname !== '/admin' && <View style={[styles.adminPageBar, {backgroundColor:colors.surface,borderBottomColor:colors.border}]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={adminBack} style={[styles.backButton,{backgroundColor:colors.accent}]}>
        <Ionicons name="arrow-back" size={21} color={colors.text}/>
      </Pressable>
      <View style={styles.adminPageHeading}>
        <AppText numberOfLines={1} style={styles.adminPageTitle}>{selected?.label ?? 'Administración'}</AppText>
        <AppText numberOfLines={1} variant="caption" muted>PetCare · Gestión de la clínica</AppText>
      </View>
    </View>}
    {desktop ? <View onLayout={event => setContainerWidth(current => current === event.nativeEvent.layout.width ? current : event.nativeEvent.layout.width)} style={[styles.desktopRoot,{backgroundColor:colors.background}]}>
      <DesktopSidebar items={desktopItems} activePath={desktopSelected?.path ?? null} onNavigate={navigate} />
      <View style={styles.desktopPage}>{children}</View>
    </View> : <View style={styles.body}>
      <View style={styles.page}>{children}</View>
    </View>}
    {!isClient&&!desktop&&!isRoleDetailRoute(pathname)&&<RoleBottomNavigation items={items} activePath={selected?.path??null} onNavigate={navigate}/>}
  </View></AdminModulesLoadingContext.Provider></AdminModulesContext.Provider>;
}

function DesktopSidebar({items,activePath,onNavigate}:{items:MenuItem[];activePath:string|null;onNavigate:(path:string)=>void}) {
  const {colors,mode,setPreference}=useTheme();
  const {user,signOut}=useAuth();
  const {width}=useWindowDimensions();
  const [confirmLogout,setConfirmLogout]=useState(false);
  const groups=items.some(item=>item.group);
  const initials=[user?.firstName?.[0],user?.lastName?.[0]].filter(Boolean).join('').toLocaleUpperCase();
  const navItem=(item:MenuItem)=><Pressable key={item.path} accessibilityRole="button" accessibilityState={{selected:item.path===activePath}} onPress={()=>onNavigate(item.path)} style={[styles.desktopNavItem,{backgroundColor:item.path===activePath?colors.accent:'transparent',borderColor:item.path===activePath?colors.primary:'transparent'}]}>
    <Ionicons name={item.icon} size={20} color={item.path===activePath?colors.primary:colors.muted}/>
    <AppText numberOfLines={1} style={[styles.itemText,{color:item.path===activePath?colors.primary:colors.text,fontWeight:item.path===activePath?'700':'500'}]}>{item.label}</AppText>
  </Pressable>;
  return <View style={[styles.desktopSidebar,{width:desktopSidebarWidth(width),backgroundColor:colors.surface,borderColor:colors.border}]}>
    <ScrollView style={styles.desktopMenu} contentContainerStyle={styles.desktopMenuContent} keyboardShouldPersistTaps="handled">
      <View style={styles.desktopBrand}><PetCareLogo style={styles.desktopLogo}/></View>
      {groups?adminGroups.map(group=>{const groupItems=items.filter(item=>item.group===group);return groupItems.length?<View key={group}><View style={styles.groupHeading}><AppText variant="caption" muted style={styles.groupLabel}>{group}</AppText></View>{groupItems.map(navItem)}</View>:null;}):items.map(navItem)}
      {groups&&items.filter(item=>!item.group).map(navItem)}
      <View style={[styles.desktopAccount,{borderColor:colors.border}]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Abrir mi perfil" onPress={()=>onNavigate(user?.role==='CLIENT'?'/client/profile':user?.role==='VETERINARIAN'?'/vet/profile':'/account')} style={styles.desktopIdentity}><View style={[styles.desktopAvatar,{backgroundColor:colors.accent}]}><AppText style={{color:colors.primary,fontWeight:'700'}}>{initials||'•'}</AppText></View><View style={styles.desktopUserCopy}><AppText numberOfLines={1} style={styles.desktopUserName}>{[user?.firstName,user?.lastName].filter(Boolean).join(' ')||roleLabel(user!.role,user!.roleName??user!.role)}</AppText><AppText numberOfLines={1} variant="caption" muted>{user?.email}</AppText></View></Pressable>
        <AppText numberOfLines={1} variant="caption" muted>{roleLabel(user!.role,user!.roleName??user!.role)}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel={mode==='dark'?'Usar modo claro':'Usar modo oscuro'} onPress={()=>setPreference(mode==='dark'?'light':'dark')} style={styles.desktopAction}><Ionicons name={mode==='dark'?'sunny-outline':'moon-outline'} size={19} color={colors.muted}/><AppText style={styles.itemText}>{mode==='dark'?'Modo claro':'Modo oscuro'}</AppText></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión" onPress={()=>setConfirmLogout(true)} style={styles.desktopAction}><Ionicons name="log-out-outline" size={19} color={colors.muted}/><AppText style={styles.itemText}>Cerrar sesión</AppText></Pressable>
      </View>
    </ScrollView>
    <ConfirmModal visible={confirmLogout} title="Cerrar sesión" message="Podés volver a ingresar cuando quieras." confirmLabel="Cerrar sesión" destructive onCancel={()=>setConfirmLogout(false)} onConfirm={signOut}/>
  </View>;
}

const styles = StyleSheet.create({
  desktopRoot:{flex:1,minHeight:0,flexDirection:'row'},desktopPage:{flex:1,minWidth:0,minHeight:0},desktopSidebar:{flexShrink:0,minHeight:0,paddingHorizontal:16,paddingVertical:18,borderRightWidth:1},desktopBrand:{minHeight:54,justifyContent:'center',paddingHorizontal:2},desktopLogo:{width:132,height:36,alignSelf:'flex-start'},desktopMenu:{flex:1,minHeight:0},desktopMenuContent:{flexGrow:1,gap:5,paddingBottom:12},desktopNavItem:{minHeight:46,paddingHorizontal:11,borderRadius:13,borderLeftWidth:3,flexDirection:'row',alignItems:'center',gap:11},desktopAccount:{gap:9,paddingTop:14,marginTop:'auto',borderTopWidth:1},desktopIdentity:{minHeight:42,flexDirection:'row',alignItems:'center',gap:10},desktopAvatar:{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center'},desktopUserCopy:{flex:1,minWidth:0,gap:2},desktopUserName:{fontWeight:'700'},desktopAction:{minHeight:38,paddingHorizontal:4,flexDirection:'row',alignItems:'center',gap:10},
  root: { flex: 1 }, topSafe: { borderBottomWidth: 1 }, topBar: { minHeight: 60, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  veterinarianTopBar:{minHeight:64,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'flex-end'},veterinarianTopLogo:{position:'absolute',left:'50%',marginLeft:-58,width:116,height:34},
  adminTopBar:{minHeight:60,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},adminTopLogo:{width:116,height:34},adminPage:{flex:1,minHeight:0},
  currentTitle: { flex: 1, minWidth: 0, fontSize: 17, fontWeight: '600', textAlign: 'center' }, topLogo:{width:108,height:32,flex:1,alignSelf:'center'}, clientTopLogo:{position:'absolute',width:152,height:44,left:'50%',marginLeft:-76}, profileButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, notificationDot:{position:'absolute',top:7,right:7,width:9,height:9,borderRadius:5,borderWidth:1,borderColor:'#fff'},
  adminPageBar:{minHeight:64,paddingHorizontal:16,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:10,borderBottomWidth:1},backButton:{width:44,height:44,borderRadius:14,alignItems:'center',justifyContent:'center'},adminPageHeading:{flex:1,minWidth:0,gap:2},adminPageTitle:{fontSize:18,fontWeight:'600'},
  body: { flex: 1, flexDirection: 'row', minHeight: 0 }, page: { flex: 1, minWidth: 0 },
  groupHeading:{minHeight:38,paddingHorizontal:8,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},groupLabel:{textTransform:'uppercase',letterSpacing:0.8}, itemText: { flex: 1, minWidth: 0 },
});
