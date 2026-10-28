// Este archivo se encarga de lo siguiente: Pantalla o navegación del área de clientes; muestra y permite gestionar la información del usuario y sus mascotas.

/** Conserva los stacks y estados de las pestañas del cliente; la barra visible la aporta el layout global. */
import { Stack, Tabs } from 'expo-router';
import { useTheme } from '../../../hooks/useTheme';
import { StoreCheckoutProvider } from '../../../contexts/StoreCheckoutContext';
import { useAuth } from '../../../hooks/useAuth';

// Función ClientTabs: concentra la lógica dentro de este módulo.
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
