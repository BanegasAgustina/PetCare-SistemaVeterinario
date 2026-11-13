/**
 * ARCHIVO: clinic.routes.ts
 * UBICACIÓN: backend/src/routes/clinic.routes.ts
 * FUNCIÓN: Declara endpoints de consulta y edición clínica y administrativa de la clínica.
 * RESPONSABILIDAD: Requerir sesión y despachar cada operación mediante handlers de clínica.
 * CONEXIONES: Importa: backend/src/middlewares/auth.middleware.ts, backend/src/middlewares/permission.middleware.ts, backend/src/middlewares/auth-rate-limit.middleware.ts, backend/src/controllers/clinic.controller.ts Se utiliza desde: backend/src/routes/index.ts
 * FUNCIONAMIENTO: Aplica autenticación y no-cache, organiza subrutas de pacientes, agenda, catálogo, disponibilidad y pedidos.
 * IMPORTANCIA: Expone la API clínica que usan pantallas de admin y profesionales.
 */
/**
 * Expone /api/clinic con filtros de rol y permisos efectivos. Los repositories repiten controles dentro de las transacciones para evitar operar con privilegios desactualizados.
 */
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole,requireAnyPermission,requirePermission,requireProfessionalIdentity,patientQueryAuthorizationGuard } from '../middlewares/permission.middleware';
import { createAuthRateLimiter } from '../middlewares/auth-rate-limit.middleware';
import { clinicHandler as h } from '../controllers/clinic.controller';
// Dato clinicRouter: conserva un valor calculado o de configuración usado por este módulo.
export const clinicRouter=Router();
// clinicRouter.use: Aplica los controles compartidos a las rutas siguientes.
clinicRouter.use(authenticate);
// clinicRouter.use: Evita que se almacenen en caché las respuestas de este router.
clinicRouter.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
// clinicRouter.post('/home'): Devuelve el resumen del área Controles: roles: VETERINARIAN, GROOMER, ADMIN, SUPER_ADMIN.
clinicRouter.post('/home',requireAnyPermission('appointments.view_own','appointments.view_all','appointments.manage'),h('home'));
// clinicRouter.post('/catalog'): Consulta el catálogo de opciones disponibles Controles: roles: CLIENT, VETERINARIAN, GROOMER, ADMIN, SUPER_ADMIN.
clinicRouter.post('/catalog',h('catalog'));
// clinicRouter.post('/products/query'): Consulta o busca productos Controles: roles: VETERINARIAN, ADMIN, SUPER_ADMIN.
clinicRouter.post('/products/query',requireAnyPermission('products.view','prescriptions.create','products.update'),h('products'));
// clinicRouter.post('/slots'): Consulta horarios disponibles Controles: roles: VETERINARIAN, GROOMER, ADMIN, SUPER_ADMIN; permisos: appointments.manage, schedule.manage.
clinicRouter.post('/slots',requireAnyPermission('appointments.manage','schedule.manage'),h('slots'));
// clinicRouter.post('/appointments/:id'): Consulta un turno Controles: roles: VETERINARIAN, GROOMER, ADMIN, SUPER_ADMIN; permisos: appointments.view_own, appointments.view_all.
clinicRouter.post('/appointments/:id',requireAnyPermission('appointments.view_own','appointments.view_all'),h('appointment'));
// clinicRouter.post('/appointments'): Consulta turnos Controles: roles: VETERINARIAN, GROOMER, ADMIN, SUPER_ADMIN; permisos: appointments.view_own, appointments.view_all.
clinicRouter.post('/appointments',requireAnyPermission('appointments.view_own','appointments.view_all'),h('appointments'));
// clinicRouter.patch('/appointments/:id'): Deriva la solicitud al controlador definido en la ruta. Controles: roles: VETERINARIAN, GROOMER, ADMIN, SUPER_ADMIN; permisos: appointments.update_own, appointments.manage.
clinicRouter.patch('/appointments/:id',requireAnyPermission('appointments.update_own','appointments.manage'),h('appointment-update'));
// clinicRouter.post('/grooming/appointments/:id/record/query'): Consulta la ficha de peluquería del turno Controles: roles: GROOMER; permisos: appointments.view_own.
clinicRouter.post('/grooming/appointments/:id/record/query',requireProfessionalIdentity(false),requirePermission('appointments.view_own'),h('grooming-record'));
// clinicRouter.put('/grooming/appointments/:id/record'): Guarda la ficha de peluquería del turno Controles: roles: GROOMER; permisos: appointments.update_own.
clinicRouter.put('/grooming/appointments/:id/record',requireProfessionalIdentity(false),requirePermission('appointments.update_own'),h('grooming-record-save'));
// clinicRouter.post('/patients/query'): Consulta pacientes accesibles Controles: roles: VETERINARIAN, GROOMER, ADMIN, SUPER_ADMIN; permisos: pets.view_information, pets.view_all, appointments.view_own.
clinicRouter.post('/patients/query',patientQueryAuthorizationGuard('permission',requireAnyPermission('pets.view_information','pets.view_all','appointments.view_own')),patientQueryAuthorizationGuard('repository',h('patients')));
// clinicRouter.post('/patients/owners/query'): Busca tutores para asociarlos al paciente Controles: permisos: pets.update.
clinicRouter.post('/patients/owners/query',requirePermission('pets.update'),h('patient-owner-search'));
// clinicRouter.post('/patients'): Crea un paciente Controles: permisos: pets.update; límite de solicitudes.
clinicRouter.post('/patients',requirePermission('pets.update'),createAuthRateLimiter(),h('patient-create',201));
// clinicRouter.post('/patients/:id/invitation'): Reenvía una invitación al tutor Controles: permisos: pets.update; límite de solicitudes.
clinicRouter.post('/patients/:id/invitation',requirePermission('pets.update'),createAuthRateLimiter(),h('patient-invitation-resend'));
// clinicRouter.post('/patients/:id'): Consulta un paciente Controles: roles: VETERINARIAN, GROOMER, ADMIN, SUPER_ADMIN; permisos: pets.view_information, pets.view_all, appointments.view_own.
clinicRouter.post('/patients/:id',requireAnyPermission('pets.view_information','pets.view_all','appointments.view_own'),h('patient'));
// clinicRouter.patch('/patients/:id'): Deriva la solicitud al controlador definido en la ruta. Controles: roles: VETERINARIAN, ADMIN, SUPER_ADMIN; permisos: pets.update.
clinicRouter.patch('/patients/:id',requirePermission('pets.update'),h('patient-update'));
// clinicRouter.patch('/patients/:id/deactivate'): Deriva la solicitud al controlador definido en la ruta. Controles: roles: VETERINARIAN, GROOMER, ADMIN, SUPER_ADMIN; permisos: pets.update.
clinicRouter.patch('/patients/:id/deactivate',requirePermission('pets.update'),h('patient-deactivate'));
// clinicRouter.patch('/patients/:id/reactivate'): Deriva la solicitud al controlador definido en la ruta. Controles: roles: VETERINARIAN, GROOMER, ADMIN, SUPER_ADMIN; permisos: pets.update.
clinicRouter.patch('/patients/:id/reactivate',requirePermission('pets.update'),h('patient-reactivate'));
// clinicRouter.post('/patients/:id/records/:kind/query'): Consulta información clínica autorizada Controles: roles: VETERINARIAN, ADMIN, SUPER_ADMIN.
clinicRouter.post('/patients/:id/records/:kind/query',requirePermission('medical_records.view'),h('clinical'));
// clinicRouter.post('/patients/:id/records/:kind/page'): Consulta una página de la ficha clínica Controles: roles: VETERINARIAN, ADMIN, SUPER_ADMIN.
clinicRouter.post('/patients/:id/records/:kind/page',requirePermission('medical_records.view'),h('clinical-page'));
// clinicRouter.post('/patients/:id/records/:kind'): Crea un registro clínico Controles: roles: VETERINARIAN; límite de solicitudes.
clinicRouter.post('/patients/:id/records/:kind',requireProfessionalIdentity(true),createAuthRateLimiter(),h('clinical-create',201));
// clinicRouter.post('/clients/query'): Consulta clientes Controles: roles: VETERINARIAN, ADMIN, SUPER_ADMIN.
clinicRouter.post('/clients/query',requireAnyPermission('users.view_basic','pets.view_information'),h('clients'));
// clinicRouter.post('/clients/:id'): Consulta un cliente Controles: roles: VETERINARIAN, ADMIN, SUPER_ADMIN.
clinicRouter.post('/clients/:id',requireAnyPermission('users.view_basic','pets.view_information'),h('client'));
// clinicRouter.post('/professionals'): Deriva la solicitud al controlador definido en la ruta. Controles: roles: ADMIN, SUPER_ADMIN; permisos: professionals.manage.
clinicRouter.post('/professionals',requirePermission('professionals.manage'),h('professionals'));
// clinicRouter.put('/professionals/:id/type'): Actualiza el tipo de profesional Controles: roles: ADMIN, SUPER_ADMIN; permisos: professionals.manage.
clinicRouter.put('/professionals/:id/type',requirePermission('professionals.manage'),h('professional-type'));
// clinicRouter.put('/professionals/:id/services'): Actualiza los servicios del profesional Controles: roles: ADMIN, SUPER_ADMIN; permisos: professionals.manage.
clinicRouter.put('/professionals/:id/services',requirePermission('professionals.manage'),h('professional-services'));
// clinicRouter.post('/availability/query'): Consulta disponibilidad Controles: roles: ADMIN, SUPER_ADMIN; permisos: schedule.manage.
clinicRouter.post('/availability/query',requirePermission('schedule.manage'),h('availability'));
// clinicRouter.post('/availability'): Guarda disponibilidad Controles: roles: ADMIN, SUPER_ADMIN; permisos: schedule.manage.
clinicRouter.post('/availability',requirePermission('schedule.manage'),h('availability-save',201));
// clinicRouter.patch('/availability/:kind/:id'): Deriva la solicitud al controlador definido en la ruta. Controles: roles: ADMIN, SUPER_ADMIN; permisos: schedule.manage.
clinicRouter.patch('/availability/:kind/:id',requirePermission('schedule.manage'),h('availability-disable'));
// clinicRouter.delete('/availability/:kind/:id'): Archiva disponibilidad Controles: roles: ADMIN, SUPER_ADMIN; permisos: schedule.manage.
clinicRouter.delete('/availability/:kind/:id',requirePermission('schedule.manage'),h('availability-archive'));
// clinicRouter.post('/store-fulfillment'): Consulta la configuración de entrega de la tienda Controles: roles: ADMIN, SUPER_ADMIN; permisos: store.settings.view.
clinicRouter.post('/store-fulfillment',requirePermission('store.settings.view'),h('store-fulfillment'));
// clinicRouter.put('/store-fulfillment'): Guarda la configuración de entrega de la tienda Controles: roles: ADMIN, SUPER_ADMIN; permisos: store.settings.manage.
clinicRouter.put('/store-fulfillment',requirePermission('store.settings.manage'),h('store-fulfillment-save'));
// clinicRouter.post('/store-banners/query'): Consulta banners de la tienda Controles: roles: ADMIN, SUPER_ADMIN; permisos: store.banners.manage.
clinicRouter.post('/store-banners/query',requirePermission('store.banners.manage'),h('store-banners'));
// clinicRouter.get('/store-banners'): Consulta banners de la tienda Controles: roles: ADMIN, SUPER_ADMIN; permisos: store.banners.manage.
clinicRouter.get('/store-banners',requirePermission('store.banners.manage'),h('store-banners'));
// clinicRouter.post('/store-banners/destinations/query'): Consulta destinos de banners Controles: roles: ADMIN, SUPER_ADMIN; permisos: store.banners.manage.
clinicRouter.post('/store-banners/destinations/query',requirePermission('store.banners.manage'),h('store-banner-destinations'));
// clinicRouter.post('/promotion-products/query'): Consulta productos para promociones Controles: roles: ADMIN, SUPER_ADMIN; permisos: promotions.manage.
clinicRouter.post('/promotion-products/query',requirePermission('promotions.manage'),h('promotion-products'));
// clinicRouter.put('/store-banners/order'): Actualiza el orden de los banners Controles: roles: ADMIN, SUPER_ADMIN; permisos: store.banners.manage.
clinicRouter.put('/store-banners/order',requirePermission('store.banners.manage'),h('store-banners-order'));
// clinicRouter.post('/store-banners'): Crea un banner Controles: roles: ADMIN, SUPER_ADMIN; permisos: store.banners.manage.
clinicRouter.post('/store-banners',requirePermission('store.banners.manage'),h('store-banner-create',201));
// clinicRouter.patch('/store-banners/:id'): Deriva la solicitud al controlador definido en la ruta. Controles: roles: ADMIN, SUPER_ADMIN; permisos: store.banners.manage.
clinicRouter.patch('/store-banners/:id',requirePermission('store.banners.manage'),h('store-banner-save'));
// clinicRouter.delete('/store-banners/:id'): Elimina un banner Controles: roles: ADMIN, SUPER_ADMIN; permisos: store.banners.manage.
clinicRouter.delete('/store-banners/:id',requirePermission('store.banners.manage'),h('store-banner-delete'));
// clinicRouter.post('/store-orders'): Consulta pedidos de la tienda Controles: roles: ADMIN, SUPER_ADMIN; permisos: orders.view_all.
clinicRouter.post('/store-orders',requirePermission('orders.view_all'),h('store-orders'));
// clinicRouter.post('/store-orders/:id'): Consulta un pedido de la tienda Controles: roles: ADMIN, SUPER_ADMIN; permisos: orders.view_all.
clinicRouter.post('/store-orders/:id',requirePermission('orders.view_all'),h('store-order'));
// clinicRouter.patch('/store-orders/:id'): Deriva la solicitud al controlador definido en la ruta. Controles: roles: ADMIN, SUPER_ADMIN; permisos: orders.manage, orders.payment.manage.
clinicRouter.patch('/store-orders/:id',requireAnyPermission('orders.manage','orders.payment.manage'),h('store-order-update'));
// clinicRouter.post('/store-orders/:id/proof'): Consulta el comprobante de pago Controles: roles: SUPER_ADMIN; permisos: orders.payment.manage.
clinicRouter.post('/store-orders/:id/proof',requireRole('SUPER_ADMIN'),requirePermission('orders.payment.manage'),h('store-order-proof'));
// clinicRouter.post('/store-orders/:id/payment-review'): Revisa el pago de un pedido Controles: roles: SUPER_ADMIN; permisos: orders.payment.manage.
clinicRouter.post('/store-orders/:id/payment-review',requireRole('SUPER_ADMIN'),requirePermission('orders.payment.manage'),h('store-order-payment-review'));
// Los repositories de catálogos validan el permiso efectivo y el alcance de cada entidad.
// clinicRouter.post('/admin/:kind/query'): Consulta registros del módulo administrativo
clinicRouter.post('/admin/:kind/query',h('admin-list'));
// clinicRouter.post('/admin/:kind'): Guarda un registro administrativo Controles: límite de solicitudes.
clinicRouter.post('/admin/:kind',createAuthRateLimiter(),h('admin-save',201));
// clinicRouter.patch('/admin/:kind/:id'): Deriva la solicitud al controlador definido en la ruta.
clinicRouter.patch('/admin/:kind/:id',h('admin-save'));
// clinicRouter.delete('/admin/:kind/:id'): Elimina un registro administrativo
clinicRouter.delete('/admin/:kind/:id',h('admin-delete'));
