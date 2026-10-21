-- Configuración vacía y zonas de entrega administrables; no inserta direcciones ni tarifas de ejemplo.
CREATE TABLE IF NOT EXISTS client_store_fulfillment_settings (
  id TINYINT UNSIGNED NOT NULL,
  pickup_enabled TINYINT(1) NOT NULL DEFAULT 0,
  pickup_address VARCHAR(300) NULL,
  pickup_hours VARCHAR(500) NULL,
  pickup_instructions VARCHAR(500) NULL,
  delivery_enabled TINYINT(1) NOT NULL DEFAULT 0,
  delivery_base_fee_cents INT UNSIGNED NOT NULL DEFAULT 0,
  free_delivery_threshold_cents INT UNSIGNED NULL,
  delivery_hours VARCHAR(500) NULL,
  delivery_days VARCHAR(100) NULL,
  delivery_information VARCHAR(500) NULL,
  updated_by BIGINT UNSIGNED NULL,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT chk_store_fulfillment_singleton CHECK (id = 1),
  CONSTRAINT chk_store_pickup_enabled CHECK (pickup_enabled IN (0,1)),
  CONSTRAINT chk_store_delivery_enabled CHECK (delivery_enabled IN (0,1)),
  CONSTRAINT chk_store_delivery_base_fee CHECK (delivery_base_fee_cents <= 100000000),
  CONSTRAINT chk_store_delivery_free_threshold CHECK (free_delivery_threshold_cents IS NULL OR free_delivery_threshold_cents <= 100000000),
  CONSTRAINT fk_store_fulfillment_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- petcare:statement
CREATE TABLE IF NOT EXISTS client_store_delivery_zones (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  postal_code_prefix VARCHAR(16) NULL,
  fee_cents INT UNSIGNED NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_store_delivery_zone_lookup (is_active, province, city, postal_code_prefix),
  CONSTRAINT chk_store_delivery_zone_active CHECK (is_active IN (0,1)),
  CONSTRAINT chk_store_delivery_zone_fee CHECK (fee_cents IS NULL OR fee_cents <= 100000000),
  CONSTRAINT fk_store_delivery_zone_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT fk_store_delivery_zone_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- petcare:statement
INSERT IGNORE INTO client_store_fulfillment_settings (id) VALUES (1);
-- petcare:statement
INSERT IGNORE INTO permissions (code, name, description, module_code, is_critical, opens_module)
SELECT 'store.settings.view', 'Configuración de entregas', 'Consultar retiro en local y zonas de envío.', module_code, 0, 1
FROM permissions WHERE code = 'products.update' LIMIT 1;
-- petcare:statement
INSERT IGNORE INTO permissions (code, name, description, module_code, is_critical, opens_module)
SELECT 'store.settings.manage', 'Administrar entregas', 'Modificar horarios de retiro, tarifas y zonas de envío.', module_code, 0, 0
FROM permissions WHERE code = 'products.update' LIMIT 1;
-- petcare:statement
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN ('store.settings.view', 'store.settings.manage')
WHERE r.code IN ('ADMIN', 'SUPER_ADMIN');
