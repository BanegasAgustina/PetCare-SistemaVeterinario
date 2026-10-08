/** Controladores delgados: delegan validaciones, hashing y consultas a sus capas. */
import type { RequestHandler } from 'express';
import { loginUser, registerUser } from '../services/auth.service';
import type { AuthUser } from '../types/auth';
import { withRegisterDiagnostics } from '../utils/register-diagnostics';

export const register: RequestHandler = async (request, response, next) => {
  try { response.status(201).json({ success: true, data: await withRegisterDiagnostics(()=>registerUser(request.body)) }); }
  catch (error) { next(error); }
};
export const login: RequestHandler = async (request, response, next) => {
  try { response.status(200).json({ success: true, data: await loginUser(request.body) }); }
  catch (error) { next(error); }
};
/** authenticate ya releyó identidad, rol y permisos en MySQL; no devuelve claims sin revalidarlos. */
export const getCurrentUser: RequestHandler = (_request, response) => {
  const user = response.locals.authenticatedUser as AuthUser;
  response.status(200).json({ success: true, data: { user } });
};
