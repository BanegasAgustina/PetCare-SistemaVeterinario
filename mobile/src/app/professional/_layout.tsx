// Este archivo se encarga de lo siguiente: Pantalla o navegación del área profesional; reúne las tareas clínicas disponibles para el personal veterinario.

/**
 * Navegador del módulo professional, para GROOMER autenticado. Organiza las rutas y sus guards con permisos de AuthContext; el backend comprueba nuevamente autorización y ownership.
 */
import { Stack } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
// Función Layout: concentra la lógica dentro de este módulo.
export default function Layout(){const {hasPermission}=useAuth();return <Stack screenOptions={{headerShown:false}}><Stack.Screen name="index"/><Stack.Protected guard={hasPermission('appointments.view_own')||hasPermission('appointments.view_all')}><Stack.Screen name="agenda"/><Stack.Screen name="appointment"/><Stack.Screen name="patients"/><Stack.Screen name="patient"/><Stack.Screen name="services"/></Stack.Protected></Stack>;}
