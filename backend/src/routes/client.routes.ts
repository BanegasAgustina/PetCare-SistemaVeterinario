/**
 * ARCHIVO: client.routes.ts
 * UBICACIÓN: backend/src/routes/client.routes.ts
 * FUNCIÓN: Declara endpoints de mascotas, turnos, tienda, carrito, pedidos y perfil de cliente.
 * RESPONSABILIDAD: Proteger operaciones del área cliente y asociarlas al controller correspondiente.
 * CONEXIONES: Importa: backend/src/middlewares/auth.middleware.ts, backend/src/middlewares/permission.middleware.ts, backend/src/middlewares/auth-rate-limit.middleware.ts, backend/src/controllers/client.controller.ts, backend/src/routes/notification.routes.ts Se utiliza desde: backend/src/routes/index.ts
 * FUNCIONAMIENTO: Aplica autenticación, permisos de acceso personal, límites de carga y monta rutas de notificaciones.
 * IMPORTANCIA: Mapea el dominio cliente bajo el prefijo /client.
 */
/**
 * Expone /api/client para CLIENT autenticados. El controller deriva ownership del JWT y el servicio consulta MySQL; estas rutas no deben aceptar un owner enviado por la app.
 */
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePersonalAccess } from '../middlewares/permission.middleware';
import { createAuthRateLimiter } from '../middlewares/auth-rate-limit.middleware';
import { clientHandler as handle } from '../controllers/client.controller';
import { legacyClientNotificationRouter } from './notification.routes';
// Dato clientRouter: conserva un valor calculado o de configuración usado por este módulo.
export const clientRouter=Router();
// clientRouter.use: Aplica los controles compartidos a las rutas siguientes.
clientRouter.use(authenticate,requirePersonalAccess);
// clientRouter.use: Evita que se almacenen en caché las respuestas de este router.
clientRouter.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
// clientRouter.use('/notifications'): Aplica los controles compartidos a las rutas siguientes.
clientRouter.use('/notifications',legacyClientNotificationRouter);
// clientRouter.post('/home'): Devuelve el resumen del área
clientRouter.post('/home',handle('home'));
// clientRouter.post('/pets/catalog'): Consulta el catálogo de mascotas
clientRouter.post('/pets/catalog',handle('pet-catalog'));
// clientRouter.post('/pets/query'): Consulta mascotas propias
clientRouter.post('/pets/query',handle('pets'));
// clientRouter.post('/pets'): Crea una mascota
clientRouter.post('/pets',handle('create-pet',201));
// clientRouter.post('/pets/:id'): Consulta una mascota
clientRouter.post('/pets/:id',handle('pet'));
// clientRouter.put('/pets/:id'): Actualiza una mascota
clientRouter.put('/pets/:id',handle('update-pet'));
// clientRouter.patch('/pets/:id/deactivate'): Deriva la solicitud al controlador definido en la ruta.
clientRouter.patch('/pets/:id/deactivate',handle('deactivate-pet'));
// clientRouter.patch('/pets/:id/reactivate'): Deriva la solicitud al controlador definido en la ruta.
clientRouter.patch('/pets/:id/reactivate',handle('reactivate-pet'));
// clientRouter.post('/appointments/catalog'): Consulta el catálogo de turnos
clientRouter.post('/appointments/catalog',handle('appointment-catalog'));
// clientRouter.post('/appointments/slots'): Consulta horarios disponibles
clientRouter.post('/appointments/slots',handle('slots'));
// clientRouter.post('/appointments/query'): Consulta los turnos propios
clientRouter.post('/appointments/query',handle('appointments'));
// clientRouter.post('/appointments/:id'): Consulta un turno
clientRouter.post('/appointments/:id',handle('appointment'));
// clientRouter.patch('/appointments/:id/cancel'): Deriva la solicitud al controlador definido en la ruta.
clientRouter.patch('/appointments/:id/cancel',handle('cancel-appointment'));
// clientRouter.post('/appointments'): Crea una solicitud de turno
clientRouter.post('/appointments',handle('create-appointment',201));
// clientRouter.post('/clinical/:kind'): Consulta información clínica autorizada
clientRouter.post('/clinical/:kind',handle('clinical'));
// clientRouter.post('/store/categories'): Consulta categorías de productos
clientRouter.post('/store/categories',handle('categories'));
// clientRouter.post('/store/fulfillment'): Consulta opciones de entrega y retiro
clientRouter.post('/store/fulfillment',handle('fulfillment'));
// clientRouter.post('/store/promotions'): Consulta promociones vigentes
clientRouter.post('/store/promotions',handle('promotions'));
// clientRouter.post('/store/banners'): Consulta banners disponibles
clientRouter.post('/store/banners',handle('banners'));
// clientRouter.post('/store/delivery-quote'): Cotiza el envío
clientRouter.post('/store/delivery-quote',handle('delivery-quote'));
// clientRouter.post('/store/addresses/query'): Consulta direcciones propias
clientRouter.post('/store/addresses/query',handle('delivery-addresses'));
// clientRouter.post('/store/addresses'): Guarda una dirección
clientRouter.post('/store/addresses',handle('delivery-address-save',201));
// clientRouter.patch('/store/addresses/:id'): Deriva la solicitud al controlador definido en la ruta.
clientRouter.patch('/store/addresses/:id',handle('delivery-address-update'));
// clientRouter.post('/store/products'): Consulta o busca productos
clientRouter.post('/store/products',handle('products'));
// clientRouter.post('/store/products/:id'): Consulta un producto
clientRouter.post('/store/products/:id',handle('product'));
// clientRouter.post('/cart'): Consulta el carrito propio
clientRouter.post('/cart',handle('cart'));
// clientRouter.put('/cart/:id'): Actualiza la cantidad de un producto del carrito
clientRouter.put('/cart/:id',handle('cart-update'));
// clientRouter.post('/orders/query'): Consulta pedidos propios
clientRouter.post('/orders/query',handle('orders'));
// clientRouter.post('/orders'): Crea un pedido desde el checkout
clientRouter.post('/orders',handle('checkout',201));
// clientRouter.post('/orders/bank-transfer'): Crea un pedido para pago por transferencia Controles: límite de solicitudes.
clientRouter.post('/orders/bank-transfer',createAuthRateLimiter(8),handle('bank-transfer-checkout',201));
// clientRouter.post('/orders/:id/payment-intents'): Renueva la intención de pago Controles: límite de solicitudes.
clientRouter.post('/orders/:id/payment-intents',createAuthRateLimiter(8),handle('payment-intent-renew',201));
// clientRouter.post('/payment-intents/:id/proof'): Presenta un comprobante de pago Controles: límite de solicitudes.
clientRouter.post('/payment-intents/:id/proof',createAuthRateLimiter(8),handle('payment-proof',201));
// clientRouter.post('/orders/:id'): Consulta un pedido propio
clientRouter.post('/orders/:id',handle('order'));
// clientRouter.patch('/profile'): Deriva la solicitud al controlador definido en la ruta.
clientRouter.patch('/profile',handle('profile-update'));
// clientRouter.put('/profile/password'): Cambia la contraseña propia Controles: límite de solicitudes.
clientRouter.put('/profile/password',createAuthRateLimiter(),handle('password-update'));
