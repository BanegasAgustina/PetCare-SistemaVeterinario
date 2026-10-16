/** Raíz de Expo Router: ofrece tema y áreas seguras a todas las pantallas. */
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useTheme } from '../hooks/useTheme';
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { FeedbackProvider } from '../contexts/FeedbackContext';
import { VerificationCodeModal } from '../components/ui/VerificationCodeModal';
import { OAuthRegistrationModal } from '../components/forms/OAuthRegistrationModal';
import { GlobalNavigation } from '../components/layout/GlobalNavigation';

function ThemedNavigation() {
  const { mode, colors } = useTheme();
  const auth = useAuth();
  const content = <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Screen name="index" />
    <Stack.Screen name="activate-vet" />
    <Stack.Screen name="activate-account" />
    <Stack.Screen name="oauth" />
    <Stack.Protected guard={!auth.user}><Stack.Screen name="login" /><Stack.Screen name="register" /></Stack.Protected>
    <Stack.Screen name="reset-password" />
    <Stack.Screen name="change-initial-password" />
    <Stack.Protected guard={Boolean(auth.user)&&auth.user?.role!=='CLIENT'}><Stack.Screen name="account" /></Stack.Protected>
    <Stack.Protected guard={auth.user?.role==='CLIENT'}><Stack.Screen name="client" /></Stack.Protected>
    <Stack.Protected guard={auth.user?.role==='VETERINARIAN'}><Stack.Screen name="vet" /></Stack.Protected>
    <Stack.Protected guard={auth.user?.role==='GROOMER'}><Stack.Screen name="professional" /></Stack.Protected>
    <Stack.Protected guard={auth.user?.role==='SECRETARY'}><Stack.Screen name="secretary" /></Stack.Protected>
    <Stack.Protected guard={auth.user?.role==='SUPER_ADMIN' || auth.user?.role==='ADMIN'}><Stack.Screen name="admin" /></Stack.Protected>
  </Stack>;
  return <><StatusBar style={mode === 'dark' ? 'light' : 'dark'} />{auth.user ? <GlobalNavigation>{content}</GlobalNavigation> : content}
    {auth.verificationOpen && auth.pendingVerification && <VerificationCodeModal key={auth.pendingVerification.verificationToken} challenge={auth.pendingVerification} autoSend={auth.verificationFromLogin} />}
    {auth.oauthPending && <OAuthRegistrationModal key={auth.oauthPending.ticket}/>}
  </>;
}
export default function RootLayout() {
  return <SafeAreaProvider><ThemeProvider><FeedbackProvider><AuthProvider><ThemedNavigation /></AuthProvider></FeedbackProvider></ThemeProvider></SafeAreaProvider>;
}
