// Este archivo se encarga de lo siguiente: Pantalla de entrada o autenticación de la aplicación móvil; guía el acceso y la navegación inicial.

/** Entrada de PetCare: abre Login o la cuenta existente según el AuthContext. */
import { Redirect } from 'expo-router';
import type { ComponentType } from 'react';
import { useAuth } from '../hooks/useAuth';
import { EntryRedirect } from '../components/layout/EntryRedirect';

// Función EntryScreen: concentra la lógica dentro de este módulo.
export default function EntryScreen() {
  const { user } = useAuth();
  return <EntryRedirect user={user} RedirectComponent={Redirect as ComponentType<{href:string}>} />;
}
