// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

/** El modal es una decisión de mobile; estos endpoints aplican toda la seguridad del código. */
import type { RequestHandler } from 'express';
import { resendVerification, verifyEmail } from '../services/verification.service';
// Función verify: concentra una operación reutilizable de este módulo.
export const verify: RequestHandler = async (request, response, next) => {
  try { const session=await verifyEmail(request.body); response.json({ success: true, data: { verified: true, ...(session?{session}:{}) } }); }
  catch (error) { next(error); }
};
// Función resend: concentra una operación reutilizable de este módulo.
export const resend: RequestHandler = async (request, response, next) => {
  try { response.json({ success: true, data: { verification: await resendVerification(request.body) } }); }
  catch (error) { next(error); }
};
