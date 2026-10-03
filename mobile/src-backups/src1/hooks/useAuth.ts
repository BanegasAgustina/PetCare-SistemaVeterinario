/** Acceso tipado al contexto de sesión, sin exponer la contraseña ni el token a las pantallas. */
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return auth;
}
