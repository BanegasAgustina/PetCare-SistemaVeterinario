/** El modal es una decisión de mobile; estos endpoints aplican toda la seguridad del código. */
import type { RequestHandler } from 'express';
import { resendVerification, verifyEmail } from '../services/verification.service';
export const verify: RequestHandler = async (request, response, next) => {
  try { await verifyEmail(request.body); response.json({ success: true, data: { verified: true } }); }
  catch (error) { next(error); }
};
export const resend: RequestHandler = async (request, response, next) => {
  try { response.json({ success: true, data: { verification: await resendVerification(request.body) } }); }
  catch (error) { next(error); }
};
