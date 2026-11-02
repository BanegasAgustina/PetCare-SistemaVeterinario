/**
 * ARCHIVO: OAuthSignInOptions.tsx
 * UBICACIÓN: mobile/src/components/ui/OAuthSignInOptions.tsx
 * FUNCIÓN: Selector de proveedores OAuth disponibles durante login o registro.
 * RESPONSABILIDAD: Iniciar login/vinculación delegando seguridad e intercambio al servicio OAuth.
 * CONEXIONES: Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useTheme.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/services/oauth.service.ts, mobile/src/services/api.ts, mobile/src/utils/oauth-availability.ts, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/FormNotice.tsx y 1 más Se utiliza desde: mobile/src/app/login.tsx, mobile/src/app/register.tsx
 * FUNCIONAMIENTO: Consulta disponibilidad para el retorno actual, presenta proveedores activos y comunica carga/errores al flujo de autenticación.
 * IMPORTANCIA: Evita ofrecer proveedores que el backend declara sin configurar.
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { getOAuthProviderAvailability, type OAuthProvider } from '../../services/oauth.service';
import { friendlyError } from '../../services/api';
import { availableOAuthProviders } from '../../utils/oauth-availability';
import { AppText } from './AppText';
import { FormNotice } from './FormNotice';
import { SocialLoginButton } from './SocialLoginButton';

/** Consulta proveedores disponibles para esta URL y presenta el estado de inicio/vinculación OAuth. */
export function OAuthSignInOptions({ onLoadingChange }: { onLoadingChange?: (loading: boolean) => void }) {
  const auth = useAuth();
  const action = useAsyncAction();
  const { colors } = useTheme();
  const [availability, setAvailability] = useState<Partial<Record<OAuthProvider, boolean>> | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const requiresDevelopmentBuild = Platform.OS !== 'web' && isRunningInExpoGo();

  useEffect(() => {
    let active = true;
    if (requiresDevelopmentBuild) return () => { active = false; };
    void getOAuthProviderAvailability().then(result => {
      if (active) setAvailability(result);
    }).catch(error => {
      if (active) setAvailabilityError(friendlyError(error));
    });
    return () => { active = false; };
  }, [requiresDevelopmentBuild]);

  const providers = availableOAuthProviders(availability ?? {});
  const startSocial = async (provider: OAuthProvider) => {
    setActiveProvider(provider === 'x' ? 'X' : provider === 'google' ? 'Google' : 'Facebook');
    onLoadingChange?.(true);
    try { await action.run(() => auth.socialSignIn(provider)); }
    finally { setActiveProvider(null); onLoadingChange?.(false); }
  };

  return <View style={styles.section}>
    <View style={styles.divider}><View style={[styles.line, { backgroundColor: colors.border }]} /><AppText variant="caption" muted>o</AppText><View style={[styles.line, { backgroundColor: colors.border }]} /></View>
    <View style={styles.title}><AppText variant="caption" muted>Continuar con</AppText></View>
    {requiresDevelopmentBuild && <FormNotice message="El acceso con proveedores requiere la development build de PetCare; no está disponible en Expo Go." />}
    {!requiresDevelopmentBuild && availabilityError && <FormNotice message="No pudimos consultar qué proveedores están disponibles. Revisá tu conexión e intentá nuevamente." />}
    {!requiresDevelopmentBuild && availability && providers.length === 0 && <AppText variant="caption" muted style={styles.notice}>El acceso con proveedores no está configurado para este entorno.</AppText>}
    {action.error && <FormNotice message={action.error} error />}
    {action.loading && <View style={[styles.progress, { borderColor: colors.border, backgroundColor: colors.surface }]} accessibilityRole="progressbar" accessibilityLabel={`Conectando con ${activeProvider ?? 'el proveedor'}`}><ActivityIndicator size="small" color={colors.primary} /><View style={styles.progressCopy}><AppText>Conectando con {activeProvider ?? 'el proveedor'}…</AppText><AppText variant="caption" muted>Podés volver con Atrás para cancelar la autorización.</AppText></View></View>}
    {!requiresDevelopmentBuild && availability === null && !availabilityError && <View style={styles.loading} accessibilityRole="progressbar" accessibilityLabel="Consultando proveedores"><ActivityIndicator size="small" color={colors.primary}/></View>}
    {providers.length > 0 && <View style={styles.providers}>{providers.map(provider => <SocialLoginButton key={provider} provider={provider === 'x' ? 'X' : provider === 'google' ? 'Google' : 'Facebook'} disabled={action.loading} onPress={() => void startSocial(provider)} />)}</View>}
  </View>;
}

const styles = StyleSheet.create({
  section: { width: '100%', gap: 8 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  line: { flex: 1, height: 1 },
  title: { alignItems: 'center' },
  notice: { textAlign: 'center' },
  providers: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 20 },
  progress: { width: '100%', padding: 12, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressCopy: { flex: 1, minWidth: 0, gap: 2 },
  loading: { minHeight: 28, alignItems: 'center', justifyContent: 'center' },
});
