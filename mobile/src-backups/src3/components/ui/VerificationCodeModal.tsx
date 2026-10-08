/** Modal único para registro/login: obligatorio hasta verificar o volver a autenticarse si la prueba vence. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppModal } from './AppModal';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { FormNotice } from './FormNotice';
import { VerificationCodeInput } from '../forms/VerificationCodeInput';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useFeedback } from '../../contexts/FeedbackContext';
import { ApiError, friendlyError } from '../../services/api';
import { readVerification, resendCode, verifyCode } from '../../services/verification.service';
import type { VerificationChallenge } from '../../types/auth';

export function VerificationCodeModal({ challenge, autoSend = false }: { challenge: VerificationChallenge; autoSend?: boolean }) {
  const auth = useAuth(); const { colors } = useTheme(); const { showToast } = useFeedback();
  const [code, setCode] = useState(''); const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null); const [loading, setLoading] = useState<'verify' | 'resend' | null>(null);
  const [verified, setVerified] = useState(false); const [sessionExpired, setSessionExpired] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [startedAt] = useState(() => Date.now());
  const inFlight = useRef(false); const mounted = useRef(true); const autoAttempt = useRef(false);
  // El deadline se recalcula solo con una respuesta de backend, no con cada tick del contador.
  const deadline = (challenge.receivedAt ?? startedAt) + challenge.retryAfterSeconds * 1000;
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));
  const expired = challenge.expiresAt !== null && Date.parse(challenge.expiresAt) <= now;
  const countdown = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  useEffect(() => {
    mounted.current = true;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') setNow(Date.now()); });
    return () => { mounted.current = false; clearInterval(timer); subscription.remove(); };
  }, []);
  const handleFailure = useCallback((failure: unknown) => {
    if (failure instanceof ApiError && failure.code === 'EMAIL_ALREADY_VERIFIED') { setVerified(true); Keyboard.dismiss(); return; }
    if (failure instanceof ApiError && failure.verification) {
      try { auth.updateVerification(readVerification(failure.verification)); } catch { setError('No pudimos validar la respuesta. Intentá nuevamente.'); return; }
    }
    if (failure instanceof ApiError && failure.code === 'VERIFICATION_SESSION_EXPIRED') setSessionExpired(true);
    setError(failure instanceof ApiError && failure.code === 'NETWORK_ERROR' ? 'No pudimos verificar el código. Intentá nuevamente.' : friendlyError(failure));
  }, [auth]);
  const resend = useCallback(async () => {
    if (inFlight.current || remaining > 0) return;
    inFlight.current = true; setLoading('resend'); setError(null); setInfo(null);
    try {
      const next = await resendCode(challenge.verificationToken);
      if (!mounted.current) return;
      auth.updateVerification(next); setCode(''); setNow(Date.now());
      if (next.delivery === 'failed') setError('No pudimos enviar el código. Intentá reenviarlo cuando termine el contador.');
      else setInfo('Te enviamos un nuevo código.');
    } catch (failure) { if (mounted.current) handleFailure(failure); }
    finally { inFlight.current = false; if (mounted.current) setLoading(null); }
  }, [challenge.verificationToken, auth, remaining, handleFailure]);
  useEffect(() => {
    // Login puede iniciar el envío al abrir; Registro ya solicitó el código en backend.
    if (!autoSend || autoAttempt.current || remaining > 0 || (challenge.expiresAt && !expired)) return;
    const timer = setTimeout(() => { autoAttempt.current = true; void resend(); }, 0);
    return () => clearTimeout(timer);
  }, [autoSend, remaining, challenge.expiresAt, expired, resend]);
  const verify = async () => {
    if (inFlight.current) return;
    if (code.length !== 6) { setError('Ingresá los seis dígitos del código.'); return; }
    inFlight.current = true; setLoading('verify'); setError(null); setInfo(null);
    try {
      await verifyCode(challenge.verificationToken, code);
      if (mounted.current) { setVerified(true); Keyboard.dismiss(); }
    } catch (failure) {
      if (mounted.current) {
        if (failure instanceof ApiError && failure.code === 'EMAIL_ALREADY_VERIFIED') { setVerified(true); Keyboard.dismiss(); }
        else handleFailure(failure);
      }
    } finally { inFlight.current = false; if (mounted.current) setLoading(null); }
  };
  const continueToLogin = () => { auth.finishVerification(); showToast('Correo verificado. Tu cuenta está lista.', 'success'); router.replace('/login'); };
  return <AppModal visible>
    <View style={[styles.icon, { backgroundColor: colors.accent }]}><Ionicons name={verified ? 'checkmark-circle-outline' : 'mail-outline'} size={28} color={colors.primary} accessible={false} /></View>
    {verified ? <>
      <AppText variant="subtitle" accessibilityRole="header" style={styles.center}>Correo verificado</AppText>
      <AppText muted style={styles.center}>Tu cuenta está lista.</AppText>
      <AppButton label="CONTINUAR" onPress={continueToLogin} />
    </> : <>
      <AppText variant="subtitle" accessibilityRole="header" style={styles.center}>Verificá tu correo</AppText>
      <AppText muted style={styles.center}>{challenge.delivery === 'failed' && !challenge.expiresAt ? 'Necesitamos enviarte un código de seis dígitos a:' : 'Enviamos un código de seis dígitos a:'}</AppText>
      <AppText style={[styles.center, { fontWeight: '700', color: colors.primary }]}>{challenge.maskedEmail}</AppText>
      <VerificationCodeInput value={code} onChange={value => { setCode(value); setError(null); }} disabled={Boolean(loading) || sessionExpired} invalid={Boolean(error) || expired} />
      <FormNotice message={error ?? (expired ? 'El código venció. Solicitá uno nuevo.' : challenge.delivery === 'failed' ? 'No pudimos enviar el código. Podés reenviarlo cuando termine el contador.' : null)} error />
      <FormNotice message={info} />
      {sessionExpired ? <AppButton label="Volver a iniciar sesión" onPress={() => { auth.leaveVerification(); router.replace('/login'); }} /> : <>
        <AppButton label={loading === 'verify' ? 'VERIFICANDO…' : 'VERIFICAR'} loading={loading === 'verify'} disabled={Boolean(loading) || expired || challenge.delivery === 'failed'} onPress={() => void verify()} />
        <View style={styles.resend}><AppText variant="caption" muted>¿No recibiste el código?</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Reenviar código" disabled={Boolean(loading) || remaining > 0} onPress={() => void resend()} style={styles.resendButton}>
            <AppText variant="caption" style={{ color: colors.primary }}>{loading === 'resend' ? 'Enviando…' : remaining > 0 ? `Reenviar código en ${countdown}` : 'Reenviar código'}</AppText>
          </Pressable>
        </View>
      </>}
    </>}
  </AppModal>;
}
const styles = StyleSheet.create({ center: { textAlign: 'center' }, icon: { width: 56, height: 56, borderRadius: 18, alignSelf: 'center', justifyContent: 'center', alignItems: 'center' }, resend: { alignItems: 'center' }, resendButton: { minHeight: 44, justifyContent: 'center' } });
