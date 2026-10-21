-- Extiende pedidos existentes con snapshots de checkout; no genera pedidos ni modifica los históricos.
ALTER TABLE client_orders
  ADD COLUMN IF NOT EXISTS is_store_order TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS store_order_status VARCHAR(24) NULL,
  ADD COLUMN IF NOT EXISTS store_payment_status VARCHAR(24) NOT NULL DEFAULT 'NOT_APPLICABLE',
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(24) NULL,
  ADD COLUMN IF NOT EXISTS fulfillment_method VARCHAR(16) NULL,
  ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(24) NOT NULL DEFAULT 'NOT_APPLICABLE',
  ADD COLUMN IF NOT EXISTS subtotal_cents BIGINT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS delivery_fee_cents INT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(160) NULL,
  ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(40) NULL,
  ADD COLUMN IF NOT EXISTS delivery_street VARCHAR(160) NULL,
  ADD COLUMN IF NOT EXISTS delivery_number VARCHAR(30) NULL,
  ADD COLUMN IF NOT EXISTS delivery_unit VARCHAR(80) NULL,
  ADD COLUMN IF NOT EXISTS delivery_city VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS delivery_province VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS delivery_postal_code VARCHAR(16) NULL,
  ADD COLUMN IF NOT EXISTS delivery_reference VARCHAR(500) NULL,
  ADD INDEX IF NOT EXISTS idx_client_store_orders (is_store_order,store_order_status,created_at);
-- petcare:statement
ALTER TABLE client_order_status_history
  ADD COLUMN IF NOT EXISTS state_type VARCHAR(20) NOT NULL DEFAULT 'ORDER';
-- petcare:statement
CREATE TABLE IF NOT EXISTS client_delivery_addresses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_id BIGINT UNSIGNED NOT NULL,
  label VARCHAR(80) NOT NULL DEFAULT 'Casa',
  recipient_name VARCHAR(160) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  street VARCHAR(160) NOT NULL,
  street_number VARCHAR(30) NOT NULL,
  unit VARCHAR(80) NULL,
  city VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  postal_code VARCHAR(16) NOT NULL,
  reference VARCHAR(500) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_client_delivery_address_owner (owner_id,is_active,updated_at),
  CONSTRAINT fk_client_delivery_address_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- petcare:statement
INSERT IGNORE INTO permissions (code, name, description, module_code, is_critical, opens_module)
SELECT 'orders.view_all', 'Consultar pedidos de tienda', 'Consultar compras de tienda y sus datos operativos.', module_code, 0, 1
FROM permissions WHERE code = 'products.update' LIMIT 1;
-- petcare:statement
INSERT IGNORE INTO permissions (code, name, description, module_code, is_critical, opens_module)
SELECT 'orders.manage', 'Gestionar preparación y entrega', 'Avanzar estados operativos de pedidos de tienda.', module_code, 0, 0
FROM permissions WHERE code = 'products.update' LIMIT 1;
-- petcare:statement
INSERT IGNORE INTO permissions (code, name, description, module_code, is_critical, opens_module)
SELECT 'orders.payment.manage', 'Registrar pagos recibidos', 'Registrar manualmente pagos autorizados de pedidos de tienda.', module_code, 0, 0
FROM permissions WHERE code = 'products.update' LIMIT 1;
-- petcare:statement
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN ('orders.view_all', 'orders.manage', 'orders.payment.manage')
WHERE r.code IN ('ADMIN', 'SUPER_ADMIN');
