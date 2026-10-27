/** Confirmación reutilizable; las acciones destructivas deben pasar por este patrón visual. */
import { AppModal } from './AppModal';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { FormNotice } from './FormNotice';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { isWebAtLeast, responsiveLayout } from '../../constants/responsive';

type ConfirmModalProps = { visible: boolean; title: string; message: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean; onCancel: () => void; onConfirm: () => Promise<void> };
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

const styles=StyleSheet.create({actions:{gap:9},desktopActions:{flexDirection:'row',justifyContent:'flex-end',flexWrap:'wrap',gap:10,paddingTop:4}});
