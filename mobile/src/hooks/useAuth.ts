/**
 * ARCHIVO: useAuth.ts
 * UBICACIÓN: mobile/src/hooks/useAuth.ts
 * FUNCIÓN: Hook de React para compartir estado o comportamiento.
 * RESPONSABILIDAD: Hook de React para compartir estado o comportamiento dentro de PetCare; agrupa las declaraciones de useAuth.
 * CONEXIONES: Importa: mobile/src/contexts/AuthContext.tsx Se utiliza desde: mobile/src/app/_layout.tsx, mobile/src/app/admin/_layout.tsx, mobile/src/app/admin/index.tsx, mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx y 46 más
 * FUNCIONAMIENTO: Combina estado y ciclo de vida de React con dependencias del dominio y expone datos o acciones.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Acceso tipado al contexto de sesión, sin exponer la contraseña ni el token a las pantallas. */
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
/** Lee AuthContext y falla temprano si el componente se montó fuera de AuthProvider. */
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return auth;
}
