// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

/** Confirma disponibilidad HTTP; no representa una comprobación de MySQL. */
import type { Request, Response } from 'express';
import type { ApiSuccess } from '../types/api';

// Función getHealth: obtiene o consulta información dentro de este módulo.
export function getHealth(_request: Request, response: Response): void {
  const result: ApiSuccess<{ status: string; message: string }> = {
    success: true,
    data: { status: 'ok', message: 'PetCare API funcionando' },
  };
  response.status(200).json(result);
}
