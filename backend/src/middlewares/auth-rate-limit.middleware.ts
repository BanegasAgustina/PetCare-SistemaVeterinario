/** Reduce fuerza bruta y abuso de bcrypt; el contador es por IP y no afecta health. */
import { rateLimit } from 'express-rate-limit';

export function createAuthRateLimiter(limit = 30) {
  return rateLimit({
    windowMs: 15 * 60 * 1000, limit, standardHeaders: 'draft-8', legacyHeaders: false,
    handler: (_request, response) => response.status(429).json({ success: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Demasiados intentos. Esperá unos minutos y volvé a intentar.' } }),
  });
}
