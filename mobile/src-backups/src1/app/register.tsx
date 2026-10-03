/** Registro conserva la ruta de fondo: el AuthContext abre el modal después de crear la cuenta. */
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { AuthForm, type AuthField } from '../components/forms/AuthForm';
import { LoginBrand } from '../components/layout/LoginBrand';

import { LoginLayout } from '../components/layout/LoginLayout';
import { AppText } from '../components/ui/AppText';

import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { registrationPayload, validateRegistrationForm } from '../utils/auth-validation';
import type { RegistrationFormValues } from '../types/auth';

const fields: AuthField<RegistrationFormValues>[] = [
  { key: 'fullName', label: 'Nombre completo', inputProps: { autoCapitalize: 'words', autoComplete: 'name', textContentType: 'name', maxLength: 201 } },
  { key: 'email', label: 'Correo electrónico', inputProps: { keyboardType: 'email-address', autoComplete: 'email', textContentType: 'emailAddress', autoCorrect: false, maxLength: 254, placeholder: 'nombre@ejemplo.com' } },
  { key: 'phone', label: 'Teléfono (opcional)', inputProps: { keyboardType: 'phone-pad', autoComplete: 'tel', textContentType: 'telephoneNumber', maxLength: 40, placeholder: '+54 9 11 1234-5678' } },
  { key: 'password', label: 'Contraseña', password: true, hint: '8 caracteres, mayúscula, minúscula, número y símbolo.', inputProps: { autoComplete: 'new-password', textContentType: 'newPassword', autoCorrect: false } },
  { key: 'confirmPassword', label: 'Repetir contraseña', password: true, inputProps: { autoComplete: 'new-password', textContentType: 'newPassword', autoCorrect: false } },
];
export default function RegisterScreen() {
  const auth = useAuth(); const { colors } = useTheme();
  return <LoginLayout scrollable>
    <LoginBrand title="Creá tu cuenta" subtitle="Cuidamos a quienes más querés" />
    <AuthForm compact dense fields={fields} initialValues={{ fullName: '', email: '', phone: '', password: '', confirmPassword: '' }} validate={validateRegistrationForm}
      onSubmit={async values => { await auth.register(registrationPayload(values)); }} submitLabel="CREAR CUENTA" loadingLabel="Creando tu cuenta…" />
    <Pressable accessibilityRole="link" onPress={() => router.replace('/login')} style={styles.link}><AppText variant="caption" style={{ color: colors.primary, textAlign: 'center' }}>¿Ya tenés cuenta? Iniciar sesión</AppText></Pressable>

  </LoginLayout>;
}
const styles = StyleSheet.create({ link: { minHeight: 44, justifyContent: 'center' } });
