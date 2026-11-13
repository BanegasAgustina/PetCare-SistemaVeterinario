/**
 * ARCHIVO: auth.controller.ts
 * UBICACIÓN: backend/src/controllers/auth.controller.ts
 * FUNCIÓN: Convierte solicitudes de autenticación en llamadas a servicios y sobres de respuesta API.
 * RESPONSABILIDAD: Coordinar registro, login, sesión actual y flujos de contraseña sin implementar reglas de identidad.
 * CONEXIONES: Importa: backend/src/services/auth.service.ts, backend/src/types/auth.ts, backend/src/utils/register-diagnostics.ts, backend/src/services/password-reset.service.ts Se utiliza desde: backend/src/routes/auth.routes.ts
 * FUNCIONAMIENTO: Lee la solicitud, llama a la operación del dominio y convierte su resultado o error en respuesta HTTP.
 * IMPORTANCIA: Es el adaptador HTTP entre auth.routes.ts y los servicios de autenticación/recuperación.
 */
/** Controladores delgados: delegan validaciones, hashing y consultas a sus capas. */
import type { RequestHandler } from 'express';
import { loginUser, registerUser } from '../services/auth.service';
import type { AuthUser } from '../types/auth';
import { withRegisterDiagnostics } from '../utils/register-diagnostics';
import { requestPasswordReset as requestReset, resetPassword as completeReset, changeInitialPassword as changeInitial } from '../services/password-reset.service';

/** Recibe el JSON de registro, delega en registerUser y responde 201; los errores siguen al middleware Express. */
export const register: RequestHandler = async (request, response, next) => {
  try { response.status(201).json({ success: true, data: await withRegisterDiagnostics(()=>registerUser(request.body)) }); }
  catch (error) { next(error); }
};
/** Valida credenciales mediante loginUser y devuelve la sesión; errores como 401/403 se normalizan aguas abajo. */
export const login: RequestHandler = async (request, response, next) => {
  try { response.status(200).json({ success: true, data: await loginUser(request.body) }); }
  catch (error) { next(error); }
};
/** authenticate ya releyó identidad, rol y permisos en MySQL; no devuelve claims sin revalidarlos. */
/** Devuelve el usuario ya revalidado por authenticate, sin volver a confiar en claims del token. */
export const getCurrentUser: RequestHandler = (_request, response) => {
  const user = response.locals.authenticatedUser as AuthUser;
  response.status(200).json({ success: true, data: { user } });
};//solicita el usuario autenticado y revalidado por authenticate, sin volver a confiar en claims del token.
/** Solicita recuperación y responde de forma uniforme; el servicio oculta si el correo existe. */
export const requestPasswordReset: RequestHandler = async (request,response,next) => {
  try { await requestReset(request.body); response.status(200).json({success:true,data:{accepted:true}}); } catch(error) { next(error); }
};
/** Confirma el token de recuperación y el cambio de clave; propaga errores controlados al middleware. */
export const resetPassword: RequestHandler = async (request,response,next) => {
  try { await completeReset(request.body); response.status(200).json({success:true,data:{reset:true}}); } catch(error) { next(error); }
};
/** Permite que una cuenta con contraseña temporal establezca su clave propia mediante el servicio. */
export const changeInitialPassword: RequestHandler = async(request,response,next)=>{
  try{await changeInitial(request.body);response.status(200).json({success:true,data:{changed:true}});}catch(error){next(error);}
};
