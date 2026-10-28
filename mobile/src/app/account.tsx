// Este archivo se encarga de lo siguiente: Pantalla de entrada o autenticación de la aplicación móvil; guía el acceso y la navegación inicial.

import { AccountProfileScreen } from '../components/profile/AccountProfileScreen';
import { useLocalSearchParams } from 'expo-router';

// Función AccountScreen: concentra la lógica dentro de este módulo.
export default function AccountScreen() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  const profileSection = section === 'personal' || section === 'security' || section === 'theme' ? section : 'all';
  return <AccountProfileScreen section={profileSection} />;
}
