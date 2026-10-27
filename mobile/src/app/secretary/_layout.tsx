/**
 * Navegador del módulo secretary, para SECRETARY autenticado. Organiza las rutas y sus guards con permisos de AuthContext; el backend comprueba nuevamente autorización y ownership.
 */
import { Stack } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
// El guard de ruta es una mejora de navegación; el backend también exige rol y products.view.
export default function Layout(){const {hasPermission}=useAuth();return <Stack screenOptions={{headerShown:false}}><Stack.Screen name="index"/><Stack.Protected guard={hasPermission('appointments.view_own')||hasPermission('appointments.view_all')}><Stack.Screen name="agenda"/><Stack.Screen name="appointment"/></Stack.Protected><Stack.Protected guard={hasPermission('products.view')}><Stack.Screen name="products"/></Stack.Protected><Stack.Protected guard={hasPermission('users.view_basic')}><Stack.Screen name="clients"/><Stack.Screen name="client"/></Stack.Protected></Stack>;}
