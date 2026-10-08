/** Rutas de autenticación tradicional; ninguna ruta pública acepta privilegios. */
import { Router } from 'express';
import { getCurrentUser, login, register } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { createAuthRateLimiter } from '../middlewares/auth-rate-limit.middleware';
import { resend, verify } from '../controllers/verification.controller';
import * as oauth from '../controllers/oauth.controller';

export const authRouter = Router();
authRouter.use((_request, response, next) => { response.setHeader('Cache-Control', 'no-store'); next(); });
authRouter.post('/register', createAuthRateLimiter(), register);
authRouter.post('/login', createAuthRateLimiter(), login);
authRouter.post('/verify-email', createAuthRateLimiter(), verify);
authRouter.post('/resend-verification', createAuthRateLimiter(), resend);
authRouter.get('/me', authenticate, getCurrentUser);
authRouter.post('/refresh',createAuthRateLimiter(),oauth.refresh);
authRouter.post('/logout',createAuthRateLimiter(),oauth.logout);
authRouter.post('/oauth/exchange',createAuthRateLimiter(),oauth.exchange);
authRouter.post('/oauth/register',createAuthRateLimiter(),oauth.registerOAuth);
authRouter.post('/oauth/:provider/start',createAuthRateLimiter(),oauth.start);
authRouter.post('/oauth/:provider/link',authenticate,createAuthRateLimiter(),oauth.link);
authRouter.get('/oauth/:provider/callback',createAuthRateLimiter(),oauth.callback);
