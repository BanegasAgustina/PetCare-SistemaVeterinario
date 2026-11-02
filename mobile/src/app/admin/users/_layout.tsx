/**
 * ARCHIVO: _layout.tsx
 * UBICACIÓN: mobile/src/app/admin/users/_layout.tsx
 * FUNCIÓN: Layout del grupo de rutas de usuarios administrados.
 * RESPONSABILIDAD: Declara un Stack sin encabezados para detalle/listado de cuentas; el guard de rol/permisos se mantiene en el layout padre.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router aplica este Stack dentro de admin/users.
 * IMPORTANCIA: Permite navegar listado y detalle sin duplicar estructura visual.
 */
/**
 * Navegador del módulo admin/users, para ADMIN/SUPER_ADMIN con los permisos exigidos. Organiza las rutas; el backend comprueba nuevamente autorización y ownership.
 */
import { Stack } from 'expo-router';
/** Crea el Stack interno de listado/detalle de usuarios sin encabezados duplicados. */
export default function UsersLayout(){return <Stack screenOptions={{headerShown:false}}/>;}
