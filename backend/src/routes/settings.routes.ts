/**
 * ARCHIVO: settings.routes.ts
 * UBICACIÓN: backend/src/routes/settings.routes.ts
 * FUNCIÓN: Expone la lectura pública de información general de la clínica.
 * RESPONSABILIDAD: Dar a la app datos de contacto y horario no sensibles.
 * CONEXIONES: Importa: backend/src/repositories/general-information.repository.ts Se utiliza desde: backend/src/routes/index.ts
 * FUNCIONAMIENTO: Declara router con consulta al repositorio general-information y sobre API estándar.
 * IMPORTANCIA: Permite mostrar datos institucionales sin sesión cuando la configuración es pública.
 */
import { Router } from 'express';
import { publicGeneralInformation } from '../repositories/general-information.repository';

// Dato publicSettingsRouter: conserva un valor calculado o de configuración usado por este módulo.
export const publicSettingsRouter=Router();
publicSettingsRouter.get('/general-information',async(_req,res,next)=>{
  try{res.setHeader('Cache-Control','public, max-age=300');res.json({success:true,data:await publicGeneralInformation()});}
  catch(error){next(error);}
});
