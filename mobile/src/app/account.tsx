/**
 * ARCHIVO: account.tsx
 * UBICACIÓN: mobile/src/app/account.tsx
 * FUNCIÓN: Adapta la ruta de cuenta y sus parámetros al perfil compartido.
 * RESPONSABILIDAD: Lee `section`, limita el valor a secciones conocidas y entrega ese valor a AccountProfileScreen.
 * CONEXIONES: Importa: mobile/src/components/profile/AccountProfileScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → account.tsx → useLocalSearchParams → AccountProfileScreen → servicios/contexto del perfil.
 * IMPORTANCIA: Evita duplicar implementación del perfil para diferentes rutas de entrada.
 */
import { AccountProfileScreen } from '../components/profile/AccountProfileScreen';
import { useLocalSearchParams } from 'expo-router';

/** Normaliza el parámetro `section` a personal, security, theme o all y delega el perfil compartido. */
export default function AccountScreen() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  const profileSection = section === 'personal' || section === 'security' || section === 'theme' ? section : 'all';
  return <AccountProfileScreen section={profileSection} />;
}
