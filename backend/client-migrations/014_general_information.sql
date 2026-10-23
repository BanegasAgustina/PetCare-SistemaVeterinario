-- Configuración institucional pública administrable desde el panel.
CREATE TABLE IF NOT EXISTS client_general_information (
  id TINYINT UNSIGNED NOT NULL,
  clinic_name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  logo_url VARCHAR(2048) NULL,
  welcome_message VARCHAR(500) NULL,
  public_phone VARCHAR(40) NULL,
  whatsapp VARCHAR(40) NULL,
  public_email VARCHAR(254) NULL,
  street_address VARCHAR(200) NULL,
  city VARCHAR(100) NULL,
  province VARCHAR(100) NULL,
  map_url VARCHAR(2048) NULL,
  opening_hours_json LONGTEXT NOT NULL,
  instagram_url VARCHAR(2048) NULL,
  facebook_url VARCHAR(2048) NULL,
  x_url VARCHAR(2048) NULL,
  website_url VARCHAR(2048) NULL,
  updated_by BIGINT UNSIGNED NULL,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT chk_client_general_information_singleton CHECK (id=1),
  CONSTRAINT fk_client_general_information_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- petcare:statement
INSERT IGNORE INTO permissions (code,name,description,module_code,is_critical,opens_module)
SELECT 'settings.general.manage','Administrar información de PetCare','Editar información institucional, contacto, horarios y redes sociales públicas.',module_code,0,1
FROM permissions WHERE code='users.manage' LIMIT 1;
-- petcare:statement
INSERT IGNORE INTO role_permissions (role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code='settings.general.manage' WHERE r.code='SUPER_ADMIN';
