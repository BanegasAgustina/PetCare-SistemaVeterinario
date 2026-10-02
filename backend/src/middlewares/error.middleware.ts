/** Traduce errores internos a mensajes seguros sin revelar detalles de Node o SQL. */
import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ApiFailure } from '../types/api';
import { DatabaseError } from '../utils/database-error';
import { AppError } from '../utils/app-error';

export const notFoundHandler: RequestHandler = (_request, response) => {
  const result: ApiFailure = { success: false, error: { code: 'NOT_FOUND', message: 'Ruta no encontrada.' } };
  response.status(404).json(result);
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, next) => {
  if (response.headersSent) { next(error); return; }
  if (error instanceof DatabaseError || error instanceof AppError) {
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
