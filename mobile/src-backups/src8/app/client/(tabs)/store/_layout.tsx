/** Las pantallas de carrito y checkout siguen dentro de la pestaña Tienda. */
import { Stack } from 'expo-router';
import { useTheme } from '../../../../hooks/useTheme';

export default function StoreStack() {
  const { colors } = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
