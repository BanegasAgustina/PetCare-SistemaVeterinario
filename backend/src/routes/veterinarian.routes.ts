/** Solo SUPER_ADMIN puede gestionar profesionales; el rol se verifica además del permiso crítico. */
import { Router, type RequestHandler, type Request, type Response } from 'express';
import type { RowDataPacket } from 'mysql2/promise';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole,requirePermission } from '../middlewares/permission.middleware';
import { createAuthRateLimiter } from '../middlewares/auth-rate-limit.middleware';
import { vetCatalog,vetList,vetDetail,createVet,updateVet,updateVetStatus,updateVetPermissions } from '../repositories/veterinarian.repository';
import { identifier,validateVet,objectBody,permissionOverrides,textField } from '../validators/veterinarian.validator';
import { acceptInvitation,renewInvitation } from '../services/invitation.service';
import { databasePool } from '../config/database';
import { AppError } from '../utils/app-error';
import { runDatabaseOperation } from '../utils/database-error';
import type { AuthUser } from '../types/auth';

function handler(operation: (request: Request,response: Response) => Promise<unknown>,status=200): RequestHandler {
  return async (request,response,next) => {
    try { response.status(status).json({ success:true,data:await operation(request,response) }); }
    catch(error) { next(error); }
  };
}
export const veterinarianAdminRouter = Router();
veterinarianAdminRouter.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
veterinarianAdminRouter.use(authenticate,requireRole('SUPER_ADMIN'),requirePermission('veterinarians.manage'));
veterinarianAdminRouter.get('/catalog',handler(async ()=>vetCatalog()));
veterinarianAdminRouter.get('/',handler(async req=>vetList(req.query)));
veterinarianAdminRouter.get('/:id',handler(async req=>vetDetail(identifier(req.params.id))));
veterinarianAdminRouter.post('/',requirePermission('permissions.manage'),createAuthRateLimiter(),handler(async req=>createVet(validateVet(req.body)),201));
veterinarianAdminRouter.put('/:id',requirePermission('permissions.manage'),handler(async req=>updateVet(identifier(req.params.id),validateVet(req.body))));
veterinarianAdminRouter.put('/:id/permissions',requirePermission('permissions.manage'),handler(async req=> {
  const body=objectBody(req.body,['overrides']);return updateVetPermissions(identifier(req.params.id),permissionOverrides(body.overrides));
}));
veterinarianAdminRouter.patch('/:id/status',handler(async req=> {
  const body=objectBody(req.body,['isActive']);
  if (typeof body.isActive!=='boolean') throw new AppError('VALIDATION_ERROR',400,'Indicá el estado de la cuenta.');
  return updateVetStatus(identifier(req.params.id),body.isActive);
}));
veterinarianAdminRouter.post('/:id/invitation',createAuthRateLimiter(),handler(async req=>renewInvitation(identifier(req.params.id))));

export const invitationRouter = Router();
invitationRouter.post('/accept',createAuthRateLimiter(),handler(async req=> { await acceptInvitation(req.body);return { accepted:true }; }));

export const specialtiesAdminRouter = Router();
specialtiesAdminRouter.use(authenticate,requireRole('SUPER_ADMIN'),requirePermission('specialties.manage'));
specialtiesAdminRouter.get('/',handler(async ()=> (await vetCatalog()).specialties));
specialtiesAdminRouter.post('/',handler(async req=>runDatabaseOperation(async ()=> {
  const body=objectBody(req.body,['name']); const name=textField(body.name,'La especialidad',100);
  await databasePool.execute('INSERT INTO specialties (name) VALUES (?)',[name]);return { name };
}),201));
specialtiesAdminRouter.put('/:id',handler(async req=>runDatabaseOperation(async ()=> {
  const body=objectBody(req.body,['name']); const name=textField(body.name,'La especialidad',100);
  const id=identifier(req.params.id);
  const [rows]=await databasePool.execute<RowDataPacket[]>('SELECT id FROM specialties WHERE id=?',[id]);
  if (!rows.length) throw new AppError('NOT_FOUND',404,'Especialidad no encontrada.');
  await databasePool.execute('UPDATE specialties SET name=? WHERE id=?',[name,id]);return { id,name };
})));

/** Un solo panel. El backend entrega módulos accesibles del catálogo según permisos efectivos. */
export const veterinarianPanelRouter = Router();
veterinarianPanelRouter.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
veterinarianPanelRouter.use(authenticate,requireRole('VETERINARIAN'));
async function accessibleModules(user: AuthUser) {
  return runDatabaseOperation(async ()=> {
    const codes=user.permissions ?? [];
    if (!codes.length) return [];
    const [rows]=await databasePool.execute<RowDataPacket[]>(`SELECT DISTINCT m.code,m.name,m.sort_order FROM permission_modules m
      JOIN permissions p ON p.module_code=m.code WHERE p.is_critical=0 AND p.opens_module=1 AND p.code IN (${codes.map(()=>'?').join(',')}) ORDER BY m.sort_order`,codes);
    return rows.map(row=>({ code:row.code as string,name:row.name as string }));
  });
}
veterinarianPanelRouter.get('/home',handler(async (_req,res)=> {
  const user=res.locals.authenticatedUser as AuthUser;
  // Clínica pendiente: no devolver valores que aparenten una consulta sin resultados.
  return { veterinarian:user.veterinarian,modules:await accessibleModules(user),
    clinicalAvailable:false };
}));
veterinarianPanelRouter.get('/modules/:module',handler(async (req,res)=> {
  const modules=await accessibleModules(res.locals.authenticatedUser as AuthUser);
  const module=modules.find(item=>item.code===req.params.module);
  if (!module) throw new AppError('FORBIDDEN',403,'No tenés permiso para acceder a este módulo.');
  return { module,clinicalAvailable:false,message:'El módulo clínico está preparado para una próxima etapa.' };
}));
