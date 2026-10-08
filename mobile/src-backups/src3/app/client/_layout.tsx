/**
 * Navegador del módulo client, para CLIENT autenticado. Organiza las rutas; el backend comprueba nuevamente autorización y ownership.
 */
import { Stack } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
export default function ClientLayout(){const {colors}=useTheme();return <Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:colors.background}}}/>;}
