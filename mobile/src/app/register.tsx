/**
 * ARCHIVO: register.tsx
 * UBICACIÓN: mobile/src/app/register.tsx
 * FUNCIÓN: Pantalla de registro de cliente por email y contraseña, con entradas OAuth disponibles.
 * RESPONSABILIDAD: Valida campos localmente, construye payload y delega creación al AuthContext; la verificación de email se completa después.
 * CONEXIONES: Importa: mobile/src/components/forms/AuthForm.tsx, mobile/src/components/layout/LoginBrand.tsx, mobile/src/components/layout/LoginPets.tsx, mobile/src/components/layout/LoginLayout.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/OAuthSignInOptions.tsx, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useTheme.ts y 2 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Ruta register → AuthForm y auth-validation → AuthContext/auth service → backend verification.
 * IMPORTANCIA: Presenta registro al cliente sin sustituir validación, persistencia ni verificación del servidor.
 */
/** Registro conserva la ruta de fondo: el AuthContext abre el modal después de crear la cuenta. */
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { AuthForm, type AuthField } from '../components/forms/AuthForm';
import { LoginBrand } from '../components/layout/LoginBrand';
import { LoginPets } from '../components/layout/LoginPets';

import { LoginLayout } from '../components/layout/LoginLayout';
import { AppText } from '../components/ui/AppText';
import { OAuthSignInOptions } from '../components/ui/OAuthSignInOptions';

import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { registrationPayload, validateRegistrationForm } from '../utils/auth-validation';
import type { RegistrationFormValues } from '../types/auth';

// Configuración fields: reúne valores o reglas que consume el resto del módulo.
const fields: AuthField<RegistrationFormValues>[] = [
  { key: 'fullName', label: 'Nombre completo', inputProps: { autoCapitalize: 'words', autoComplete: 'name', textContentType: 'name', maxLength: 201 } },
  { key: 'email', label: 'Correo electrónico', icon: 'mail-outline', inputProps: { keyboardType: 'email-address', autoComplete: 'email', textContentType: 'emailAddress', autoCorrect: false, maxLength: 254, placeholder: 'nombre@ejemplo.com' } },
  { key: 'phone', label: 'Teléfono (opcional)', icon: 'call-outline', inputProps: { keyboardType: 'phone-pad', autoComplete: 'tel', textContentType: 'telephoneNumber', maxLength: 40, placeholder: '+54 9 11 1234-5678' } },
  { key: 'password', label: 'Contraseña', password: true, hint: '8 caracteres, mayúscula, minúscula, número y símbolo.', inputProps: { autoComplete: 'new-password', textContentType: 'newPassword', autoCorrect: false } },
  { key: 'confirmPassword', label: 'Repetir contraseña', password: true, inputProps: { autoComplete: 'new-password', textContentType: 'newPassword', autoCorrect: false } },
];
/** Conecta validación local, registro de AuthContext y apertura del paso de verificación. */
export default function RegisterScreen() {
  const auth = useAuth(); const { colors } = useTheme();
  const [socialLoading, setSocialLoading] = useState(false);
  return <LoginLayout scrollable disableScrollWhenFits compactContent showDesktopImage petArtwork="none">
    <LoginBrand title="Creá tu cuenta" subtitle="Cuidamos a quienes más querés" compactLayout />
    <AuthForm compact dense centerSubmitButton disabled={socialLoading} fields={fields} initialValues={{ fullName: '', email: '', phone: '', password: '', confirmPassword: '' }} validate={validateRegistrationForm}
      onSubmit={async values => { await auth.register(registrationPayload(values)); }} submitLabel="CREAR CUENTA" loadingLabel="Creando tu cuenta…" />
    <OAuthSignInOptions onLoadingChange={setSocialLoading} />
    <Pressable accessibilityRole="link" onPress={() => router.replace('/login')} style={styles.link}><AppText variant="caption" style={{ color: colors.primary, textAlign: 'center' }}>¿Ya tenés cuenta? Iniciar sesión</AppText></Pressable>
    <LoginPets registration inline mobileOnly />

  </LoginLayout>;
}
// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({ link: { minHeight: 44, justifyContent: 'center' } });
