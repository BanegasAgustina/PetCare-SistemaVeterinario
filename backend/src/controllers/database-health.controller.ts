/** Readiness independiente: conserva el health original y no revela configuración. */
import type { RequestHandler } from 'express';
import { checkDatabaseConnection } from '../services/database.service';
import type { ApiSuccess } from '../types/api';

export function createDatabaseHealthHandler(checkConnection = checkDatabaseConnection): RequestHandler {
  return async (_request, response, next) => {
    try {
      await checkConnection();
      const result: ApiSuccess<{ status: string; database: string }> = { success: true, data: { status: 'ok', database: 'available' } };
      response.status(200).json(result);
    } catch (error) { next(error); }
  };
}
