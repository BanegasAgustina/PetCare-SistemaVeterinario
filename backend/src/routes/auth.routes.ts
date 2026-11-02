/**
 * ARCHIVO: auth.routes.ts
 * UBICACIÓN: backend/src/routes/auth.routes.ts
 * FUNCIÓN: Registra endpoints de autenticación local, verificación, OAuth y contraseñas.
 * RESPONSABILIDAD: Asociar rutas públicas/protegidas con controladores y límites de intentos.
 * CONEXIONES: Importa: backend/src/controllers/auth.controller.ts, backend/src/middlewares/auth.middleware.ts, backend/src/middlewares/auth-rate-limit.middleware.ts, backend/src/controllers/verification.controller.ts, backend/src/controllers/oauth.controller.ts Se utiliza desde: backend/src/routes/index.ts
 * FUNCIONAMIENTO: Compone handlers de auth, OAuth y verificación con auth middleware y rate limit según el flujo.
 * IMPORTANCIA: Es la puerta HTTP de ingreso, renovación y recuperación de sesiones.
 */
/** Rutas de autenticación tradicional; ninguna ruta pública acepta privilegios. */
import { Router } from 'express';
import { getCurrentUser, login, register, requestPasswordReset, resetPassword, changeInitialPassword } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { createAuthRateLimiter } from '../middlewares/auth-rate-limit.middleware';
import { resend, verify } from '../controllers/verification.controller';
import * as oauth from '../controllers/oauth.controller';

// Dato authRouter: conserva un valor calculado o de configuración usado por este módulo.
export const authRouter = Router();
// authRouter.use: Evita que se almacenen en caché las respuestas de este router.
authRouter.use((_request, response, next) => { response.setHeader('Cache-Control', 'no-store'); next(); });
// authRouter.post('/register'): Crea una cuenta y aplica límite de intentos Controles: límite de solicitudes.
authRouter.post('/register', createAuthRateLimiter(), register);
// authRouter.post('/login'): Inicia sesión y aplica límite de intentos Controles: límite de solicitudes.
authRouter.post('/login', createAuthRateLimiter(), login);
// authRouter.post('/password-reset/request'): Solicita el restablecimiento de contraseña Controles: límite de solicitudes.
authRouter.post('/password-reset/request', createAuthRateLimiter(5), requestPasswordReset);
// authRouter.post('/password-reset/confirm'): Confirma el restablecimiento de contraseña Controles: límite de solicitudes.
authRouter.post('/password-reset/confirm', createAuthRateLimiter(10), resetPassword);
// authRouter.post('/change-initial-password'): Actualiza la contraseña inicial Controles: límite de solicitudes.
authRouter.post('/change-initial-password',createAuthRateLimiter(10),changeInitialPassword);
// authRouter.post('/verify-email'): Verifica el correo electrónico Controles: límite de solicitudes.
authRouter.post('/verify-email', createAuthRateLimiter(), verify);
// authRouter.post('/resend-verification'): Reenvía el correo de verificación Controles: límite de solicitudes.
authRouter.post('/resend-verification', createAuthRateLimiter(), resend);
// authRouter.post('/me'): Devuelve los datos de la sesión autenticada
authRouter.post('/me', authenticate, getCurrentUser);
// authRouter.post('/refresh'): Renueva la sesión OAuth Controles: límite de solicitudes.
authRouter.post('/refresh',createAuthRateLimiter(),oauth.refresh);
// authRouter.post('/logout'): Cierra la sesión OAuth Controles: límite de solicitudes.
authRouter.post('/logout',createAuthRateLimiter(),oauth.logout);
// authRouter.post('/oauth/exchange'): Intercambia el código OAuth por una sesión Controles: límite de solicitudes.
authRouter.post('/oauth/exchange',createAuthRateLimiter(),oauth.exchange);
// authRouter.post('/oauth/register'): Registra una cuenta mediante OAuth Controles: límite de solicitudes.
authRouter.post('/oauth/register',createAuthRateLimiter(),oauth.registerOAuth);
// authRouter.get('/oauth/providers'): Lista los proveedores OAuth disponibles Controles: límite de solicitudes.
authRouter.get('/oauth/providers',createAuthRateLimiter(30),oauth.providerAvailability);
// authRouter.post('/oauth/:provider/start'): Inicia autenticación con el proveedor OAuth indicado Controles: límite de solicitudes.
authRouter.post('/oauth/:provider/start',createAuthRateLimiter(),oauth.start);
// authRouter.post('/oauth/:provider/link'): Vincula el proveedor OAuth a la cuenta autenticada Controles: límite de solicitudes.
authRouter.post('/oauth/:provider/link',authenticate,createAuthRateLimiter(),oauth.link);
// authRouter.get('/oauth/:provider/callback'): Procesa el retorno del proveedor OAuth Controles: límite de solicitudes.
authRouter.get('/oauth/:provider/callback',createAuthRateLimiter(),oauth.callback);
