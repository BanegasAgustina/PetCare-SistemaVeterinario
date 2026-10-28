// Este archivo se encarga de lo siguiente: Pantalla o navegación del área de clientes; muestra y permite gestionar la información del usuario y sus mascotas.

/** Las pantallas de carrito y checkout siguen dentro de la pestaña Tienda. */
import { Stack } from 'expo-router';
import { useTheme } from '../../../../hooks/useTheme';

// Función StoreStack: concentra la lógica dentro de este módulo.
export default function StoreStack() {
  const { colors } = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
