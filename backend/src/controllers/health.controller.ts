/**
 * ARCHIVO: health.controller.ts
 * UBICACIÓN: backend/src/controllers/health.controller.ts
 * FUNCIÓN: Responde la consulta pública básica de salud de la API.
 * RESPONSABILIDAD: Exponer estado mínimo del proceso sin iniciar una consulta a base de datos.
 * CONEXIONES: Importa: backend/src/types/api.ts Se utiliza desde: backend/src/routes/index.ts
 * FUNCIONAMIENTO: Lee la solicitud, llama a la operación del dominio y convierte su resultado o error en respuesta HTTP.
 * IMPORTANCIA: Permite a despliegues y monitores distinguir si la aplicación HTTP está activa.
 */
/** Confirma disponibilidad HTTP; no representa una comprobación de MySQL. */
import type { Request, Response } from 'express';
import type { ApiSuccess } from '../types/api';

/** Devuelve sobre success/data con estado de aplicación activo. */
export function getHealth(_request: Request, response: Response): void {
  const result: ApiSuccess<{ status: string; message: string }> = {
    success: true,
    data: { status: 'ok', message: 'PetCare API funcionando' },
  };
  response.status(200).json(result);
}
