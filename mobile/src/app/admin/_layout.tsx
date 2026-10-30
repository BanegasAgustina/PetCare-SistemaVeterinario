// Navegador común para ADMIN y SUPER_ADMIN. La API vuelve a autorizar cada operación.
import { Stack, usePathname, router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { canAccessAdminPath } from '../../utils/admin-route-access';
import { PetCareScreen } from '../../components/client/PetCareUI';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';

export default function AdminLayout() {
  const { hasPermission } = useAuth();
  const pathname = usePathname();

  if (!canAccessAdminPath(pathname, hasPermission)) {
    return <PetCareScreen>
      <AppText variant="title">Acceso restringido</AppText>
      <AppText muted>No tenés los permisos necesarios para abrir esta sección.</AppText>
      <AppButton label="Volver al inicio" onPress={() => router.replace('/admin')} />
    </PetCareScreen>;
  }

  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="index" />
    <Stack.Screen name="clinic" />
    <Stack.Screen name="store" />
    <Stack.Screen name="administration" />
    <Stack.Screen name="patients" />
    <Stack.Screen name="patient" />
    <Stack.Screen name="professionals" />
    <Stack.Screen name="agenda" />
    <Stack.Screen name="appointment" />
    <Stack.Screen name="availability" />
    <Stack.Screen name="catalog/[kind]" />
    <Stack.Screen name="store-settings" />
    <Stack.Screen name="store-orders" />
    <Stack.Screen name="store-banners" />
    <Stack.Screen name="veterinarians" />
    <Stack.Screen name="users" />
    <Stack.Screen name="clients" />
    <Stack.Screen name="client" />
    <Stack.Screen name="roles" />
    <Stack.Screen name="permissions" />
    <Stack.Screen name="specialties" />
    <Stack.Screen name="products" />
    <Stack.Screen name="general-information" />
  </Stack>;
}
