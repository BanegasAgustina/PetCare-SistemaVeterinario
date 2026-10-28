// Este archivo se encarga de lo siguiente: Pantalla o navegación del área administrativa; conecta la interfaz con las operaciones de administración.

/**
 * Navegador del módulo admin/users, para ADMIN/SUPER_ADMIN con los permisos exigidos. Organiza las rutas; el backend comprueba nuevamente autorización y ownership.
 */
import { Stack } from 'expo-router';
// Función UsersLayout: concentra la lógica dentro de este módulo.
export default function UsersLayout(){return <Stack screenOptions={{headerShown:false}}/>;}
