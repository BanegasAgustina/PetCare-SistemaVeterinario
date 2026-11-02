/**
 * ARCHIVO: _layout.tsx
 * UBICACIÓN: mobile/src/app/vet/_layout.tsx
 * FUNCIÓN: Layout del espacio veterinario con guards por capacidad.
 * RESPONSABILIDAD: Consulta permisos para mostrar perfil, productos, agenda, pacientes, clientes y registros clínicos según el alcance del usuario.
 * CONEXIONES: Importa: mobile/src/hooks/useAuth.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: AuthContext/useAuth → Stack.Protected → rutas vet; API/middleware verifican acceso real.
 * IMPORTANCIA: Organiza navegación clínica y adapta destinos a permisos y scope del actor.
 */
/**
 * Navegador del módulo vet, para VETERINARIAN autenticado. Organiza las rutas y sus guards con permisos de AuthContext; el backend comprueba nuevamente autorización y ownership.
 */
import { Stack } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
/** Protege rutas vet según permisos de productos, agenda y scope de pacientes. */
export default function Layout(){const {hasPermission}=useAuth();const patientScope=hasPermission('pets.view_all')||hasPermission('pets.view_assigned');const canReadPatients=hasPermission('pets.view_information')&&patientScope;return <Stack screenOptions={{headerShown:false}}><Stack.Screen name="index"/><Stack.Screen name="profile"/><Stack.Protected guard={hasPermission('products.view')||hasPermission('prescriptions.create')}><Stack.Screen name="products"/></Stack.Protected><Stack.Protected guard={hasPermission('appointments.view_own')||hasPermission('appointments.view_all')}><Stack.Screen name="agenda"/><Stack.Screen name="appointment"/></Stack.Protected><Stack.Protected guard={canReadPatients}><Stack.Screen name="patients"/><Stack.Screen name="patient"/><Stack.Screen name="clients"/><Stack.Screen name="client"/></Stack.Protected><Stack.Protected guard={patientScope&&['medical_records.create','vaccines.create','prescriptions.create','recommendations.create'].some(code=>hasPermission(code))}><Stack.Screen name="record"/></Stack.Protected></Stack>;}
