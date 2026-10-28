// Este archivo se encarga de lo siguiente: Pantalla de entrada o autenticación de la aplicación móvil; guía el acceso y la navegación inicial.

/** Pantalla de acceso: validación local y servicio de sesión; el backend verifica credenciales. */
import { router } from 'expo-router';
import { AuthForm, type AuthField } from '../components/forms/AuthForm';
import { useState } from 'react';
import { ActivityIndicator,Keyboard,Platform, Pressable, StyleSheet, View } from 'react-native';
import { isRunningInExpoGo } from 'expo';
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
import { ApiError } from '../services/api';
import type { OAuthProvider } from '../services/oauth.service';

// Configuración fields: reúne valores o reglas que consume el resto del módulo.
const fields: AuthField<LoginValues>[] = [
  { key: 'email', label: 'Correo electrónico', icon: 'mail-outline', inputProps: { keyboardType: 'email-address', autoComplete: 'email', textContentType: 'emailAddress', autoCorrect: false, placeholder: 'ejemplo@email.com', maxLength: 254 } },
  { key: 'password', label: 'Contraseña', password: true, inputProps: { autoComplete: 'current-password', textContentType: 'password', autoCorrect: false, placeholder: 'Ingresá tu contraseña' } },
];
// Función LoginScreen: concentra la lógica dentro de este módulo.
export default function LoginScreen() {
  const auth = useAuth();
  const social=useAsyncAction();
  const { colors } = useTheme();
  const [recoveryVisible, setRecoveryVisible] = useState(false);
  const [activeProvider,setActiveProvider]=useState<string|null>(null);
  const oauthNeedsDevelopmentBuild=Platform.OS!=='web'&&isRunningInExpoGo();
  // Función startSocial: agrupa una operación que este módulo puede ejecutar o reutilizar.
const startSocial=async(provider:OAuthProvider)=>{setActiveProvider(provider==='x'?'X':provider==='google'?'Google':'Facebook');try{await social.run(()=>auth.socialSignIn(provider));}finally{setActiveProvider(null);}};
  // Función submitLogin: concentra la lógica dentro de este módulo.
async function submitLogin(values:LoginValues){try{await auth.signIn(values);}catch(error){if(error instanceof ApiError&&error.code==='PASSWORD_CHANGE_REQUIRED'){router.push({pathname:'/change-initial-password',params:{email:values.email}});return;}throw error;}}
  return <LoginLayout showDesktopImage petArtwork="login">
    <LoginBrand />
    <FormNotice message={auth.restoreError ?? auth.notice} error={Boolean(auth.restoreError)} />
    {auth.restoreError && <AppButton compact variant="secondary" label="Reintentar conexión" onPress={() => void auth.restoreSession()} />}
    {/* Se conservan validación, email de registro, errores/loading y la llamada original al AuthContext. */}
    <AuthForm compact disabled={social.loading} fields={fields} initialValues={{ email: auth.registeredEmail, password: '' }} validate={validateLoginForm} onSubmit={submitLogin} submitLabel="INICIAR SESIÓN" loadingLabel="Iniciando sesión…"
      secondaryAction={(loading) => <Pressable disabled={loading} accessibilityRole="button" onPress={() => { Keyboard.dismiss(); setRecoveryVisible(true); }} style={styles.recovery}><AppText variant="caption" style={{ color: colors.primary }}>¿Olvidaste tu contraseña?</AppText></Pressable>} />
    {auth.pendingVerification && <AppButton compact label="Verificar ahora" variant="secondary" onPress={() => { Keyboard.dismiss(); auth.openVerification(); }} />}
    <View style={styles.socialSection}>
      <View style={styles.divider}><View style={[styles.line, { backgroundColor: colors.border }]} /><AppText variant="caption" muted>o</AppText><View style={[styles.line, { backgroundColor: colors.border }]} /></View>
      <View style={styles.socialTitle}><AppText variant="caption" muted>Continuar con</AppText></View>
      <FormNotice message={social.error} error />
      {oauthNeedsDevelopmentBuild&&<FormNotice message="Los retornos seguros petcare://oauth no funcionan dentro de Expo Go. Instalá la development build de PetCare para usar Google, Facebook o X."/>}
      {social.loading&&<View style={[styles.oauthProgress,{borderColor:colors.border,backgroundColor:colors.surface}]} accessibilityRole="progressbar" accessibilityLabel={`Conectando con ${activeProvider??'el proveedor'}`}><ActivityIndicator size="small" color={colors.primary}/><View style={styles.oauthProgressText}><AppText>Conectando con {activeProvider??'el proveedor'}…</AppText><AppText variant="caption" muted>Podés volver con Atrás para cancelar la autorización.</AppText></View></View>}
      <View style={styles.providers}><SocialLoginButton provider="Google" disabled={social.loading} onPress={()=>void startSocial('google')}/><SocialLoginButton provider="Facebook" disabled={social.loading} onPress={()=>void startSocial('facebook')}/><SocialLoginButton provider="X" disabled={social.loading} onPress={()=>void startSocial('x')}/></View>
    </View>
    <Pressable accessibilityRole="link" accessibilityLabel="Registrate" onPress={() => router.push('/register')} style={styles.registerLink}>
      <AppText variant="caption" muted style={{ textAlign: 'center' }}>¿Todavía no tenés cuenta? <AppText variant="caption" style={[styles.registerText, { color: colors.primary }]}>Registrate</AppText></AppText>
    </Pressable>

    <RecoveryNotice visible={recoveryVisible} onClose={() => setRecoveryVisible(false)} />
  </LoginLayout>;
}
// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({
  recovery: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', marginTop: -12 },
  socialSection: { gap: 4 }, divider: { flexDirection: 'row', alignItems: 'center', gap: 14 }, line: { flex: 1, height: 1 },
  socialTitle: { alignItems: 'center' }, providers: { flexDirection: 'row', justifyContent: 'center', gap: 20 },oauthProgress:{width:'100%',padding:12,borderRadius:14,borderWidth:1,flexDirection:'row',alignItems:'center',gap:10},oauthProgressText:{flex:1,minWidth:0,gap:2},
  registerLink: { minHeight: 44, justifyContent: 'center' }, registerText: { fontWeight: '700' },
});


