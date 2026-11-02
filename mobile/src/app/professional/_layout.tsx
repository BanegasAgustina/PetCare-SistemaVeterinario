/**
 * ARCHIVO: _layout.tsx
 * UBICACIÓN: mobile/src/app/professional/_layout.tsx
 * FUNCIÓN: Layout del espacio GROOMER/profesional.
 * RESPONSABILIDAD: Lee permisos para proteger agenda, turnos, pacientes y servicios disponibles en el Stack.
 * CONEXIONES: Importa: mobile/src/hooks/useAuth.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: AuthContext → hasPermission → Stack.Protected; el backend vuelve a comprobar actor y alcance.
 * IMPORTANCIA: Adecua navegación a capacidades vigentes sin convertir la UI en control de seguridad final.
 */
/**
 * Navegador del módulo professional, para GROOMER autenticado. Organiza las rutas y sus guards con permisos de AuthContext; el backend comprueba nuevamente autorización y ownership.
 */
import { Stack } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
/** Protege agenda, turnos, pacientes y servicios según permisos de cita del profesional. */
export default function Layout(){const {hasPermission}=useAuth();return <Stack screenOptions={{headerShown:false}}><Stack.Screen name="index"/><Stack.Protected guard={hasPermission('appointments.view_own')||hasPermission('appointments.view_all')}><Stack.Screen name="agenda"/><Stack.Screen name="appointment"/><Stack.Screen name="patients"/><Stack.Screen name="patient"/><Stack.Screen name="services"/></Stack.Protected></Stack>;}
