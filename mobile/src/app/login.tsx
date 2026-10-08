/** Pantalla de acceso: validación local y servicio de sesión; el backend verifica credenciales. */
import { router } from 'expo-router';
import { AuthForm, type AuthField } from '../components/forms/AuthForm';
import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoginLayout } from '../components/layout/LoginLayout';
import { LoginBrand } from '../components/layout/LoginBrand';

import { AppText } from '../components/ui/AppText';
import { SocialLoginButton } from '../components/ui/SocialLoginButton';
import { RecoveryNotice } from '../components/ui/RecoveryNotice';
import { useTheme } from '../hooks/useTheme';
import { FormNotice } from '../components/ui/FormNotice';
import { AppButton } from '../components/ui/AppButton';
import { useAuth } from '../hooks/useAuth';
import { validateLoginForm } from '../utils/auth-validation';
import type { LoginValues } from '../types/auth';
import { useAsyncAction } from '../hooks/useAsyncAction';

const fields: AuthField<LoginValues>[] = [
  { key: 'email', label: 'Correo electrónico', icon: 'mail-outline', inputProps: { keyboardType: 'email-address', autoComplete: 'email', textContentType: 'emailAddress', autoCorrect: false, placeholder: 'ejemplo@email.com', maxLength: 254 } },
  { key: 'password', label: 'Contraseña', icon: 'lock-closed-outline', password: true, inputProps: { autoComplete: 'current-password', textContentType: 'password', autoCorrect: false, placeholder: 'Ingresá tu contraseña' } },
];
export default function LoginScreen() {
  const auth = useAuth();
  const social=useAsyncAction();
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [recoveryVisible, setRecoveryVisible] = useState(false);
  return <LoginLayout>
    <LoginBrand />
    <FormNotice message={auth.notice} />
    {/* Se conservan validación, email de registro, errores/loading y la llamada original al AuthContext. */}
    <AuthForm compact dense={height - insets.top - insets.bottom <= 700} fields={fields} initialValues={{ email: auth.registeredEmail, password: '' }} validate={validateLoginForm} onSubmit={auth.signIn} submitLabel="INICIAR SESIÓN" loadingLabel="Iniciando sesión…"
      secondaryAction={(loading) => <Pressable disabled={loading} accessibilityRole="button" onPress={() => { Keyboard.dismiss(); setRecoveryVisible(true); }} style={styles.recovery}><AppText variant="caption" style={{ color: colors.primary }}>¿Olvidaste tu contraseña?</AppText></Pressable>} />
    {auth.pendingVerification && <AppButton compact label="Verificar ahora" variant="secondary" onPress={() => { Keyboard.dismiss(); auth.openVerification(); }} />}
    <View style={styles.socialSection}>
      <View style={styles.divider}><View style={[styles.line, { backgroundColor: colors.border }]} /><AppText variant="caption" muted>o</AppText><View style={[styles.line, { backgroundColor: colors.border }]} /></View>
      <View style={styles.socialTitle}><AppText variant="caption" muted>Continuar con</AppText></View>
      <FormNotice message={social.error} error />
      <View style={styles.providers}><SocialLoginButton provider="Google" disabled={social.loading} onPress={()=>void social.run(()=>auth.socialSignIn('google'))}/><SocialLoginButton provider="Facebook" disabled={social.loading} onPress={()=>void social.run(()=>auth.socialSignIn('facebook'))}/><SocialLoginButton provider="X" disabled={social.loading} onPress={()=>void social.run(()=>auth.socialSignIn('x'))}/></View>
    </View>
    <Pressable accessibilityRole="link" accessibilityLabel="Registrate" onPress={() => router.push('/register')} style={styles.registerLink}>
      <AppText variant="caption" muted style={{ textAlign: 'center' }}>¿Todavía no tenés cuenta? <AppText variant="caption" style={[styles.registerText, { color: colors.primary }]}>Registrate</AppText></AppText>
    </Pressable>

    <RecoveryNotice visible={recoveryVisible} onClose={() => setRecoveryVisible(false)} />
  </LoginLayout>;
}
const styles = StyleSheet.create({
  recovery: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', marginTop: -12 },
  socialSection: { gap: 4 }, divider: { flexDirection: 'row', alignItems: 'center', gap: 14 }, line: { flex: 1, height: 1 },
  socialTitle: { alignItems: 'center' }, providers: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  registerLink: { minHeight: 44, justifyContent: 'center' }, registerText: { fontWeight: '700' },
});


