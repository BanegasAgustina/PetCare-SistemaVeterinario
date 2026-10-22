/** Entrada de PetCare: abre Login o la cuenta existente según el AuthContext. */
import { Redirect } from 'expo-router';
import type { ComponentType } from 'react';
import { useAuth } from '../hooks/useAuth';
import { EntryRedirect } from '../components/layout/EntryRedirect';

export default function EntryScreen() {
  const { user } = useAuth();
  return <EntryRedirect user={user} RedirectComponent={Redirect as ComponentType<{href:string}>} />;
}
