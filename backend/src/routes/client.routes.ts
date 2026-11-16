/**
 * Define las rutas del área del cliente: mascotas, turnos, tienda, carrito, pedidos y perfil.
 * Protege el acceso para que cada cliente opere con sus propios datos.
 * 
 * 
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
// Router de las operaciones privadas del área cliente; routes/index.ts lo monta bajo /api/client.
export const clientRouter=Router();
// Todas las rutas siguientes requieren token válido y pasan el control de acceso personal.
clientRouter.use(authenticate,requirePersonalAccess);
// Evita que respuestas con datos privados de la cuenta queden guardadas en caché.
clientRouter.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
// Monta aquí las notificaciones antiguas bajo /api/client/notifications.
clientRouter.use('/notifications',legacyClientNotificationRouter);
// POST /api/client/home: obtiene el resumen del área personal del cliente autenticado.
clientRouter.post('/home',handle('home'));
// POST /api/client/pets/catalog: obtiene opciones de catálogo usadas al registrar o editar una mascota.
clientRouter.post('/pets/catalog',handle('pet-catalog'));
// POST /api/client/pets/query: lista las mascotas asociadas a la cuenta autenticada.
clientRouter.post('/pets/query',handle('pets'));
// POST /api/client/pets: crea una mascota para el cliente autenticado; responde 201 al crearla.
clientRouter.post('/pets',handle('create-pet',201));
// POST /api/client/pets/:id: consulta una mascota propia identificada por ID.
clientRouter.post('/pets/:id',handle('pet'));
// PUT /api/client/pets/:id: actualiza los datos de una mascota propia.
clientRouter.put('/pets/:id',handle('update-pet'));
// PATCH /api/client/pets/:id/deactivate: da de baja la mascota propia sin eliminar su historial.
clientRouter.patch('/pets/:id/deactivate',handle('deactivate-pet'));
// PATCH /api/client/pets/:id/reactivate: reactiva una mascota propia que estaba dada de baja.
clientRouter.patch('/pets/:id/reactivate',handle('reactivate-pet'));
// POST /api/client/appointments/catalog: obtiene opciones y datos necesarios para solicitar turnos.
clientRouter.post('/appointments/catalog',handle('appointment-catalog'));
// POST /api/client/appointments/slots: busca horarios disponibles según los filtros enviados.
clientRouter.post('/appointments/slots',handle('slots'));
// POST /api/client/appointments/query: lista los turnos asociados al cliente autenticado.
clientRouter.post('/appointments/query',handle('appointments'));
// POST /api/client/appointments/:id: consulta el detalle de un turno propio.
clientRouter.post('/appointments/:id',handle('appointment'));
// PATCH /api/client/appointments/:id/cancel: solicita cancelar un turno propio.
clientRouter.patch('/appointments/:id/cancel',handle('cancel-appointment'));
// POST /api/client/appointments: solicita un turno para una mascota propia; responde 201.
clientRouter.post('/appointments',handle('create-appointment',201));
// POST /api/client/clinical/:kind: consulta la sección clínica propia indicada por kind.
clientRouter.post('/clinical/:kind',handle('clinical'));
// POST /api/client/store/categories: consulta categorías visibles de la tienda.
clientRouter.post('/store/categories',handle('categories'));
// POST /api/client/store/fulfillment: consulta métodos de entrega y retiro disponibles.
clientRouter.post('/store/fulfillment',handle('fulfillment'));
// POST /api/client/store/promotions: consulta las promociones vigentes para la tienda.
clientRouter.post('/store/promotions',handle('promotions'));
// POST /api/client/store/banners: consulta banners visibles para el cliente.
clientRouter.post('/store/banners',handle('banners'));
// POST /api/client/store/delivery-quote: calcula una cotización de envío con los datos recibidos.
clientRouter.post('/store/delivery-quote',handle('delivery-quote'));
// POST /api/client/store/addresses/query: lista las direcciones guardadas por el cliente.
clientRouter.post('/store/addresses/query',handle('delivery-addresses'));
// POST /api/client/store/addresses: guarda una dirección de entrega asociada al cliente; responde 201.
clientRouter.post('/store/addresses',handle('delivery-address-save',201));
// PATCH /api/client/store/addresses/:id: modifica una dirección propia identificada por ID.
clientRouter.patch('/store/addresses/:id',handle('delivery-address-update'));
// POST /api/client/store/products: busca o lista productos disponibles según los filtros recibidos.
clientRouter.post('/store/products',handle('products'));
// POST /api/client/store/products/:id: consulta el detalle de un producto.
clientRouter.post('/store/products/:id',handle('product'));
// POST /api/client/cart: consulta el carrito del cliente autenticado.
clientRouter.post('/cart',handle('cart'));
// PUT /api/client/cart/:id: cambia la cantidad de un producto del carrito propio.
clientRouter.put('/cart/:id',handle('cart-update'));
// POST /api/client/orders/query: lista los pedidos del cliente autenticado.
clientRouter.post('/orders/query',handle('orders'));
// POST /api/client/orders: crea un pedido desde el checkout; responde 201.
clientRouter.post('/orders',handle('checkout',201));
// POST /api/client/orders/bank-transfer: crea un pedido para transferencia; limita intentos y responde 201.
clientRouter.post('/orders/bank-transfer',createAuthRateLimiter(8),handle('bank-transfer-checkout',201));
// POST /api/client/orders/:id/payment-intents: renueva la intención de pago de un pedido propio; limita intentos y responde 201.
clientRouter.post('/orders/:id/payment-intents',createAuthRateLimiter(8),handle('payment-intent-renew',201));
// POST /api/client/payment-intents/:id/proof: presenta comprobante para una intención propia; limita intentos y responde 201.
clientRouter.post('/payment-intents/:id/proof',createAuthRateLimiter(8),handle('payment-proof',201));
// POST /api/client/orders/:id: consulta el detalle de un pedido propio.
clientRouter.post('/orders/:id',handle('order'));
// PATCH /api/client/profile: actualiza nombre, apellido y teléfono del cliente autenticado.
// client.service.ts valida los campos; client.repository.ts modifica esas columnas en users con el ID de la sesión.
clientRouter.patch('/profile',handle('profile-update'));
// PUT /api/client/profile/password: valida la contraseña actual y guarda la nueva; limita intentos.
clientRouter.put('/profile/password',createAuthRateLimiter(),handle('password-update'));
