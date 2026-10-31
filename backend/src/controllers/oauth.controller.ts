// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

/** Adapta HTTP a OAuth; las sesiones se entregan por POST, jamás en callbacks ni deep links. */
import type { RequestHandler } from 'express';
import { oauthProvider, oauthConfigured, providers as oauthProviders } from '../config/oauth';
import * as oauth from '../services/oauth.service';
import { refreshSession } from '../services/session.service';
import { revokeRefresh } from '../repositories/session.repository';
import { AppError } from '../utils/app-error';
// Función refreshValue: concentra la lógica dentro de este módulo.
function refreshValue(body:unknown):unknown{if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>k!=='refreshToken'))throw new AppError('VALIDATION_ERROR',400,'La solicitud no es válida.');return (body as Record<string,unknown>).refreshToken;}
function correlationId(req:Parameters<RequestHandler>[0]):string|undefined{const value=req.get('x-vercel-id')||req.get('x-request-id');return value&&/^[A-Za-z0-9_.:-]{1,128}$/.test(value)?value:undefined;}
// Función start: concentra una operación reutilizable de este módulo.
export const start:RequestHandler=async(req,res,next)=>{try{res.json({success:true,data:await oauth.startOAuth(oauthProvider(req.params.provider),req.body)});}catch(e){next(e);}};
/** Publica únicamente disponibilidad booleana para el redirect solicitado; nunca devuelve credenciales. */
export const providerAvailability:RequestHandler=(req,res,next)=>{try{const returnUrl=req.query.returnUrl;if(typeof returnUrl!=='string'||returnUrl.length>2048)throw new AppError('VALIDATION_ERROR',400,'El destino OAuth no es válido.');const availability=Object.fromEntries(oauthProviders.map(provider=>[provider,oauthConfigured(provider,returnUrl)]));res.json({success:true,data:{providers:availability}});}catch(e){next(e);}};
// Función link: concentra una operación reutilizable de este módulo.
export const link:RequestHandler=async(req,res,next)=>{try{res.json({success:true,data:await oauth.startOAuth(oauthProvider(req.params.provider),req.body,res.locals.authenticatedUser.id,res.locals.authenticatedFamily)});}catch(e){next(e);}};
// Función callback: concentra una operación reutilizable de este módulo.
export const callback:RequestHandler=async(req,res,next)=>{const provider=req.params.provider,requestId=correlationId(req);try{res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cross-Origin-Opener-Policy','same-origin-allow-popups');res.redirect(303,await oauth.callbackOAuth(oauthProvider(provider),req.query.state,req.query.code,req.query.error,requestId));}catch(e){console.warn(JSON.stringify({event:'oauth.callback_rejected',provider,...(requestId?{correlationId:requestId}:{}),code:e instanceof AppError?e.code:'INTERNAL_ERROR'}));next(e);}};
// Función exchange: concentra una operación reutilizable de este módulo.
export const exchange:RequestHandler=async(req,res,next)=>{try{res.json({success:true,data:await oauth.exchangeOAuth(req.body)});}catch(e){next(e);}};
// Función registerOAuth: concentra una operación reutilizable de este módulo.
export const registerOAuth:RequestHandler=async(req,res,next)=>{try{res.status(201).json({success:true,data:await oauth.registerOAuth(req.body)});}catch(e){next(e);}};
// Función refresh: concentra una operación reutilizable de este módulo.
export const refresh:RequestHandler=async(req,res,next)=>{try{res.json({success:true,data:await refreshSession(refreshValue(req.body))});}catch(e){next(e);}};
// Función logout: concentra una operación reutilizable de este módulo.
export const logout:RequestHandler=async(req,res,next)=>{try{await revokeRefresh(refreshValue(req.body));res.json({success:true,data:{revoked:true}});}catch(e){next(e);}};
