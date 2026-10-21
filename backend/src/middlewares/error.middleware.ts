/** Traduce errores internos a mensajes seguros sin revelar detalles de Node o SQL. */
import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ApiFailure } from '../types/api';
import { DatabaseError } from '../utils/database-error';
import { AppError } from '../utils/app-error';

export const notFoundHandler: RequestHandler = (request, response) => {
  const path = request.path.replace(/\/(products|pets|orders|addresses|notifications|cart)\/[^/]+/g, '/$1/:id').slice(0, 140);
  const storeRoute = /^\/api\/client\/(?:store(?:\/|$)|cart(?:\/|$))/.test(request.path);
  if (storeRoute) console.warn('[API_ROUTE_NOT_FOUND]', JSON.stringify({ method: request.method, path }));
  const result: ApiFailure = { success: false, error: storeRoute
    ? { code: 'ROUTE_NOT_FOUND', message: 'La ruta de la tienda no está disponible en esta versión del servidor.' }
    : { code: 'NOT_FOUND', message: 'Ruta no encontrada.' } };
  response.status(404).json(result);
};

export const errorHandler: ErrorRequestHandler = (error: unknown, request, response, next) => {
  if (response.headersSent) { next(error); return; }
  if (error instanceof DatabaseError || error instanceof AppError) {
    if (error instanceof DatabaseError) {
      const routePath = typeof request.route?.path === 'string' ? request.route.path : '';
      const route = `${request.baseUrl}${routePath}`.replace(/[^A-Za-z0-9_/:.-]/g, '').slice(0, 160);
      const cause = error.cause;
      const causeCode = typeof cause === 'object' && cause !== null && 'code' in cause ? String(cause.code) : error.code;
      const safeCode = /^[A-Z0-9_]+$/.test(causeCode) ? causeCode : 'UNKNOWN';
      if (error.code === 'SCHEMA_UPDATE_REQUIRED') {
        console.error('[DATABASE_SCHEMA_REQUEST]', JSON.stringify({ method: request.method, route: route || 'unknown' }));
      } else {
        // Agrega el endpoint fallido al código del motor sin incluir mensaje SQL ni valores enlazados.
        console.error('[DATABASE_OPERATION_REQUEST]', JSON.stringify({ method: request.method, route: route || 'unknown', code: safeCode }));
      }
    }
    const result: ApiFailure = { success: false, error: { code: error.code, message: error.message,
      ...(error instanceof AppError && error.verification ? { verification: error.verification } : {}) } };
    response.status(error.status).json(result);
    return;
  }
  // Express identifica JSON inválido y cuerpos demasiado grandes con códigos propios.
  const errorType = typeof error === 'object' && error !== null && 'type' in error ? error.type : undefined;
  const invalidJson = errorType === 'entity.parse.failed';
  const tooLarge = errorType === 'entity.too.large';
  const status = invalidJson ? 400 : tooLarge ? 413 : 500;
  const result: ApiFailure = {
    success: false,
    error: {
      code: invalidJson ? 'INVALID_JSON' : tooLarge ? 'PAYLOAD_TOO_LARGE' : 'INTERNAL_ERROR',
      message: invalidJson ? 'El cuerpo de la solicitud no contiene JSON válido.' : tooLarge ? 'La solicitud supera el tamaño permitido.' : 'Ocurrió un error inesperado. Intentá nuevamente.',
    },
  };
  response.status(status).json(result);
};
