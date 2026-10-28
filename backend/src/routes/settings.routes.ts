// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

import { Router } from 'express';
import { publicGeneralInformation } from '../repositories/general-information.repository';

// Dato publicSettingsRouter: conserva un valor calculado o de configuración usado por este módulo.
export const publicSettingsRouter=Router();
publicSettingsRouter.get('/general-information',async(_req,res,next)=>{
  try{res.setHeader('Cache-Control','public, max-age=300');res.json({success:true,data:await publicGeneralInformation()});}
  catch(error){next(error);}
});
