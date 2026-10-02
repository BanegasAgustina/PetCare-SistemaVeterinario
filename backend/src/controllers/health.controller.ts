/** Confirma disponibilidad HTTP; no representa una comprobación de MySQL. */
import type { Request, Response } from 'express';
import type { ApiSuccess } from '../types/api';

export function getHealth(_request: Request, response: Response): void {
  const result: ApiSuccess<{ status: string; message: string }> = {
    success: true,
    data: { status: 'ok', message: 'PetCare API funcionando' },
  };
  response.status(200).json(result);
}
