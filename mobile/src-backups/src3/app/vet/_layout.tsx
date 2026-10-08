/**
 * Navegador del módulo vet, para VETERINARIAN autenticado. Organiza las rutas y sus guards con permisos de AuthContext; el backend comprueba nuevamente autorización y ownership.
 */
import { Stack } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
export default function Layout(){const {hasPermission}=useAuth();return <Stack screenOptions={{headerShown:false}}><Stack.Screen name="index"/><Stack.Protected guard={hasPermission('appointments.view_own')||hasPermission('appointments.view_all')}><Stack.Screen name="agenda"/><Stack.Screen name="appointment"/></Stack.Protected><Stack.Protected guard={hasPermission('pets.view_information')}><Stack.Screen name="patients"/><Stack.Screen name="patient"/></Stack.Protected><Stack.Protected guard={['medical_records.create','vaccines.create','prescriptions.create','recommendations.create'].some(code=>hasPermission(code))}><Stack.Screen name="record"/></Stack.Protected></Stack>;}
