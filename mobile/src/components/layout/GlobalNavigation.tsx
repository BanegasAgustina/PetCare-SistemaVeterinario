// Este archivo se encarga de lo siguiente: Componente de estructura visual y navegación; define cómo se acomodan las pantallas.

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
import { BackButton } from './BackButton';
import { useBackNavigation } from '../../hooks/useBackNavigation';
import { RoleQuickAccessProvider } from './RoleNavigationContext';
import { AppBreadcrumbs } from './AppBreadcrumbs';
import { ConfirmModal } from '../ui/ConfirmModal';
import { desktopSidebarWidth, isWebAtLeast, responsiveLayout } from '../../constants/responsive';
import { activePrimaryNavigationPath, selectPrimaryNavigation, selectSecondaryNavigation } from '../../utils/navigation-tabs';

// Tipo MenuItem: define la forma o las opciones válidas de los datos usados por este módulo.
type MenuItem = { label: string; path: string; icon: IconName; permission?: string; group?: string };
// Tipo AdminModule: define la forma o las opciones válidas de los datos usados por este módulo.
type AdminModule = { code: string; name: string; path: string };
// Configuración noAdminModules: reúne valores o reglas que consume el resto del módulo.
const noAdminModules: AdminModule[] = [];
// Dato AdminModulesContext: conserva un valor calculado o de configuración usado por este módulo.
const AdminModulesContext = createContext<AdminModule[]>([]);
// Dato AdminModulesLoadingContext: conserva un valor calculado o de configuración usado por este módulo.
const AdminModulesLoadingContext = createContext(false);
// Configuración scheduleAdminModule: reúne valores o reglas que consume el resto del módulo.
const scheduleAdminModule: AdminModule = { code: 'schedule.manage', name: 'Horarios', path: '/admin/availability' };
// Función useAdminModules: concentra la lógica dentro de este módulo.
export function useAdminModules() { return useContext(AdminModulesContext); }
// Función useAdminModulesLoading: concentra la lógica dentro de este módulo.
export function useAdminModulesLoading() { return useContext(AdminModulesLoadingContext); }
// Dato adminGroups: conserva un valor calculado o de configuración usado por este módulo.
const adminGroups = ['Inicio', 'Clínica', 'Tienda', 'Administración'] as const;
// Función adminGroup: concentra la lógica dentro de este módulo.
function adminGroup(path: string): typeof adminGroups[number] {
  if (path === '/admin') return 'Inicio';
  if (['/admin/patients','/admin/agenda','/admin/availability','/admin/veterinarians','/admin/professionals','/admin/clients','/admin/catalog/services','/admin/specialties'].includes(path)) return 'Clínica';
  if (['/admin/products','/admin/catalog/products','/admin/catalog/categories','/admin/catalog/promotions','/admin/store-settings','/admin/store-orders','/admin/store-banners'].includes(path)) return 'Tienda';
  return 'Administración';
}
// Función adminLabel: concentra la lógica dentro de este módulo.
function adminLabel(module: AdminModule) {
  const labels: Record<string,string> = {
    '/admin/patients':'Pacientes','/admin/agenda':'Turnos','/admin/clients':'Clientes','/admin/veterinarians':'Veterinarios','/admin/professionals':'Profesionales',
    '/admin/catalog/services':'Servicios','/admin/availability':'Horarios','/admin/products':'Inventario y stock',
    '/admin/catalog/products':'Productos','/admin/catalog/categories':'Categorías','/admin/catalog/promotions':'Promociones y descuentos','/admin/store-banners':'Banners y slider','/admin/store-settings':'Envíos y entregas','/admin/store-orders':'Pedidos','/admin/specialties':'Tipos y especialidades','/admin/users':'Usuarios','/admin/roles':'Roles','/admin/permissions':'Permisos',
  };
  return labels[module.path] ?? module.name;
}
// Configuración clientItems: reúne valores o reglas que consume el resto del módulo.
const clientItems: MenuItem[] = [
  { label: 'Inicio', path: '/client', icon: 'home-outline' },
  { label: 'Mis mascotas', path: '/client/pets', icon: 'paw-outline' },
  { label: 'Turnos', path: '/client/appointments', icon: 'calendar-outline' },
  { label: 'Tienda', path: '/client/store', icon: 'bag-handle-outline' },
  { label: 'Mi perfil', path: '/client/profile', icon: 'person-outline' },
  { label: 'Mis pedidos', path: '/client/orders', icon: 'receipt-outline', group: 'Cuenta' },
  { label: 'Historial médico', path: '/client/medical-history', icon: 'medical-outline', group: 'Salud' },
  { label: 'Vacunas', path: '/client/vaccines', icon: 'shield-checkmark-outline', group: 'Salud' },
  { label: 'Recetas', path: '/client/prescriptions', icon: 'document-text-outline', group: 'Salud' },
  { label: 'Recomendaciones', path: '/client/recommendations', icon: 'heart-outline', group: 'Salud' },
];
// Configuración staffItems: reúne valores o reglas que consume el resto del módulo.
const staffItems: MenuItem[] = [
  { label: 'Agenda', path: 'agenda', icon: 'calendar-outline', permission: 'appointments.view_own' },
  { label: 'Agenda', path: 'agenda', icon: 'calendar-outline', permission: 'appointments.view_all' },
  { label: 'Productos', path: 'products', icon: 'pricetags-outline', permission: 'products.view', group: 'Tienda' },
  { label: 'Clientes', path: 'clients', icon: 'people-outline', permission: 'users.view_basic' },
];
// Configuración veterinarianItems: reúne valores o reglas que consume el resto del módulo.
const veterinarianItems: MenuItem[] = [
  { label: 'Inicio', path: '/vet', icon: 'home-outline' },
  { label: 'Agenda', path: '/vet/agenda', icon: 'calendar-outline', permission: 'appointments.view_own' },
  { label: 'Agenda', path: '/vet/agenda', icon: 'calendar-outline', permission: 'appointments.view_all' },
  { label: 'Pacientes', path: '/vet/patients', icon: 'paw-outline', permission: 'pets.view_information' },
  { label: 'Mis clientes', path: '/vet/clients', icon: 'people-outline', permission: 'pets.view_information' },
  { label: 'Productos', path: '/vet/products', icon: 'pricetags-outline', permission: 'products.view' },
];
// Configuración groomerItems: reúne valores o reglas que consume el resto del módulo.
const groomerItems: MenuItem[] = [
  { label: 'Panel principal', path: '/professional', icon: 'home-outline' },
  { label: 'Mi agenda', path: '/professional/agenda', icon: 'calendar-outline', permission: 'appointments.view_own' },
  { label: 'Mi agenda', path: '/professional/agenda', icon: 'calendar-outline', permission: 'appointments.view_all' },
  { label: 'Pacientes', path: '/professional/patients', icon: 'paw-outline', permission: 'appointments.view_own' },
  { label: 'Pacientes', path: '/professional/patients', icon: 'paw-outline', permission: 'appointments.view_all' },
  { label: 'Servicios', path: '/professional/services', icon: 'pricetags-outline', permission: 'appointments.view_own' },
  { label: 'Servicios', path: '/professional/services', icon: 'pricetags-outline', permission: 'appointments.view_all' },
];
// Función iconFor: concentra la lógica dentro de este módulo.
function iconFor(code: string): IconName {
  if (code.includes('pet')) return 'paw-outline';
  if (code.includes('appointment') || code.includes('schedule')) return 'calendar-outline';
  if (code.includes('store') || code.includes('order')) return 'bag-handle-outline';
  if (code.includes('profile')) return 'person-outline';
  if (code.includes('professional') || code.includes('veterinarian')) return 'medkit-outline';
  if (code.includes('user')) return 'people-outline';
  if (code.includes('role') || code.includes('permission')) return 'shield-checkmark-outline';
  if (code.includes('product') || code.includes('service') || code.includes('categor')) return 'pricetags-outline';
  return 'settings-outline';
}

// Configuración adminTabs: reúne valores o reglas que consume el resto del módulo.
const adminTabs = [
  { label: 'Inicio', path: '/admin', icon: 'home-outline' as const },
  { label: 'Clínica', path: '/admin/clinic', icon: 'medkit-outline' as const },
  { label: 'Tienda', path: '/admin/store', icon: 'bag-handle-outline' as const },
  { label: 'Administración', path: '/admin/administration', icon: 'settings-outline' as const },
];

// Función GlobalNavigation: concentra la lógica dentro de este módulo.
export function GlobalNavigation({ children }: PropsWithChildren) {
  const auth = useAuth();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(width);
  const pathname = usePathname();
  const { shouldShowBack } = useBackNavigation();
  const { request, hasPermission, user } = auth;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isCustomRole = Boolean(user && !['CLIENT','VETERINARIAN','GROOMER','ADMIN','SUPER_ADMIN'].includes(user.role));
  const isClient = user?.role === 'CLIENT';
  const isVeterinarian = user?.role === 'VETERINARIAN';
  const [adminModulesResult, setAdminModulesResult] = useState<{ userId: string | null; modules: AdminModule[] }>({ userId: null, modules: [] });
  const adminModules = adminModulesResult.userId === user?.id ? adminModulesResult.modules : noAdminModules;
  const adminModulesLoading = isAdmin && adminModulesResult.userId !== user?.id;
  const visibleAdminModules = useMemo(() => isAdmin && hasPermission('schedule.manage') && !adminModules.some(module => module.path === scheduleAdminModule.path) ? [...adminModules, scheduleAdminModule] : adminModules, [adminModules, hasPermission, isAdmin]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const desktop = isWebAtLeast(Platform.OS, Math.min(width, containerWidth), responsiveLayout.breakpoints.desktop);
  const base = user?.role === 'VETERINARIAN' ? '/vet' : user?.role === 'GROOMER' ? '/professional' : '/admin';
  useEffect(() => {
    let active = true;
    if (!isAdmin || !user?.id) return () => { active = false; };
    void request<{ modules: AdminModule[] }>('/admin/home',{method:'POST',body:{}}).then(result => { if (active) setAdminModulesResult({ userId: user.id, modules: result.modules }); }).catch(() => { if (active) setAdminModulesResult({ userId: user.id, modules: [] }); });
    return () => { active = false; };
  }, [request, user?.id, user?.role, isAdmin]);
  useEffect(() => {
    let active = true;
    if (!isClient) return () => { active = false; };
    // Función refreshUnread: agrupa una operación que este módulo puede ejecutar o reutilizar.
const refreshUnread=()=>void request<{ unreadCount?: number }>('/client/notifications',{method:'POST',body:{limit:1}}).then(result => { if (active) setUnreadNotifications(result.unreadCount ?? 0); }).catch(() => undefined);
    refreshUnread();
    const unsubscribe=subscribeToNotificationChanges(refreshUnread);
    return () => { active = false;unsubscribe(); };
  }, [request, user?.id, isClient]);
  const items = useMemo<MenuItem[]>(() => {
    if (!user) return [];
  if (user.role === 'CLIENT') return clientItems;
    const personalItems: MenuItem[]=personalModulesForCapabilities(user.permissions).map(module=>({label:module.name,path:module.path,icon:iconFor(module.code)}));
    if (isAdmin) return [
      { label: 'Panel principal', path: '/admin', icon: 'grid-outline', group: adminGroup('/admin') },
      ...[...new Map(visibleAdminModules.filter(module=>!['/admin/catalog/types','/admin/catalog/specialties'].includes(module.path)).map(module=>[module.path,module])).values()].map((module): MenuItem => ({ label: adminLabel(module), path: module.path, icon: iconFor(module.code), group: adminGroup(module.path) })),
      ...(hasPermission('users.view_basic')?[{label:'Clientes',path:'/admin/clients',icon:'people-outline' as const,group:'Clínica'}]:[]),
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
  const primaryItems = useMemo<MenuItem[]>(() => isAdmin
    ? adminTabs.filter(tab=>tab.path==='/admin'||items.some(item=>item.group===tab.label))
    : selectPrimaryNavigation(user?.role??'',items), [isAdmin,items,user?.role]);
  const quickAccessItems = useMemo<MenuItem[]>(() => selectSecondaryNavigation(user?.role??'',items,primaryItems), [items,primaryItems,user?.role]);
  const selected = [...items].filter(item => pathname === item.path || pathname.startsWith(`${item.path}/`)).sort((a, b) => b.path.length - a.path.length)[0];
  const desktopItems = useMemo(() => isClient
    ? [...items, { label: unreadNotifications ? `Notificaciones (${unreadNotifications})` : 'Notificaciones', path: '/client/notifications', icon: 'notifications-outline' as const }]
    : items, [items, isClient, unreadNotifications]);
  const desktopSelected = [...desktopItems].filter(item => pathname === item.path || pathname.startsWith(`${item.path}/`)).sort((a, b) => b.path.length - a.path.length)[0];
  const activePrimaryPath=activePrimaryNavigationPath(user?.role??'',pathname,primaryItems);

  if (!user || ['/login','/register','/reset-password','/change-initial-password','/oauth','/activate-account','/activate-vet'].includes(pathname)) return <>{children}</>;
  // Función navigate: agrupa una operación que este módulo puede ejecutar o reutilizar.
const navigate = (path: string) => router.navigate(path as never);

  if (isAdmin && desktop) return <AdminModulesContext.Provider value={adminModules}><AdminModulesLoadingContext.Provider value={adminModulesLoading}><View style={[styles.root, { backgroundColor: colors.background }]}>
    <View onLayout={event => setContainerWidth(current => current === event.nativeEvent.layout.width ? current : event.nativeEvent.layout.width)} style={[styles.desktopRoot, { backgroundColor: colors.background }]}>
      <DesktopSidebar items={desktopItems} activePath={desktopSelected?.path ?? null} onNavigate={navigate} />
      <RoleQuickAccessProvider items={quickAccessItems}><DesktopPageContent role={user.role} destinations={[...desktopItems,...primaryItems]}>{children}</DesktopPageContent></RoleQuickAccessProvider>
    </View>
    <RoleBottomNavigation items={primaryItems} activePath={activePrimaryPath} onNavigate={navigate}/>
  </View></AdminModulesLoadingContext.Provider></AdminModulesContext.Provider>;

  if (isAdmin) return <AdminModulesContext.Provider value={adminModules}><AdminModulesLoadingContext.Provider value={adminModulesLoading}><View onLayout={event => setContainerWidth(current => current === event.nativeEvent.layout.width ? current : event.nativeEvent.layout.width)} style={[styles.root, { backgroundColor: colors.background }]}>
    {!desktop&&<SafeAreaView edges={['top']} style={[styles.topSafe, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.adminTopBar}><PetCareLogo style={styles.adminTopLogo}/><Pressable accessibilityRole="button" accessibilityLabel="Mi perfil" onPress={() => router.push('/account')} style={styles.profileButton}><Ionicons name="person-circle-outline" size={27} color={colors.primary}/></Pressable></View>
    </SafeAreaView>}
    {!desktop&&shouldShowBack&&!['/admin/agenda','/admin/appointment'].includes(pathname)&&<View style={[styles.adminPageBar,{backgroundColor:colors.surface,borderBottomColor:colors.border}]}>
      <BackButton/>
      <View style={styles.adminPageHeading}>
        <AppText numberOfLines={1} style={styles.adminPageTitle}>{selected?.label??'Administración'}</AppText>
        <AppText numberOfLines={1} variant="caption" muted>PetCare · Gestión de la clínica</AppText>
      </View>
    </View>}
    <View style={styles.adminPage}><RoleQuickAccessProvider items={quickAccessItems}>{children}</RoleQuickAccessProvider></View>
    <RoleBottomNavigation items={primaryItems} activePath={activePrimaryPath} onNavigate={navigate}/>
  </View></AdminModulesLoadingContext.Provider></AdminModulesContext.Provider>;

  if (isVeterinarian && desktop) return <AdminModulesContext.Provider value={[]}><AdminModulesLoadingContext.Provider value={false}><View style={[styles.root, { backgroundColor: colors.background }]}>
    <View onLayout={event => setContainerWidth(current => current === event.nativeEvent.layout.width ? current : event.nativeEvent.layout.width)} style={[styles.desktopRoot, { backgroundColor: colors.background }]}>
      <DesktopSidebar items={desktopItems} activePath={desktopSelected?.path ?? null} onNavigate={navigate} />
      <RoleQuickAccessProvider items={quickAccessItems}><DesktopPageContent role={user.role} destinations={[...desktopItems,...primaryItems]}>{children}</DesktopPageContent></RoleQuickAccessProvider>
    </View>
    <RoleBottomNavigation items={primaryItems} activePath={activePrimaryPath} onNavigate={navigate}/>
  </View></AdminModulesLoadingContext.Provider></AdminModulesContext.Provider>;

  if (isVeterinarian) return <AdminModulesContext.Provider value={[]}><AdminModulesLoadingContext.Provider value={false}><View style={[styles.root, { backgroundColor: colors.background }]}>
    {!desktop&&<SafeAreaView edges={['top']} style={[styles.topSafe, softSurfaceShadow(colors.primary), { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.veterinarianTopBar}>
        <PetCareLogo style={styles.veterinarianTopLogo}/>
        <Pressable accessibilityRole="button" accessibilityLabel="Mi perfil" onPress={() => router.push('/account')} style={styles.profileButton}><Ionicons name="person-circle-outline" size={27} color={colors.primary}/></Pressable>
      </View>
    </SafeAreaView>}
    <View style={styles.adminPage}><RoleQuickAccessProvider items={quickAccessItems}>{children}</RoleQuickAccessProvider></View>
    <RoleBottomNavigation items={primaryItems} activePath={activePrimaryPath} onNavigate={navigate}/>
  </View></AdminModulesLoadingContext.Provider></AdminModulesContext.Provider>;

  return <AdminModulesContext.Provider value={isAdmin ? adminModules : []}><AdminModulesLoadingContext.Provider value={isAdmin && adminModulesLoading}><View onLayout={event => setContainerWidth(current => current === event.nativeEvent.layout.width ? current : event.nativeEvent.layout.width)} style={[styles.root, { backgroundColor: colors.background }]}>
    {!desktop&&<SafeAreaView edges={['top']} style={[styles.topSafe, softSurfaceShadow(colors.primary), { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.topBar}>
        {isClient || isAdmin || isVeterinarian ? <PetCareLogo style={isClient ? styles.clientTopLogo : styles.topLogo}/> : <AppText numberOfLines={1} style={styles.currentTitle}>{selected?.label ?? 'PetCare'}</AppText>}
        {isClient&&<Pressable accessibilityRole="button" accessibilityLabel={unreadNotifications>0?`Notificaciones, ${unreadNotifications} sin leer`:'Notificaciones'} onPress={()=>router.push('/client/notifications')} style={styles.profileButton}><Ionicons name="notifications-outline" size={23} color={colors.primary}/>{unreadNotifications>0&&<View style={[styles.notificationDot,{backgroundColor:colors.highlight,width:unreadNotifications>9?22:17,height:17,minWidth:17,top:3,right:3,borderRadius:9,borderWidth:0,alignItems:'center',justifyContent:'center'}]}><Text style={{color:colors.onHighlight,fontSize:9,fontWeight:'700',lineHeight:12}}>{unreadNotifications>99?'99+':unreadNotifications}</Text></View>}</Pressable>}
        {!isClient&&<Pressable accessibilityRole="button" accessibilityLabel="Mi perfil" onPress={()=>router.push('/account')} style={styles.profileButton}><Ionicons name="person-circle-outline" size={25} color={colors.primary}/></Pressable>}
      </View>
    </SafeAreaView>}
    {desktop ? <View onLayout={event => setContainerWidth(current => current === event.nativeEvent.layout.width ? current : event.nativeEvent.layout.width)} style={[styles.desktopRoot,{backgroundColor:colors.background}]}>
      <DesktopSidebar items={desktopItems} activePath={desktopSelected?.path ?? null} onNavigate={navigate} />
       <RoleQuickAccessProvider items={quickAccessItems}><DesktopPageContent role={user?.role??''} destinations={[...desktopItems,...primaryItems]}>{children}</DesktopPageContent></RoleQuickAccessProvider>
    </View> : <View style={styles.body}>
      <View style={styles.page}><RoleQuickAccessProvider items={quickAccessItems}>{children}</RoleQuickAccessProvider></View>
    </View>}
    <RoleBottomNavigation items={primaryItems} activePath={activePrimaryPath} onNavigate={navigate}/>
  </View></AdminModulesLoadingContext.Provider></AdminModulesContext.Provider>;
}

// Función DesktopPageContent: concentra la lógica dentro de este módulo.
function DesktopPageContent({children,role,destinations}:PropsWithChildren<{role:string;destinations:MenuItem[]}>) {
  return <View style={styles.desktopPage}>
    <AppBreadcrumbs role={role} destinations={destinations}/>
    <View style={styles.desktopContent}>{children}</View>
  </View>;
}

// Función DesktopSidebar: concentra la lógica dentro de este módulo.
function DesktopSidebar({items,activePath,onNavigate}:{items:MenuItem[];activePath:string|null;onNavigate:(path:string)=>void}) {
  const {colors,mode,setPreference}=useTheme();
  const {user,signOut}=useAuth();
  const pathname=usePathname();
  const {width}=useWindowDimensions();
  const [confirmLogout,setConfirmLogout]=useState(false);
  const groups=items.some(item=>item.group);
  const initials=[user?.firstName?.[0],user?.lastName?.[0]].filter(Boolean).join('').toLocaleUpperCase();
  // Función navItem: agrupa una operación que este módulo puede ejecutar o reutilizar.
const navItem=(item:MenuItem)=><Pressable key={item.path} accessibilityRole="button" accessibilityState={{selected:item.path===activePath}} onPress={()=>onNavigate(item.path)} style={[styles.desktopNavItem,{backgroundColor:item.path===activePath?colors.accent:'transparent',borderColor:item.path===activePath?colors.primary:'transparent'}]}>
    <Ionicons name={item.icon} size={20} color={item.path===activePath?colors.primary:colors.muted}/>
    <AppText numberOfLines={1} style={[styles.itemText,{color:item.path===activePath?colors.primary:colors.text,fontWeight:item.path===activePath?'700':'500'}]}>{item.label}</AppText>
  </Pressable>;
  return <View style={[styles.desktopSidebar,{width:desktopSidebarWidth(width),backgroundColor:colors.surface,borderColor:colors.border}]}>
    <ScrollView nativeID="petcare-web-scroll-sidebar" style={styles.desktopMenu} contentContainerStyle={styles.desktopMenuContent} keyboardShouldPersistTaps="handled">
      <View style={styles.desktopBrand}><PetCareLogo style={styles.desktopLogo}/></View>
      {groups?adminGroups.map(group=>{const groupItems=items.filter(item=>item.group===group);const groupPath=adminTabs.find(tab=>tab.label===group)?.path;const groupSelected=Boolean(groupPath&&(pathname===groupPath||pathname.startsWith(`${groupPath}/`)))||Boolean(activePath&&items.some(item=>item.path===activePath&&item.group===group));return groupItems.length?<View key={group}><Pressable accessibilityRole="button" accessibilityState={{selected:groupSelected}} onPress={()=>groupPath&&onNavigate(groupPath)} style={[styles.groupHeading,groupSelected&&{backgroundColor:colors.accent}]}><AppText variant="caption" style={[styles.groupLabel,{color:groupSelected?colors.primary:colors.muted,fontWeight:groupSelected?'700':'500'}]}>{group}</AppText></Pressable>{groupItems.map(navItem)}</View>:null;}):items.map(navItem)}
      {groups&&items.filter(item=>!item.group).map(navItem)}
      <View style={[styles.desktopAccount,{borderColor:colors.border}]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Abrir mi perfil" onPress={()=>onNavigate(user?.role==='CLIENT'?'/client/profile':'/account')} style={styles.desktopIdentity}><View style={[styles.desktopAvatar,{backgroundColor:colors.accent}]}><AppText style={{color:colors.primary,fontWeight:'700'}}>{initials||'•'}</AppText></View><View style={styles.desktopUserCopy}><AppText numberOfLines={1} style={styles.desktopUserName}>{[user?.firstName,user?.lastName].filter(Boolean).join(' ')||roleLabel(user!.role,user!.roleName??user!.role)}</AppText><AppText numberOfLines={1} variant="caption" muted>{user?.email}</AppText></View></Pressable>
        <AppText numberOfLines={1} variant="caption" muted>{roleLabel(user!.role,user!.roleName??user!.role)}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel={mode==='dark'?'Usar modo claro':'Usar modo oscuro'} onPress={()=>setPreference(mode==='dark'?'light':'dark')} style={styles.desktopAction}><Ionicons name={mode==='dark'?'sunny-outline':'moon-outline'} size={19} color={colors.muted}/><AppText style={styles.itemText}>{mode==='dark'?'Modo claro':'Modo oscuro'}</AppText></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión" onPress={()=>setConfirmLogout(true)} style={styles.desktopAction}><Ionicons name="log-out-outline" size={19} color={colors.muted}/><AppText style={styles.itemText}>Cerrar sesión</AppText></Pressable>
      </View>
    </ScrollView>
    <ConfirmModal visible={confirmLogout} title="Cerrar sesión" message="Podés volver a ingresar cuando quieras." confirmLabel="Cerrar sesión" destructive onCancel={()=>setConfirmLogout(false)} onConfirm={signOut}/>
  </View>;
}

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({
  desktopRoot:{flex:1,minHeight:0,flexDirection:'row'},desktopPage:{flex:1,minWidth:0,minHeight:0},desktopContent:{flex:1,minWidth:0,minHeight:0},desktopSidebar:{flexShrink:0,minHeight:0,paddingHorizontal:16,paddingVertical:18,borderRightWidth:1},desktopBrand:{minHeight:54,justifyContent:'center',paddingHorizontal:2},desktopLogo:{width:132,height:36,alignSelf:'flex-start'},desktopMenu:{flex:1,minHeight:0},desktopMenuContent:{flexGrow:1,gap:5,paddingBottom:12},desktopNavItem:{minHeight:46,paddingHorizontal:11,borderRadius:13,borderLeftWidth:3,flexDirection:'row',alignItems:'center',gap:11},desktopAccount:{gap:9,paddingTop:14,marginTop:'auto',borderTopWidth:1},desktopIdentity:{minHeight:42,flexDirection:'row',alignItems:'center',gap:10},desktopAvatar:{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center'},desktopUserCopy:{flex:1,minWidth:0,gap:2},desktopUserName:{fontWeight:'700'},desktopAction:{minHeight:38,paddingHorizontal:4,flexDirection:'row',alignItems:'center',gap:10},
  root: { flex: 1 }, topSafe: { borderBottomWidth: 1 }, topBar: { minHeight: 60, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  veterinarianTopBar:{minHeight:64,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'flex-end'},veterinarianTopLogo:{position:'absolute',left:'50%',marginLeft:-58,width:116,height:34},
  adminTopBar:{minHeight:60,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},adminTopLogo:{width:116,height:34},adminPage:{flex:1,minHeight:0},
  currentTitle: { flex: 1, minWidth: 0, fontSize: 17, fontWeight: '600', textAlign: 'center' }, topLogo:{width:108,height:32,flex:1,alignSelf:'center'}, clientTopLogo:{position:'absolute',width:152,height:44,left:'50%',marginLeft:-76}, profileButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, notificationDot:{position:'absolute',top:7,right:7,width:9,height:9,borderRadius:5,borderWidth:1,borderColor:'#fff'},
  adminPageBar:{minHeight:64,paddingHorizontal:16,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:10,borderBottomWidth:1},backButton:{width:44,height:44,borderRadius:14,alignItems:'center',justifyContent:'center'},adminPageHeading:{flex:1,minWidth:0,gap:2},adminPageTitle:{fontSize:18,fontWeight:'600'},
  body: { flex: 1, flexDirection: 'row', minHeight: 0 }, page: { flex: 1, minWidth: 0 },
  groupHeading:{minHeight:38,paddingHorizontal:8,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},groupLabel:{textTransform:'uppercase',letterSpacing:0.8}, itemText: { flex: 1, minWidth: 0 },
});
