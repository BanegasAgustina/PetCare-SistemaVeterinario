/** Sesión global: revalida /me, rota renovación con un único envío y revoca al cerrar sesión. */
import { createContext, useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import * as authApi from '../services/auth.service';
import { ApiError, friendlyError, apiRequest } from '../services/api';
import { clearSession, readSession, saveSession } from '../services/session-store';
import type { AuthUser, LoginValues, RegisterValues, StoredSession, VerificationChallenge,AccessSession } from '../types/auth';
import { readVerification } from '../services/verification.service';
import { hasRole,hasPermission } from '../utils/authorization';
import { beginOAuth,completeOAuth,type OAuthPending,type OAuthProvider } from '../services/oauth.service';

type AuthContextValue = {
  socialSignIn: (provider:OAuthProvider)=>Promise<void>;
  linkProvider: (provider:OAuthProvider)=>Promise<void>;
  oauthPending: OAuthPending|null;
  cancelOAuth: ()=>void;
  registerOAuth: (profile:RegisterValues)=>Promise<void>;
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
  const [oauthPending,setOAuthPending]=useState<OAuthPending|null>(null);
  const renewing=useRef<Promise<StoredSession>|null>(null);
  // Cambiar la generación invalida respuestas de solicitudes anteriores al cierre de sesión.
  const generation = useRef(0);

  const expireSession = useCallback((message: string) => {
    renewing.current=null;
    generation.current += 1; session.current = null; setUser(null); setExpiresAt(null); setNotice(message);
    void clearSession().catch(() => setNotice('Tu sesión venció. No pudimos limpiar el almacenamiento; volvé a intentar.'));
  }, []);

  /** Una promesa compartida evita usar dos veces el refresh token ante requests concurrentes. */
  const renewSession=useCallback(async(stored:StoredSession):Promise<StoredSession>=>{
    if(renewing.current)return renewing.current;
    const attempt=generation.current;
    const operation=(async()=>{
      if(!stored.refreshToken)throw new ApiError('INVALID_TOKEN','Iniciá sesión nuevamente.',401);
      const result=await authApi.refresh(stored.refreshToken);
      const next={accessToken:result.accessToken,refreshToken:result.refreshToken,expiresAt:Date.now()+result.expiresIn*1000};
      if(attempt!==generation.current){await authApi.logout(result.refreshToken).catch(()=>undefined);throw new ApiError('AUTH_REQUIRED','La sesión se cerró.',401);}
      await saveSession(next);
      if(attempt===generation.current){session.current=next;setUser(result.user);setExpiresAt(next.expiresAt);}
      return next;
    })();
    renewing.current=operation;
    try{return await operation;}catch(error){if(attempt===generation.current&&error instanceof ApiError&&error.status===401)expireSession(error.message);throw error;}
    finally{if(renewing.current===operation)renewing.current=null;}
  },[expireSession]);

  /** Todas las vías de login comparten validación /me y persistencia, sin aceptar un rol local. */
  const acceptSession=useCallback(async(result:AccessSession,attempt:number)=>{
    if(attempt!==generation.current){await authApi.logout(result.refreshToken).catch(()=>undefined);return;}
    const currentUser=await authApi.getCurrentUser(result.accessToken);
    if(attempt!==generation.current){await authApi.logout(result.refreshToken).catch(()=>undefined);return;}
    const stored={accessToken:result.accessToken,refreshToken:result.refreshToken,expiresAt:Date.now()+result.expiresIn*1000};
    await saveSession(stored);
    if(attempt===generation.current){session.current=stored;setUser(currentUser);setExpiresAt(stored.expiresAt);setNotice(null);setRestoreError(null);setRegisteredEmail('');setPendingVerification(null);setVerificationOpen(false);setOAuthPending(null);}
  },[]);

  const restoreSession = useCallback(async () => {
    renewing.current=null;
    const attempt = ++generation.current;
    setRestoring(true); setRestoreError(null);
    try {
      let stored = await readSession();
      if (attempt !== generation.current) return;
      if(stored&&stored.expiresAt<=Date.now()&&stored.refreshToken)stored=await renewSession(stored);
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
  }, [expireSession,renewSession]);

  useEffect(() => {
    // La lectura del almacenamiento inicia después de montar el proveedor.
    const start = setTimeout(() => { void restoreSession(); }, 0);
    return () => { clearTimeout(start); generation.current += 1; };
  }, [restoreSession]);
  useEffect(() => {
    if (expiresAt === null) return;
    const renew=()=>{const stored=session.current;if(stored)void renewSession(stored).catch(error=>{if(!(error instanceof ApiError&&error.status===401))setNotice(friendlyError(error));});};
    const timeout = setTimeout(renew, Math.max(0, expiresAt - Date.now()-30000));
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active' && expiresAt <= Date.now()+30000) renew(); });
    return () => { clearTimeout(timeout); subscription.remove(); };
  }, [expiresAt, renewSession]);

  const signIn = useCallback(async (values: LoginValues) => {
    renewing.current=null;
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
    await acceptSession(result,attempt);
  }, [acceptSession]);

  const socialSignIn=useCallback(async(provider:OAuthProvider)=>{
    renewing.current=null;
    const attempt=++generation.current;
    try{const result=await beginOAuth(provider);if(attempt!==generation.current)return;
      if(result.session)await acceptSession(result.session,attempt);else if(result.pending)setOAuthPending(result.pending);
    }catch(error){if(attempt===generation.current&&error instanceof ApiError&&error.code==='EMAIL_NOT_VERIFIED'&&error.verification){setPendingVerification(readVerification(error.verification));setVerificationFromLogin(true);setVerificationOpen(true);}throw error;}
  },[acceptSession]);
  const linkProvider=useCallback(async(provider:OAuthProvider)=>{
    let stored=session.current;if(!stored)throw new ApiError('AUTH_REQUIRED','Iniciá sesión.',401);
    if(stored.expiresAt<=Date.now()+30000)stored=await renewSession(stored);
    const result=await beginOAuth(provider,stored.accessToken);if(!result.linked)throw new ApiError('INVALID_RESPONSE','No se pudo vincular el proveedor.');
  },[renewSession]);
  const registerOAuth=useCallback(async(profile:RegisterValues)=>{
    if(!oauthPending)throw new ApiError('OAUTH_FAILED','Iniciá OAuth nuevamente.');const attempt=generation.current;
    const verification=readVerification(await completeOAuth(oauthPending,profile));if(attempt!==generation.current)return;
    setOAuthPending(null);setPendingVerification(verification);setRegisteredEmail(profile.email);setVerificationFromLogin(false);setVerificationOpen(true);
  },[oauthPending]);

  const register = useCallback(async (values: RegisterValues) => {
    const result = await authApi.register(values);
    setRegisteredEmail(result.user.email); setPendingVerification(result.verification); setVerificationFromLogin(false); setVerificationOpen(true); setNotice(null);
  }, []);

  const signOut = useCallback(async () => {
    renewing.current=null;
    generation.current += 1;
    const refreshToken=session.current?.refreshToken;
    await clearSession();
    session.current = null; setUser(null); setExpiresAt(null); setRestoreError(null); setRestoring(false); setNotice(null);setOAuthPending(null);
    if(refreshToken)try{await authApi.logout(refreshToken);}catch{setNotice('Se cerró la sesión en este dispositivo. No pudimos revocarla en el servidor; requiere conexión.');}
  }, []);

  const refreshProfile = useCallback(async () => {
    let stored = session.current;
    if (!stored) throw new ApiError('AUTH_REQUIRED', 'Iniciá sesión para continuar.', 401);
    const attempt = generation.current;
    try {
      if(stored.expiresAt<=Date.now()+30000)stored=await renewSession(stored);
      const currentUser = await authApi.getCurrentUser(stored.accessToken);
      if (attempt === generation.current) setUser(currentUser);
    } catch (error) {
      if (attempt === generation.current && error instanceof ApiError && (error.status === 401 || error.code === 'EMAIL_NOT_VERIFIED')) expireSession(error.message);
      throw error;
    }
  }, [expireSession,renewSession]);

  const openVerification = () => setVerificationOpen(true);
  const request = useCallback(async <T,>(path: string, options: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH'; body?: unknown } = {}): Promise<T> => {
    let stored=session.current;
    if (!stored) throw new ApiError('AUTH_REQUIRED','Iniciá sesión para continuar.',401);
    const attempt=generation.current;
    try {
      if(stored.expiresAt<=Date.now()+30000)stored=await renewSession(stored);
      if(attempt!==generation.current)throw new ApiError('AUTH_REQUIRED','La sesión se cerró.',401);
      try{return await apiRequest<T>(path,{...options,accessToken:stored.accessToken});}
      catch(error){if(error instanceof ApiError&&error.code==='TOKEN_EXPIRED'){const renewed=await renewSession(stored);return await apiRequest<T>(path,{...options,accessToken:renewed.accessToken});}throw error;}
    }
    catch(error) {
      if (attempt===generation.current && error instanceof ApiError && error.status===401) expireSession(error.message);
      if (error instanceof ApiError && error.status===403) void refreshProfile().catch(()=>undefined);
      throw error;
    }
  },[expireSession,refreshProfile,renewSession]);
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
  return <AuthContext.Provider value={{socialSignIn,linkProvider,oauthPending,cancelOAuth:()=>setOAuthPending(null),registerOAuth, hasRole:(...roles)=>hasRole(user,...roles),hasPermission:(...codes)=>hasPermission(user,...codes),request, user, restoring, restoreError, notice, registeredEmail, signIn, register, signOut, restoreSession, refreshProfile,
    pendingVerification, verificationOpen, openVerification, updateVerification, finishVerification, verificationFromLogin, leaveVerification }}>{children}</AuthContext.Provider>;
}
