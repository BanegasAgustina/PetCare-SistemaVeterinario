/** Navegación original del cliente: conserva sus cinco pestañas nativas y el stack de compra. */
import { Stack, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { StoreCheckoutProvider } from '../../../contexts/StoreCheckoutContext';
import { useAuth } from '../../../hooks/useAuth';

export default function ClientTabs() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if(user?.role!=='CLIENT')return <StoreCheckoutProvider><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:colors.background}}}/></StoreCheckoutProvider>;

  return <StoreCheckoutProvider><Tabs screenOptions={{
    headerShown: false,
    tabBarHideOnKeyboard: true,
    tabBarActiveTintColor: String(colors.primary),
    tabBarInactiveTintColor: String(colors.muted),
    tabBarStyle: {
      backgroundColor: String(colors.background),
      borderTopColor: String(colors.border),
      height: 66 + insets.bottom,
      paddingHorizontal: 6,
      paddingTop: 5,
      paddingBottom: Math.max(insets.bottom, 6),
    },
    tabBarItemStyle: {
      flex: 1,
      minWidth: 0,
      marginHorizontal: 0,
      marginVertical: 2,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabBarIconStyle: { alignSelf: 'center' },
    tabBarLabelStyle: {
      width: '100%',
      flexShrink: 1,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
    tabBarActiveBackgroundColor: String(colors.accent),
  }}>
    <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={String(color)} size={size} /> }} />
    <Tabs.Screen name="pets" options={{ title: 'Mascotas', tabBarIcon: ({ color, size }) => <Ionicons name="paw-outline" color={String(color)} size={size} /> }} />
    <Tabs.Screen name="appointments" options={{ title: 'Turnos', tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={String(color)} size={size} /> }} />
    <Tabs.Screen name="store" options={{ title: 'Tienda', tabBarIcon: ({ color, size }) => <Ionicons name="bag-handle-outline" color={String(color)} size={size} /> }} />
    <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={String(color)} size={size} /> }} />
  </Tabs></StoreCheckoutProvider>;
}
