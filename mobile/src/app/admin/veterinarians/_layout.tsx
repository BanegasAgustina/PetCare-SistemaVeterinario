// Este archivo se encarga de lo siguiente: Pantalla o navegación del área administrativa; conecta la interfaz con las operaciones de administración.

/**
 * Navegador del módulo admin/veterinarians, para ADMIN/SUPER_ADMIN con los permisos exigidos. Organiza las rutas y sus guards con permisos de AuthContext; el backend comprueba nuevamente autorización y ownership.
 */
import { Stack } from 'expo-router';
// Función VeterinariansLayout: concentra la lógica dentro de este módulo.
export default function VeterinariansLayout() {return <Stack screenOptions={{headerShown:false}}><Stack.Screen name="index"/><Stack.Screen name="[id]"/><Stack.Screen name="specialties"/></Stack>; }
