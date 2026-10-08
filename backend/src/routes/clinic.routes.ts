/**
 * Expone /api/clinic con filtros de rol y permisos efectivos. Los repositories repiten controles dentro de las transacciones para evitar operar con privilegios desactualizados.
 */
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole,requireAnyPermission,requirePermission } from '../middlewares/permission.middleware';
import { createAuthRateLimiter } from '../middlewares/auth-rate-limit.middleware';
import { clinicHandler as h } from '../controllers/clinic.controller';
export const clinicRouter=Router();clinicRouter.use(authenticate);clinicRouter.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
clinicRouter.get('/home',requireRole('VETERINARIAN','GROOMER','SECRETARY','ADMIN','SUPER_ADMIN'),h('home'));
clinicRouter.get('/catalog',requireRole('CLIENT','VETERINARIAN','GROOMER','SECRETARY','ADMIN','SUPER_ADMIN'),h('catalog'));
clinicRouter.get('/products',requireRole('VETERINARIAN','ADMIN','SUPER_ADMIN'),h('products'));
clinicRouter.get('/slots',requireRole('VETERINARIAN','GROOMER','SECRETARY','ADMIN','SUPER_ADMIN'),requireAnyPermission('appointments.manage','schedule.manage'),h('slots'));
clinicRouter.get('/appointments/:id',requireRole('VETERINARIAN','GROOMER','SECRETARY','ADMIN','SUPER_ADMIN'),requireAnyPermission('appointments.view_own','appointments.view_all'),h('appointment'));
clinicRouter.get('/appointments',requireRole('VETERINARIAN','GROOMER','SECRETARY','ADMIN','SUPER_ADMIN'),requireAnyPermission('appointments.view_own','appointments.view_all'),h('appointments'));
clinicRouter.patch('/appointments/:id',requireRole('VETERINARIAN','GROOMER','SECRETARY','ADMIN','SUPER_ADMIN'),requireAnyPermission('appointments.update_own','appointments.manage'),h('appointment-update'));
clinicRouter.get('/patients/:id',requireRole('VETERINARIAN','ADMIN','SUPER_ADMIN'),requirePermission('pets.view_information'),h('patient'));
clinicRouter.get('/patients',requireRole('VETERINARIAN','ADMIN','SUPER_ADMIN'),requirePermission('pets.view_information'),h('patients'));
clinicRouter.get('/patients/:id/records/:kind',requireRole('VETERINARIAN','ADMIN','SUPER_ADMIN'),h('clinical'));
clinicRouter.post('/patients/:id/records/:kind',requireRole('VETERINARIAN'),createAuthRateLimiter(),h('clinical-create',201));
clinicRouter.get('/clients',requireRole('SECRETARY','ADMIN','SUPER_ADMIN'),requirePermission('users.view_basic'),h('clients'));
clinicRouter.get('/clients/:id',requireRole('SECRETARY','ADMIN','SUPER_ADMIN'),requirePermission('users.view_basic'),requirePermission('appointments.view_all'),requirePermission('reservations.view_all'),h('client'));
clinicRouter.get('/reservations',requireRole('CLIENT','SECRETARY','ADMIN','SUPER_ADMIN'),h('reservations'));
clinicRouter.post('/reservations',requireRole('CLIENT'),createAuthRateLimiter(),h('reservation-create',201));
clinicRouter.get('/reservations/:id',requireRole('CLIENT','SECRETARY','ADMIN','SUPER_ADMIN'),h('reservation'));
clinicRouter.patch('/reservations/:id',requireRole('SECRETARY','ADMIN','SUPER_ADMIN'),requirePermission('reservations.manage'),h('reservation-update'));
clinicRouter.get('/professionals',requireRole('ADMIN','SUPER_ADMIN'),requirePermission('professionals.manage'),h('professionals'));
clinicRouter.put('/professionals/:id/type',requireRole('ADMIN','SUPER_ADMIN'),requirePermission('professionals.manage'),h('professional-type'));
clinicRouter.put('/professionals/:id/services',requireRole('ADMIN','SUPER_ADMIN'),requirePermission('professionals.manage'),h('professional-services'));
clinicRouter.get('/availability',requireRole('ADMIN','SUPER_ADMIN'),requirePermission('schedule.manage'),h('availability'));
clinicRouter.post('/availability',requireRole('ADMIN','SUPER_ADMIN'),requirePermission('schedule.manage'),h('availability-save',201));
clinicRouter.patch('/availability/:kind/:id',requireRole('ADMIN','SUPER_ADMIN'),requirePermission('schedule.manage'),h('availability-disable'));
clinicRouter.get('/admin/:kind',requireRole('ADMIN','SUPER_ADMIN'),h('admin-list'));
clinicRouter.post('/admin/:kind',requireRole('ADMIN','SUPER_ADMIN'),createAuthRateLimiter(),h('admin-save',201));
clinicRouter.patch('/admin/:kind/:id',requireRole('ADMIN','SUPER_ADMIN'),h('admin-save'));
