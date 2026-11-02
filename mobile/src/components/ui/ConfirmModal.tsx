/**
 * ARCHIVO: ConfirmModal.tsx
 * UBICACIÓN: mobile/src/components/ui/ConfirmModal.tsx
 * FUNCIÓN: Diálogo de confirmación con acción asincrónica, cancelación y presentación destructiva opcional.
 * RESPONSABILIDAD: Pedir confirmación explícita antes de operaciones sensibles y mostrar su estado de ejecución.
 * CONEXIONES: Importa: mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/hooks/useAsyncAction.ts, mobile/src/constants/responsive.ts Se utiliza desde: mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx y 10 más
 * FUNCIONAMIENTO: Compone AppModal, botones, avisos y useAsyncAction; ejecuta onConfirm y gestiona carga/errores del callback.
 * IMPORTANCIA: Unifica confirmaciones de borrado, desactivación y otras acciones con consecuencias.
 */
/** Confirmación reutilizable; las acciones destructivas deben pasar por este patrón visual. */
import { AppModal } from './AppModal';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { FormNotice } from './FormNotice';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { isWebAtLeast, responsiveLayout } from '../../constants/responsive';

// Tipo ConfirmModalProps: define la forma o las opciones válidas de los datos usados por este módulo.
type ConfirmModalProps = { visible: boolean; title: string; message: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean; onCancel: () => void; onConfirm: () => Promise<void> };
/** Presenta confirmación y delega ejecución y errores asíncronos al hook compartido. */
export function ConfirmModal({ visible, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', destructive = false, onCancel, onConfirm }: ConfirmModalProps) {
  const action = useAsyncAction();
  const { width } = useWindowDimensions();
  const desktop = isWebAtLeast(Platform.OS,width,responsiveLayout.breakpoints.desktop);
  return <AppModal visible={visible} dismissible={!action.loading} onClose={onCancel}>
    <AppText variant="subtitle" accessibilityRole="header">{title}</AppText>
    <AppText muted>{message}</AppText>
    <FormNotice message={action.error} error />
    <View style={[styles.actions,desktop&&styles.desktopActions]}>
      <AppButton compact={desktop} label={action.loading ? 'Procesando…' : confirmLabel} loading={action.loading} destructive={destructive} onPress={() => void action.run(onConfirm)} />
      <AppButton compact={desktop} label={cancelLabel} variant="secondary" disabled={action.loading} onPress={onCancel} />
    </View>
  </AppModal>;
}

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles=StyleSheet.create({actions:{gap:9},desktopActions:{flexDirection:'row',justifyContent:'flex-end',flexWrap:'wrap',gap:10,paddingTop:4}});
