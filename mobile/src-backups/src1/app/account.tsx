/** Vista mínima autenticada para comprobar /me y cerrar sesión; sin funciones de futuras fases. */
import { StyleSheet, View } from 'react-native';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { AppText } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { FormNotice } from '../components/ui/FormNotice';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useAsyncAction } from '../hooks/useAsyncAction';

const roleLabels = { CLIENT: 'Cliente', VETERINARIAN: 'Veterinario', ADMIN: 'Administrador' };
export default function AccountScreen() {
  const auth = useAuth();
  const { colors, mode, setPreference } = useTheme();
  const action = useAsyncAction();
  if (!auth.user) return null;
  return <ScreenContainer>
    <AppText variant="caption" muted>PETCARE · TU CUENTA</AppText>
    <AppText variant="title">Hola, {auth.user.firstName}</AppText>
    <AppText muted>Tu sesión está activa. Estos son los datos de tu cuenta.</AppText>
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText variant="subtitle">{auth.user.firstName} {auth.user.lastName}</AppText>
      <AppText>{auth.user.email}</AppText>
      <AppText muted>{auth.user.phone ?? 'Sin teléfono registrado'}</AppText>
      <AppText variant="caption">{roleLabels[auth.user.role]}</AppText>
    </View>
    <FormNotice message={action.error} error />
    <AppButton label={action.loading ? 'Procesando…' : 'Volver a consultar mis datos'} loading={action.loading} onPress={() => void action.run(auth.refreshProfile)} />
    <AppButton label="Cerrar sesión" variant="secondary" disabled={action.loading} onPress={() => void action.run(auth.signOut)} />
    <AppButton label={mode === 'dark' ? 'Usar modo claro' : 'Usar modo oscuro'} variant="secondary" onPress={() => setPreference(mode === 'dark' ? 'light' : 'dark')} />
  </ScreenContainer>;
}
const styles = StyleSheet.create({ card: { padding: 20, borderWidth: 1, borderRadius: 24, gap: 12 } });
