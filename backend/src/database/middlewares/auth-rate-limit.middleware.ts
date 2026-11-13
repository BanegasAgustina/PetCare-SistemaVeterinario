/**
 * ARCHIVO: auth-rate-limit.middleware.ts
 * UBICACIÓN: backend/src/middlewares/auth-rate-limit.middleware.ts
 * FUNCIÓN: Crea middleware de limitación de solicitudes para rutas sensibles.
 * RESPONSABILIDAD: Reducir fuerza bruta y abuso de endpoints con límite configurable por IP.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/app.ts, backend/src/routes/admin.routes.ts, backend/src/routes/auth.routes.ts, backend/src/routes/client.routes.ts, backend/src/routes/clinic.routes.ts, backend/src/routes/media.routes.ts, backend/src/routes/veterinarian.routes.ts
 * FUNCIONAMIENTO: Construye un limiter con conteo y ventana y lo devuelve como middleware Express.
 * IMPORTANCIA: Se reutiliza en autenticación, carga y operaciones administrativas sensibles.
 */
/** Reduce fuerza bruta y abuso de bcrypt; el contador es por IP y no afecta health. */
import { rateLimit } from 'express-rate-limit';

/** Crea limitador Express con el máximo de solicitudes indicado. */
export function createAuthRateLimiter(limit = 30) {
  return rateLimit({
    windowMs: 15 * 60 * 1000, limit, standardHeaders: 'draft-8', legacyHeaders: false,
    handler: (_request, response) => response.status(429).json({ success: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Demasiados intentos. Esperá unos minutos y volvé a intentar.' } }),
  });
}
