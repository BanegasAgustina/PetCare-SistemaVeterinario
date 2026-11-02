/**
 * ARCHIVO: index.tsx
 * UBICACIÓN: mobile/src/app/index.tsx
 * PROPÓSITO: Entrada raíz de navegación.
 * RESPONSABILIDAD: Obtiene usuario de AuthContext y entrega usuario y Redirect al resolutor de entrada.
 * RELACIONES: Expo Router abre esta ruta raíz; useAuth obtiene la sesión y EntryRedirect decide el destino con el componente Redirect de Expo Router.
 * FLUJO: Expo Router → useAuth → EntryRedirect → login o pantalla inicial del rol.
 * IMPORTANCIA: Centraliza el primer destino sin duplicar decisión en la ruta.
 */

/** Entrada de PetCare: abre Login o la cuenta existente según el AuthContext. */
import { Redirect } from 'expo-router';
import type { ComponentType } from 'react';
import { useAuth } from '../hooks/useAuth';
import { EntryRedirect } from '../components/layout/EntryRedirect';

/** Obtiene el usuario de sesión y lo entrega al resolvedor de navegación inicial. */
export default function EntryScreen() {
  const { user } = useAuth();
  return <EntryRedirect user={user} RedirectComponent={Redirect as ComponentType<{href:string}>} />;
}
