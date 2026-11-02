/**
 * ARCHIVO: verification.controller.ts
 * UBICACIÓN: backend/src/controllers/verification.controller.ts
 * FUNCIÓN: Adaptar confirmación y reenvío de códigos de verificación a Express.
 * RESPONSABILIDAD: Enviar el cuerpo recibido al servicio de verificación y normalizar respuesta/errores.
 * CONEXIONES: Importa: backend/src/services/verification.service.ts Se utiliza desde: backend/src/routes/auth.routes.ts
 * FUNCIONAMIENTO: Lee la solicitud, llama a la operación del dominio y convierte su resultado o error en respuesta HTTP.
 * IMPORTANCIA: Aísla la comunicación HTTP del conteo de intentos, expiración y correo del servicio.
 */
/** El modal es una decisión de mobile; estos endpoints aplican toda la seguridad del código. */
import type { RequestHandler } from 'express';
import { resendVerification, verifyEmail } from '../services/verification.service';
/** Confirma código con el desafío y devuelve el estado de verificación resultante. */
export const verify: RequestHandler = async (request, response, next) => {
  try { const session=await verifyEmail(request.body); response.json({ success: true, data: { verified: true, ...(session?{session}:{}) } }); }
  catch (error) { next(error); }
};
/** Reenvía código al email del desafío con límites gestionados por el servicio. */
export const resend: RequestHandler = async (request, response, next) => {
  try { response.json({ success: true, data: { verification: await resendVerification(request.body) } }); }
  catch (error) { next(error); }
};
