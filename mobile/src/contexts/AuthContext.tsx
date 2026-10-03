/** Sesión global: restaura con /me, conserva token cifrado y cierra sesión al vencer. */
import { createContext, useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import * as authApi from '../services/auth.service';
import { ApiError, friendlyError, apiRequest } from '../services/api';
import { clearSession, readSession, saveSession } from '../services/session-store';
import type { AuthUser, LoginValues, RegisterValues, StoredSession, VerificationChallenge } from '../types/auth';
import { readVerification } from '../services/verification.service';
import { hasRole,hasPermission } from '../utils/authorization';

type AuthContextValue = {
  hasRole: (...roles:AuthUser['role'][])=>boolean;
  hasPermission: (...codes:string[])=>boolean;
  request: <T>(path: string, options?: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH'; body?: unknown }) => Promise<T>;
  user: AuthUser | null; restoring: boolean; restoreError: string | null; notice: string | null; registeredEmail: string;
  signIn: (values: LoginValues) => Promise<void>; register: (values: RegisterValues) => Promise<void>;
  signOut: () => Promise<void>; restoreSession: () => Promise<void>; refreshProfile: () => Promise<void>;
  pendingVerification: VerificationChallenge | null; verificationOpen: boolean;
  openVerification: () => void; updateVerification: (value: VerificationChallenge) => void; finishVerification: () => void;
  verificationFromLogin: boolean; leaveVerification: () => void;
};
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [pendingVerification, setPendingVerification] = useState<VerificationChallenge | null>(null);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verificationFromLogin, setVerificationFromLogin] = useState(false);
  const session = useRef<StoredSession | null>(null);
  // Cambiar la generación invalida respuestas de solicitudes anteriores al cierre de sesión.
  const generation = useRef(0);

  const expireSession = useCallback((message: string) => {
    generation.current += 1; session.current = null; setUser(null); setExpiresAt(null); setNotice(message);
    void clearSession().catch(() => setNotice('Tu sesión venció. No pudimos limpiar el almacenamiento; volvé a intentar.'));
  }, []);

  const restoreSession = useCallback(async () => {
    const attempt = ++generation.current;
    setRestoring(true); setRestoreError(null);
    try {
      const stored = await readSession();
      if (attempt !== generation.current) return;
      if (!stored || stored.expiresAt <= Date.now()) {
        if (stored) { await clearSession(); setNotice('Tu sesión venció. Iniciá sesión nuevamente.'); }
        if (attempt === generation.current) { session.current = null; setUser(null); setExpiresAt(null); }
        return;
      }
      const currentUser = await authApi.getCurrentUser(stored.accessToken);
      if (attempt === generation.current) { session.current = stored; setUser(currentUser); setExpiresAt(stored.expiresAt); }
    } catch (error) {
      if (attempt !== generation.current) return;
      if (error instanceof ApiError && (error.status === 401 || error.code === 'EMAIL_NOT_VERIFIED')) {
        expireSession(error.message);
        setRestoring(false);
      } else { setRestoreError(friendlyError(error)); }
    } finally { if (attempt === generation.current) setRestoring(false); }
  }, [expireSession]);

  useEffect(() => {
    // La lectura del almacenamiento inicia después de montar el proveedor.
    const start = setTimeout(() => { void restoreSession(); }, 0);
    return () => { clearTimeout(start); generation.current += 1; };
  }, [restoreSession]);
  useEffect(() => {
    if (expiresAt === null) return;
    const expire = () => expireSession('Tu sesión venció. Iniciá sesión nuevamente.');
    const timeout = setTimeout(expire, Math.max(0, expiresAt - Date.now()));
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active' && expiresAt <= Date.now()) expire(); });
    return () => { clearTimeout(timeout); subscription.remove(); };
  }, [expiresAt, expireSession]);

  const signIn = useCallback(async (values: LoginValues) => {
    const attempt = ++generation.current;
    let result;
    try { result = await authApi.login(values); }
    catch (error) {
      if (attempt === generation.current && error instanceof ApiError && error.code === 'EMAIL_NOT_VERIFIED' && error.verification) {
        setPendingVerification(readVerification(error.verification)); setRegisteredEmail(values.email.trim().toLowerCase());
        setVerificationFromLogin(true);
      }
      throw error;
    }
    if (attempt !== generation.current) return;
    const currentUser=await authApi.getCurrentUser(result.accessToken);
    if(attempt!==generation.current)return;
    const stored = { accessToken: result.accessToken, expiresAt: Date.now() + result.expiresIn * 1000 };
    await saveSession(stored);
    if (attempt === generation.current) { session.current = stored; setUser(currentUser); setExpiresAt(stored.expiresAt); setNotice(null); setRestoreError(null); setRegisteredEmail(''); setPendingVerification(null); setVerificationOpen(false); }
  }, []);

  const register = useCallback(async (values: RegisterValues) => {
    const result = await authApi.register(values);
    setRegisteredEmail(result.user.email); setPendingVerification(result.verification); setVerificationFromLogin(false); setVerificationOpen(true); setNotice(null);
  }, []);

  const signOut = useCallback(async () => {
    generation.current += 1;
    await clearSession();
    session.current = null; setUser(null); setExpiresAt(null); setRestoreError(null); setRestoring(false); setNotice(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const stored = session.current;
    if (!stored) throw new ApiError('AUTH_REQUIRED', 'Iniciá sesión para continuar.', 401);
    const attempt = generation.current;
    try {
      const currentUser = await authApi.getCurrentUser(stored.accessToken);
      if (attempt === generation.current) setUser(currentUser);
    } catch (error) {
      if (attempt === generation.current && error instanceof ApiError && (error.status === 401 || error.code === 'EMAIL_NOT_VERIFIED')) expireSession(error.message);
      throw error;
    }
  }, [expireSession]);

  const openVerification = () => setVerificationOpen(true);
  const request = useCallback(async <T,>(path: string, options: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH'; body?: unknown } = {}): Promise<T> => {
    const stored=session.current;
    if (!stored) throw new ApiError('AUTH_REQUIRED','Iniciá sesión para continuar.',401);
    const attempt=generation.current;
    try { return await apiRequest<T>(path,{...options,accessToken:stored.accessToken}); }
    catch(error) {
      if (attempt===generation.current && error instanceof ApiError && error.status===401) expireSession(error.message);
      if (error instanceof ApiError && error.status===403) void refreshProfile().catch(()=>undefined);
      throw error;
    }
  },[expireSession,refreshProfile]);
  useEffect(()=> {
    const subscription=AppState.addEventListener('change',state=> {
      if (state==='active' && session.current && session.current.expiresAt>Date.now()) void refreshProfile().catch(()=>undefined);
    });
    return ()=>subscription.remove();
  },[refreshProfile]);
  const updateVerification = (value: VerificationChallenge) => setPendingVerification(value);
  // Verificar email no inicia sesión: el flujo existente continúa con credenciales en Login.
  const finishVerification = () => { setPendingVerification(null); setVerificationOpen(false); setNotice(null); };
  const leaveVerification = () => { setPendingVerification(null); setVerificationOpen(false); setNotice('Volvé a iniciar sesión para retomar la verificación de tu correo.'); };
  return <AuthContext.Provider value={{ hasRole:(...roles)=>hasRole(user,...roles),hasPermission:(...codes)=>hasPermission(user,...codes),request, user, restoring, restoreError, notice, registeredEmail, signIn, register, signOut, restoreSession, refreshProfile,
    pendingVerification, verificationOpen, openVerification, updateVerification, finishVerification, verificationFromLogin, leaveVerification }}>{children}</AuthContext.Provider>;
}
