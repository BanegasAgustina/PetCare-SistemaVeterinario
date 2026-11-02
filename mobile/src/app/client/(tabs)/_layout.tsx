/**
 * ARCHIVO: _layout.tsx
 * UBICACIÓN: mobile/src/app/client/(tabs)/_layout.tsx
 * FUNCIÓN: Compone las pestañas y stacks del área cliente, con estado de checkout compartido.
 * RESPONSABILIDAD: Consulta rol/tema, mantiene StoreCheckoutProvider y declara navegación de cada pestaña.
 * CONEXIONES: Importa: mobile/src/hooks/useTheme.ts, mobile/src/contexts/StoreCheckoutContext.tsx, mobile/src/hooks/useAuth.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → Tabs/Stack; el checkout comparte StoreCheckoutContext mientras el layout global presenta navegación visible.
 * IMPORTANCIA: Conserva datos del carrito/checkout al cambiar de ruta y mantiene la jerarquía de navegación.
 */
/** Conserva los stacks y estados de las pestañas del cliente; la barra visible la aporta el layout global. */
import { Stack, Tabs } from 'expo-router';
import { useTheme } from '../../../hooks/useTheme';
import { StoreCheckoutProvider } from '../../../contexts/StoreCheckoutContext';
import { useAuth } from '../../../hooks/useAuth';

/** Mantiene StoreCheckoutProvider y define pestañas solo para la cuenta CLIENT; otros roles reciben un Stack básico. */
export default function ClientTabs() {
  const { user } = useAuth();
  const { colors } = useTheme();

  if(user?.role!=='CLIENT')return <StoreCheckoutProvider><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:colors.background}}}/></StoreCheckoutProvider>;

  return <StoreCheckoutProvider><Tabs screenOptions={{
    headerShown: false,
    tabBarHideOnKeyboard: true,
    tabBarStyle: { display: 'none' },
  }}>
    <Tabs.Screen name="index" />
    <Tabs.Screen name="pets" />
    <Tabs.Screen name="appointments" />
    <Tabs.Screen name="store" />
    <Tabs.Screen name="profile" />
  </Tabs></StoreCheckoutProvider>;
}
