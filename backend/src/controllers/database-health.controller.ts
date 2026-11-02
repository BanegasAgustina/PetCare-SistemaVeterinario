/**
 * ARCHIVO: database-health.controller.ts
 * UBICACIÓN: backend/src/controllers/database-health.controller.ts
 * FUNCIÓN: Construye el handler de diagnóstico de conexión a la base de datos.
 * RESPONSABILIDAD: Traducir disponibilidad SQL a una respuesta API sin filtrar detalles internos.
 * CONEXIONES: Importa: backend/src/services/database.service.ts, backend/src/types/api.ts Se utiliza desde: backend/src/routes/index.ts
 * FUNCIONAMIENTO: Lee la solicitud, llama a la operación del dominio y convierte su resultado o error en respuesta HTTP.
 * IMPORTANCIA: Separa salud HTTP de salud del pool SQL para diagnóstico operativo.
 */
/** Readiness independiente: conserva el health original y no revela configuración. */
import type { RequestHandler } from 'express';
import { checkDatabaseConnection } from '../services/database.service';
import type { ApiSuccess } from '../types/api';

/** Permite inyectar el chequeo y devolver el mismo contrato público ante conexión disponible/no disponible. */
export function createDatabaseHealthHandler(checkConnection = checkDatabaseConnection): RequestHandler {
  return async (_request, response, next) => {
    try {
      await checkConnection();
      const result: ApiSuccess<{ status: string; database: string }> = { success: true, data: { status: 'ok', database: 'available' } };
      response.status(200).json(result);
    } catch (error) { next(error); }
  };
}
