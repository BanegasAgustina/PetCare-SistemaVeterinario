-- PetCare: catálogo RBAC personal.
-- PREPARADO, NO EJECUTADO. No asigna permisos a roles ni usuarios.
-- Ejecutar únicamente después del respaldo y de aprobar el conteo de usuarios afectados.
-- Preflight manual: detenerse si cualquiera de los ocho códigos ya existe con otro
-- módulo/metadata, o si el módulo personal ya existe con una definición incompatible.

SELECT code, name, sort_order
FROM permission_modules
WHERE code = 'personal';

SELECT code, name, description, module_code, is_critical, opens_module
FROM permissions
WHERE code IN (
  'personal.pets.view',
  'personal.pets.manage',
  'personal.appointments.view',
  'personal.appointments.create',
  'personal.store.view',
  'personal.store.purchase',
  'personal.orders.view',
  'personal.profile.manage'
)
ORDER BY code;

-- Agrega el módulo, conservando nombre/orden si ya existe.
SET @personal_sort_order = (SELECT COALESCE(MAX(sort_order), 0) + 10 FROM permission_modules);
INSERT INTO permission_modules (code, name, sort_order)
VALUES ('personal', 'Funciones personales', @personal_sort_order)
ON DUPLICATE KEY UPDATE code = code;

-- Todas son no críticas. opens_module=0 porque estas capacidades se exponen en
-- las rutas personales de /client, no como módulos operativos /vet/modules/:module.
INSERT INTO permissions (code, name, description, module_code, is_critical, opens_module)
VALUES
  ('personal.pets.view', 'Ver mascotas propias', 'Consultar las mascotas vinculadas a la cuenta personal.', 'personal', 0, 0),
  ('personal.pets.manage', 'Gestionar mascotas propias', 'Crear, editar y administrar las mascotas vinculadas a la cuenta personal.', 'personal', 0, 0),
  ('personal.appointments.view', 'Ver turnos propios', 'Consultar turnos asociados a mascotas de la cuenta personal.', 'personal', 0, 0),
  ('personal.appointments.create', 'Solicitar turnos', 'Consultar disponibilidad y solicitar turnos para mascotas propias.', 'personal', 0, 0),
  ('personal.store.view', 'Ver tienda', 'Consultar productos y promociones de la tienda personal.', 'personal', 0, 0),
  ('personal.store.purchase', 'Realizar compras', 'Gestionar carrito, entrega, checkout y comprobantes de compras propias.', 'personal', 0, 0),
  ('personal.orders.view', 'Ver pedidos propios', 'Consultar pedidos creados por la cuenta personal.', 'personal', 0, 0),
  ('personal.profile.manage', 'Gestionar perfil personal', 'Actualizar datos y contraseña de la cuenta personal.', 'personal', 0, 0)
ON DUPLICATE KEY UPDATE code = code;

-- Postflight: deben aparecer las ocho filas, todas en personal y con flags 0/0.
SELECT code, name, module_code, is_critical, opens_module
FROM permissions
WHERE code IN (
  'personal.pets.view',
  'personal.pets.manage',
  'personal.appointments.view',
  'personal.appointments.create',
  'personal.store.view',
  'personal.store.purchase',
  'personal.orders.view',
  'personal.profile.manage'
)
ORDER BY code;

-- No se incluye rollback destructivo: eliminar permisos con grants u overrides
-- podría revocar accesos ya aprobados. Para deshacer la capa de aplicación,
-- revertir el código y conservar estas filas hasta revisar referencias.
