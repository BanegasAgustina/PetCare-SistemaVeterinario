// Este archivo se encarga de lo siguiente: Hook reutilizable de React; concentra estado o comportamiento que pueden compartir varias pantallas.

/** Acceso tipado al contexto de sesión, sin exponer la contraseña ni el token a las pantallas. */
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
// Función useAuth: concentra la lógica dentro de este módulo.
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return auth;
}
