/** Confirmación reutilizable; las acciones destructivas deben pasar por este patrón visual. */
import { AppModal } from './AppModal';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { FormNotice } from './FormNotice';
import { useAsyncAction } from '../../hooks/useAsyncAction';

type ConfirmModalProps = { visible: boolean; title: string; message: string; confirmLabel?: string; destructive?: boolean; onCancel: () => void; onConfirm: () => Promise<void> };
export function ConfirmModal({ visible, title, message, confirmLabel = 'Confirmar', destructive = false, onCancel, onConfirm }: ConfirmModalProps) {
  const action = useAsyncAction();
  return <AppModal visible={visible} dismissible={!action.loading} onClose={onCancel}>
    <AppText variant="subtitle" accessibilityRole="header">{title}</AppText>
    <AppText muted>{message}</AppText>
    <FormNotice message={action.error} error />
    <AppButton label={action.loading ? 'Procesando…' : confirmLabel} loading={action.loading} destructive={destructive} onPress={() => void action.run(onConfirm)} />
    <AppButton label="Cancelar" variant="secondary" disabled={action.loading} onPress={onCancel} />
  </AppModal>;
}
