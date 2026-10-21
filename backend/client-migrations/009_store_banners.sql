-- Banners independientes de promociones. Los destinos se validan en la API y las imágenes viven en almacenamiento persistente.
CREATE TABLE IF NOT EXISTS client_store_banners (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(160) NOT NULL,
  subtitle VARCHAR(250) NULL,
  description TEXT NULL,
  mobile_image_url VARCHAR(2048) NOT NULL,
  desktop_image_url VARCHAR(2048) NULL,
  background_color CHAR(7) NOT NULL DEFAULT '#176B52',
  text_color CHAR(7) NOT NULL DEFAULT '#FFFFFF',
  content_alignment ENUM('LEFT','CENTER','RIGHT') NOT NULL DEFAULT 'LEFT',
  dark_overlay TINYINT(1) NOT NULL DEFAULT 0,
  destination_type ENUM('PRODUCT','CATEGORY','PROMOTION','PRODUCT_LIST','INFO') NOT NULL DEFAULT 'INFO',
  destination_id BIGINT UNSIGNED NULL,
  cta_text VARCHAR(40) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_store_banners_publication (is_active,starts_at,ends_at,sort_order,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- petcare:statement
INSERT IGNORE INTO permissions (code,name,description,module_code,is_critical,opens_module)
SELECT 'store.banners.manage','Gestionar banners de tienda','Crear, publicar, ordenar y retirar banners del slider.',module_code,0,1
FROM permissions WHERE code='store.settings.manage' LIMIT 1;
-- petcare:statement
INSERT IGNORE INTO role_permissions (role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code='store.banners.manage' WHERE r.code IN ('ADMIN','SUPER_ADMIN');
