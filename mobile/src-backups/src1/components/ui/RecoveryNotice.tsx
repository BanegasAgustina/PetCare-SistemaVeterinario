/** Aviso de recuperación futura que reutiliza la base visual global de PetCare. */
import { AppModal } from './AppModal';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
export function RecoveryNotice({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return <AppModal visible={visible} dismissible onClose={onClose}>
    <AppText variant="subtitle">¿Olvidaste tu contraseña?</AppText>
    <AppText muted>La recuperación de contraseña estará disponible próximamente. Por ahora, podés volver a intentar iniciar sesión.</AppText>
    <AppButton label="Volver al inicio de sesión" onPress={onClose} />
  </AppModal>;
}
