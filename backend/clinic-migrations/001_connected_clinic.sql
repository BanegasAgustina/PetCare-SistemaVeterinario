-- PetCare: ampliación de estructuras existentes, sin datos de demostración.
-- Ejecutar UNA VEZ sobre el esquema auditado. No modifica migraciones históricas.
INSERT INTO roles (code,name) SELECT 'SECRETARY','Secretaría' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code='SECRETARY');
INSERT INTO roles (code,name) SELECT 'GROOMER','Peluquería' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code='GROOMER');
CREATE TABLE professional_types (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE,
 role_id SMALLINT UNSIGNED NOT NULL, is_clinical BOOLEAN NOT NULL DEFAULT FALSE,
 FOREIGN KEY (role_id) REFERENCES roles(id)
);
INSERT INTO professional_types(name,role_id,is_clinical) SELECT name,id,code='VETERINARIAN' FROM roles WHERE code IN ('VETERINARIAN','GROOMER');
ALTER TABLE roles ADD COLUMN professional_type_id INT UNSIGNED NULL, ADD FOREIGN KEY(professional_type_id) REFERENCES professional_types(id);
UPDATE roles r JOIN professional_types pt ON pt.role_id=r.id SET r.professional_type_id=pt.id;
ALTER TABLE users ADD COLUMN professional_type_id INT UNSIGNED NULL, ADD FOREIGN KEY(professional_type_id) REFERENCES professional_types(id);
UPDATE users u JOIN roles r ON r.id=u.role_id SET u.professional_type_id=r.professional_type_id;
ALTER TABLE specialties ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE client_services ADD COLUMN professional_type_id INT UNSIGNED NULL,
 ADD COLUMN duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 30,
 ADD COLUMN price_cents INT UNSIGNED NULL, ADD COLUMN requirements TEXT NULL,
 ADD FOREIGN KEY (professional_type_id) REFERENCES professional_types(id),
 ADD CHECK(duration_minutes BETWEEN 5 AND 480);
UPDATE client_services SET professional_type_id=(SELECT pt.id FROM professional_types pt JOIN roles r ON r.id=pt.role_id WHERE r.code='VETERINARIAN');
CREATE TABLE professional_services (
 user_id BIGINT UNSIGNED NOT NULL, service_id BIGINT UNSIGNED NOT NULL,
 PRIMARY KEY(user_id,service_id), FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(service_id) REFERENCES client_services(id)
);
-- Preserva servicios ofrecidos anteriormente mediante slots reales.
INSERT INTO professional_services(user_id,service_id) SELECT DISTINCT v.user_id,s.service_id FROM client_appointment_slots s JOIN veterinarians v ON v.id=s.veterinarian_id;
ALTER TABLE client_appointment_slots MODIFY veterinarian_id BIGINT UNSIGNED NULL,
 ADD COLUMN professional_user_id BIGINT UNSIGNED NULL,
 ADD COLUMN professional_type_id INT UNSIGNED NULL,
 ADD COLUMN active_start DATETIME GENERATED ALWAYS AS (CASE WHEN is_active=1 THEN starts_at ELSE NULL END) STORED,
 ADD FOREIGN KEY(professional_user_id) REFERENCES users(id),
 ADD FOREIGN KEY(professional_type_id) REFERENCES professional_types(id),
 ADD UNIQUE KEY professional_start(professional_user_id,active_start),
 ADD KEY veterinarian_history(veterinarian_id), DROP INDEX veterinarian_start;
UPDATE client_appointment_slots s JOIN veterinarians v ON v.id=s.veterinarian_id SET s.professional_user_id=v.user_id,s.professional_type_id=(SELECT professional_type_id FROM client_services WHERE id=s.service_id);
CREATE TABLE professional_blocks (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL,
 starts_at DATETIME NOT NULL, ends_at DATETIME NOT NULL, reason VARCHAR(200) NOT NULL,
 is_active BOOLEAN NOT NULL DEFAULT TRUE, FOREIGN KEY(user_id) REFERENCES users(id), CHECK(ends_at>starts_at), KEY(user_id,starts_at)
);
ALTER TABLE client_appointments MODIFY status ENUM('REQUESTED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'REQUESTED',
 ADD COLUMN occupied_slot_id BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN status<>'CANCELLED' THEN slot_id ELSE NULL END) STORED,
 ADD UNIQUE KEY occupied_slot(occupied_slot_id), ADD KEY slot_history(slot_id), DROP INDEX slot_id;
ALTER TABLE client_product_categories ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE client_products ADD COLUMN reserved_stock INT UNSIGNED NOT NULL DEFAULT 0,
 ADD COLUMN requires_prescription BOOLEAN NOT NULL DEFAULT FALSE,
 ADD COLUMN species_id SMALLINT UNSIGNED NULL, ADD FOREIGN KEY(species_id) REFERENCES species(id);
ALTER TABLE client_clinical_records ADD COLUMN consultation_id BIGINT UNSIGNED NULL,
 ADD COLUMN product_id BIGINT UNSIGNED NULL, ADD COLUMN valid_until DATETIME NULL,
 ADD COLUMN weight_kg DECIMAL(6,2) NULL, ADD COLUMN reason TEXT NULL,
 ADD COLUMN diagnosis TEXT NULL, ADD COLUMN treatment TEXT NULL,
 ADD FOREIGN KEY(consultation_id) REFERENCES client_clinical_records(id), ADD FOREIGN KEY(product_id) REFERENCES client_products(id);
ALTER TABLE client_orders MODIFY status ENUM('PLACED','CONFIRMED','PROCESSING','READY','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PLACED';
ALTER TABLE client_order_items ADD COLUMN pet_id BIGINT UNSIGNED NULL, ADD COLUMN prescription_id BIGINT UNSIGNED NULL,
 ADD FOREIGN KEY(pet_id) REFERENCES pets(id), ADD FOREIGN KEY(prescription_id) REFERENCES client_clinical_records(id);
-- El checkout anterior restaba stock físico al solicitar. Restituir esas unidades
-- reales y reservarlas; no sumar pedidos finalizados/cancelados.
UPDATE client_products p JOIN (SELECT i.product_id,SUM(i.quantity) AS units FROM client_order_items i JOIN client_orders o ON o.id=i.order_id WHERE o.status IN ('PLACED','CONFIRMED','PROCESSING','READY') GROUP BY i.product_id) r ON r.product_id=p.id
 SET p.stock=p.stock+r.units,p.reserved_stock=r.units;
ALTER TABLE client_products ADD CHECK(reserved_stock<=stock);
INSERT INTO permission_modules(code,name,sort_order) SELECT 'clinic','Operación de la clínica',70 WHERE NOT EXISTS(SELECT 1 FROM permission_modules WHERE code='clinic');
INSERT INTO permissions(code,name,description,module_code,is_critical,opens_module) VALUES
 ('professionals.manage','Gestionar profesionales','Tipos profesionales y servicios asignados','clinic',1,1),
 ('services.manage','Gestionar servicios','Configurar servicios ofrecidos por la clínica','clinic',1,1),
 ('schedule.manage','Gestionar disponibilidad','Crear horarios y bloqueos profesionales','clinic',1,1),
 ('appointments.manage','Gestionar turnos','Confirmar, asignar, reprogramar y cancelar turnos','clinic',0,1),
 ('reservations.view_all','Ver reservas','Consultar reservas de todos los clientes','clinic',0,1),
 ('reservations.manage','Gestionar reservas','Confirmar, preparar, retirar y cancelar reservas','clinic',0,1),
 ('products.create','Crear productos','Dar de alta productos del catálogo','clinic',1,1),
 ('categories.manage','Gestionar categorías','Administrar categorías de tienda','clinic',1,1),
 ('promotions.manage','Gestionar promociones','Administrar precios informativos temporales','clinic',1,1),
 ('professional_types.manage','Gestionar tipos profesionales','Configurar tipos basados en roles profesionales','clinic',1,1);
-- Grants estructurales mínimos. No concede permisos a personas individuales.
INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code='SUPER_ADMIN' AND p.module_code='clinic';
INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code='SECRETARY' AND p.code IN ('appointments.view_all','appointments.manage','reservations.view_all','reservations.manage','users.view_basic');
INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code='GROOMER' AND p.code IN ('appointments.view_own','appointments.update_own','pets.view_information');
