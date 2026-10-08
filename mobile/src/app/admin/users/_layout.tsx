/**
 * Navegador del módulo admin/users, para ADMIN/SUPER_ADMIN con los permisos exigidos. Organiza las rutas; el backend comprueba nuevamente autorización y ownership.
 */
import { Stack } from 'expo-router';
export default function UsersLayout(){return <Stack screenOptions={{headerShown:false}}/>;}
