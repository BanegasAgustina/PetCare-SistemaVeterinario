// Este archivo se encarga de lo siguiente: Pantalla de entrada o autenticación de la aplicación móvil; guía el acceso y la navegación inicial.

/** Pantalla de acceso: validación local y servicio de sesión; el backend verifica credenciales. */
import { router } from 'expo-router';
import { AuthForm, type AuthField } from '../components/forms/AuthForm';
import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet } from 'react-native';
import { LoginLayout } from '../components/layout/LoginLayout';
import { LoginBrand } from '../components/layout/LoginBrand';

import { AppText } from '../components/ui/AppText';
import { OAuthSignInOptions } from '../components/ui/OAuthSignInOptions';
import { RecoveryNotice } from '../components/ui/RecoveryNotice';
import { useTheme } from '../hooks/useTheme';
import { FormNotice } from '../components/ui/FormNotice';
import { AppButton } from '../components/ui/AppButton';
import { useAuth } from '../hooks/useAuth';
import { validateLoginForm } from '../utils/auth-validation';
import type { LoginValues } from '../types/auth';
import { ApiError } from '../services/api';

// Configuración fields: reúne valores o reglas que consume el resto del módulo.
const fields: AuthField<LoginValues>[] = [
  { key: 'email', label: 'Correo electrónico', icon: 'mail-outline', inputProps: { keyboardType: 'email-address', autoComplete: 'email', textContentType: 'emailAddress', autoCorrect: false, placeholder: 'ejemplo@email.com', maxLength: 254 } },
  { key: 'password', label: 'Contraseña', password: true, inputProps: { autoComplete: 'current-password', textContentType: 'password', autoCorrect: false, placeholder: 'Ingresá tu contraseña' } },
];
// Función LoginScreen: concentra la lógica dentro de este módulo.
export default function LoginScreen() {
  const auth = useAuth();
  const { colors } = useTheme();
  const [recoveryVisible, setRecoveryVisible] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  // Función submitLogin: concentra la lógica dentro de este módulo.
async function submitLogin(values:LoginValues){try{await auth.signIn(values);}catch(error){if(error instanceof ApiError&&error.code==='PASSWORD_CHANGE_REQUIRED'){router.push({pathname:'/change-initial-password',params:{email:values.email}});return;}throw error;}}
  return <LoginLayout showDesktopImage petArtwork="login">
    <LoginBrand />
    <FormNotice message={auth.restoreError ?? auth.notice} error={Boolean(auth.restoreError)} />
    {auth.restoreError && <AppButton compact variant="secondary" label="Reintentar conexión" onPress={() => void auth.restoreSession()} />}
    {/* Se conservan validación, email de registro, errores/loading y la llamada original al AuthContext. */}
    <AuthForm compact disabled={socialLoading} fields={fields} initialValues={{ email: auth.registeredEmail, password: '' }} validate={validateLoginForm} onSubmit={submitLogin} submitLabel="INICIAR SESIÓN" loadingLabel="Iniciando sesión…"
      secondaryAction={(loading) => <Pressable disabled={loading} accessibilityRole="button" onPress={() => { Keyboard.dismiss(); setRecoveryVisible(true); }} style={styles.recovery}><AppText variant="caption" style={{ color: colors.primary }}>¿Olvidaste tu contraseña?</AppText></Pressable>} />
    {auth.pendingVerification && <AppButton compact label="Verificar ahora" variant="secondary" onPress={() => { Keyboard.dismiss(); auth.openVerification(); }} />}
    <OAuthSignInOptions onLoadingChange={setSocialLoading} />
    <Pressable accessibilityRole="link" accessibilityLabel="Registrate" onPress={() => router.push('/register')} style={styles.registerLink}>
      <AppText variant="caption" muted style={{ textAlign: 'center' }}>¿Todavía no tenés cuenta? <AppText variant="caption" style={[styles.registerText, { color: colors.primary }]}>Registrate</AppText></AppText>
    </Pressable>

    <RecoveryNotice visible={recoveryVisible} onClose={() => setRecoveryVisible(false)} />
  </LoginLayout>;
}
// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({
  recovery: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', marginTop: -12 },
  registerLink: { minHeight: 44, justifyContent: 'center' }, registerText: { fontWeight: '700' },
});


