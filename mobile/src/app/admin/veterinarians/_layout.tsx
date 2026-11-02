/**
 * ARCHIVO: _layout.tsx
 * UBICACIÓN: mobile/src/app/admin/veterinarians/_layout.tsx
 * FUNCIÓN: Layout del grupo de rutas de veterinarios administrados.
 * RESPONSABILIDAD: Registra listado, detalle y especialidades en un Stack interno sin encabezado.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router aplica el Stack dentro del grupo admin/veterinarians y el padre controla acceso.
 * IMPORTANCIA: Agrupa rutas relacionadas y conserva navegación consistente.
 */
/**
 * Navegador del módulo admin/veterinarians, para ADMIN/SUPER_ADMIN con los permisos exigidos. Organiza las rutas y sus guards con permisos de AuthContext; el backend comprueba nuevamente autorización y ownership.
 */
import { Stack } from 'expo-router';
/** Registra en el Stack las rutas de lista, detalle y especialidades veterinarias. */
export default function VeterinariansLayout() {return <Stack screenOptions={{headerShown:false}}><Stack.Screen name="index"/><Stack.Screen name="[id]"/><Stack.Screen name="specialties"/></Stack>; }
