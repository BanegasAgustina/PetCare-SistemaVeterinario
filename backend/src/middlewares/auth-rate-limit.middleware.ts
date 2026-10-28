// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

/** Reduce fuerza bruta y abuso de bcrypt; el contador es por IP y no afecta health. */
import { rateLimit } from 'express-rate-limit';

// Función createAuthRateLimiter: crea un registro o inicia una operación dentro de este módulo.
export function createAuthRateLimiter(limit = 30) {
  return rateLimit({
    windowMs: 15 * 60 * 1000, limit, standardHeaders: 'draft-8', legacyHeaders: false,
    handler: (_request, response) => response.status(429).json({ success: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Demasiados intentos. Esperá unos minutos y volvé a intentar.' } }),
  });
}
