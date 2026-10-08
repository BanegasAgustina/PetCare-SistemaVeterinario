/** Adapta HTTP a OAuth; las sesiones se entregan por POST, jamás en callbacks ni deep links. */
import type { RequestHandler } from 'express';
import { oauthProvider } from '../config/oauth';
import * as oauth from '../services/oauth.service';
import { refreshSession } from '../services/session.service';
import { revokeRefresh } from '../repositories/session.repository';
import { AppError } from '../utils/app-error';
function refreshValue(body:unknown):unknown{if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>k!=='refreshToken'))throw new AppError('VALIDATION_ERROR',400,'La solicitud no es válida.');return (body as Record<string,unknown>).refreshToken;}
export const start:RequestHandler=async(req,res,next)=>{try{res.json({success:true,data:await oauth.startOAuth(oauthProvider(req.params.provider),req.body)});}catch(e){next(e);}};
export const link:RequestHandler=async(req,res,next)=>{try{res.json({success:true,data:await oauth.startOAuth(oauthProvider(req.params.provider),req.body,res.locals.authenticatedUser.id,res.locals.authenticatedFamily)});}catch(e){next(e);}};
export const callback:RequestHandler=async(req,res,next)=>{try{res.setHeader('Referrer-Policy','no-referrer');res.redirect(303,await oauth.callbackOAuth(oauthProvider(req.params.provider),req.query.state,req.query.code,req.query.error));}catch(e){next(e);}};
export const exchange:RequestHandler=async(req,res,next)=>{try{res.json({success:true,data:await oauth.exchangeOAuth(req.body)});}catch(e){next(e);}};
export const registerOAuth:RequestHandler=async(req,res,next)=>{try{res.status(201).json({success:true,data:await oauth.registerOAuth(req.body)});}catch(e){next(e);}};
export const refresh:RequestHandler=async(req,res,next)=>{try{res.json({success:true,data:await refreshSession(refreshValue(req.body))});}catch(e){next(e);}};
export const logout:RequestHandler=async(req,res,next)=>{try{await revokeRefresh(refreshValue(req.body));res.json({success:true,data:{revoked:true}});}catch(e){next(e);}};
