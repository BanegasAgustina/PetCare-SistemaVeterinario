/**
 * ARCHIVO: AdminPageHeading.tsx
 * UBICACIÓN: mobile/src/components/admin/AdminPageHeading.tsx
 * FUNCIÓN: Encabezado de página con título y acción para regresar.
 * RESPONSABILIDAD: Dar orientación y navegación de retorno a páginas administrativas.
 * CONEXIONES: Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useBackNavigation.ts, mobile/src/components/layout/BackButton.tsx Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/index.tsx
 * FUNCIONAMIENTO: Usa usuario y política de regreso compartida para mostrar el título y BackButton cuando corresponde.
 * IMPORTANCIA: Evita encabezados distintos entre subpáginas del panel admin.
 */
import { AppText } from '../ui/AppText';
import { useAuth } from '../../hooks/useAuth';
import { useBackNavigation } from '../../hooks/useBackNavigation';
import { BackButton } from '../layout/BackButton';
import { View } from 'react-native';

/** Renderiza título y botón de retorno en el contexto administrativo. */
export function AdminPageHeading({ title }: { title: string }) {
  const { user } = useAuth();
  const { shouldShowBack } = useBackNavigation();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  if (isAdmin) return null;
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
    {shouldShowBack && <BackButton />}
    <AppText variant="title" style={{ flex: 1, minWidth: 0 }}>{title}</AppText>
  </View>;
}
