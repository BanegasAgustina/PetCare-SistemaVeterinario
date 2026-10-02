/** Entrada de PetCare: abre Login o la cuenta existente según el AuthContext. */
import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export default function EntryScreen() {
  const { user } = useAuth();
  return <Redirect href={user ? '/account' : '/login'} />;
}
