-- Esquema NUEVO exclusivamente para bases vacías. No reconstruye el historial de instalaciones previas.
-- DDL de schema-audit.json y ampliaciones exigidas por los repositories actuales.
-- Solo catálogos estructurales existentes: roles, permisos, especies y tipos; cero cuentas o registros clínicos.
CREATE TABLE `client_product_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE `client_products` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint unsigned DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `description` text,
  `image_url` varchar(2048) DEFAULT NULL,
  `price_cents` int unsigned NOT NULL,
  `stock` int unsigned NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `client_products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `client_product_categories` (`id`),
  CONSTRAINT `client_products_chk_1` CHECK ((`price_cents` <= 100000000))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE `client_promotions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `name` varchar(200) NOT NULL,
  `price_cents` int unsigned NOT NULL,
  `starts_at` datetime NOT NULL,
  `ends_at` datetime NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `client_promotions_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `client_products` (`id`),
  CONSTRAINT `client_promotions_chk_1` CHECK ((`ends_at` > `starts_at`)),
  CONSTRAINT `client_promotions_chk_2` CHECK ((`price_cents` <= 100000000))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE `permission_modules` (
  `code` varchar(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `name` varchar(100) NOT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE `permissions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) NOT NULL,
  `module_code` varchar(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `is_critical` tinyint(1) NOT NULL DEFAULT '0',
  `opens_module` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_permission_code` (`code`),
  KEY `fk_permission_module` (`module_code`),
  CONSTRAINT `fk_permission_module` FOREIGN KEY (`module_code`) REFERENCES `permission_modules` (`code`) ON DELETE RESTRICT,
  CONSTRAINT `chk_permission_critical` CHECK ((`is_critical` in (0,1))),
  CONSTRAINT `chk_permission_opens_module` CHECK ((`opens_module` in (0,1)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE `roles` (
  `id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `name` varchar(60) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_roles_code` (`code`),
  CONSTRAINT `chk_roles_canonical_code` CHECK ((`code` = upper(trim(`code`)))),
  CONSTRAINT `chk_roles_canonical_name` CHECK ((`name` = trim(`name`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE `specialties` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_0900_as_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_specialty_name` (`name`),
  CONSTRAINT `chk_specialty_name` CHECK ((char_length(trim(`name`)) > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_ci;
-- petcare:statement
CREATE TABLE `species` (
  `id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_species_code` (`code`),
  UNIQUE KEY `uq_species_name` (`name`),
  CONSTRAINT `chk_species_canonical_code` CHECK ((`code` = upper(trim(`code`)))),
  CONSTRAINT `chk_species_canonical_name` CHECK ((`name` = trim(`name`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_id` smallint unsigned NOT NULL,
  `email` varchar(254) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `email_verified_at` datetime(3) DEFAULT NULL,
  `session_version` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role_active_name` (`role_id`,`is_active`,`last_name`,`first_name`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE `veterinarian_invitations` (
  `user_id` bigint unsigned NOT NULL,
  `token_hash` char(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `consumed_at` datetime(3) DEFAULT NULL,
  `sent_at` datetime(3) NOT NULL,
  `delivery` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_veterinarian_invitation_token` (`token_hash`),
  CONSTRAINT `fk_veterinarian_invitation_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE `veterinarians` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `license_number` varchar(80) COLLATE utf8mb4_0900_as_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_veterinarian_user` (`user_id`),
  UNIQUE KEY `uq_veterinarian_license` (`license_number`),
  CONSTRAINT `fk_vet_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_vet_license` CHECK ((char_length(trim(`license_number`)) > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_ci;
-- petcare:statement
CREATE TABLE `breeds` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `species_id` smallint unsigned NOT NULL,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_breeds_species_name` (`species_id`,`name`),
  CONSTRAINT `fk_breeds_species` FOREIGN KEY (`species_id`) REFERENCES `species` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `chk_breeds_canonical_name` CHECK ((`name` = trim(`name`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE `client_cart_items` (
  `owner_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `quantity` smallint unsigned NOT NULL,
  PRIMARY KEY (`owner_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `client_cart_items_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`),
  CONSTRAINT `client_cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `client_products` (`id`),
  CONSTRAINT `client_cart_items_chk_1` CHECK ((`quantity` between 1 and 99))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE `client_notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `owner_id` bigint unsigned NOT NULL,
  `title` varchar(200) NOT NULL,
  `body` text NOT NULL,
  `read_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `owner_notifications` (`owner_id`,`created_at`),
  CONSTRAINT `client_notifications_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE `client_orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `owner_id` bigint unsigned NOT NULL,
  `request_key` char(36) NOT NULL,
  `total_cents` bigint unsigned NOT NULL,
  `status` enum('PLACED','PROCESSING','READY','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PLACED',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `owner_request` (`owner_id`,`request_key`),
  KEY `owner_orders` (`owner_id`,`created_at`),
  CONSTRAINT `client_orders_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE `client_services` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `specialty_id` int unsigned DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `specialty_id` (`specialty_id`),
  CONSTRAINT `client_services_ibfk_1` FOREIGN KEY (`specialty_id`) REFERENCES `specialties` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE `email_verifications` (
  `user_id` bigint unsigned NOT NULL,
  `token_hash` char(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `proof_expires_at` datetime(3) NOT NULL,
  `code_hash` char(64) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  `expires_at` datetime(3) DEFAULT NULL,
  `attempts` tinyint unsigned NOT NULL DEFAULT '0',
  `send_count` tinyint unsigned NOT NULL DEFAULT '0',
  `send_window_started_at` datetime(3) NOT NULL,
  `next_send_at` datetime(3) NOT NULL,
  `delivery` enum('pending','sent','failed') COLLATE utf8mb4_0900_as_ci NOT NULL DEFAULT 'pending',
  `consumed_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_verification_token` (`token_hash`),
  CONSTRAINT `fk_verification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `chk_verification_attempts` CHECK ((`attempts` <= 5)),
  CONSTRAINT `chk_verification_send_count` CHECK ((`send_count` <= 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_ci;
-- petcare:statement
CREATE TABLE `pets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `owner_id` bigint unsigned NOT NULL,
  `name` varchar(100) NOT NULL,
  `species_id` smallint unsigned NOT NULL,
  `breed_id` int unsigned DEFAULT NULL,
  `sex` enum('FEMALE','MALE','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  `birth_date` date DEFAULT NULL,
  `microchip_number` varchar(32) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pets_microchip` (`microchip_number`),
  KEY `idx_pets_owner_active` (`owner_id`,`is_active`),
  KEY `fk_pets_species` (`species_id`),
  KEY `fk_pets_breed` (`breed_id`),
  CONSTRAINT `fk_pets_breed` FOREIGN KEY (`breed_id`) REFERENCES `breeds` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_pets_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_pets_species` FOREIGN KEY (`species_id`) REFERENCES `species` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `chk_pets_canonical_microchip` CHECK (((`microchip_number` is null) or (`microchip_number` = trim(`microchip_number`))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE `role_permissions` (
  `role_id` smallint unsigned NOT NULL,
  `permission_id` int unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `fk_role_permission_permission` (`permission_id`),
  CONSTRAINT `fk_role_permission_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_role_permission_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE `user_permissions` (
  `user_id` bigint unsigned NOT NULL,
  `permission_id` int unsigned NOT NULL,
  `allowed` tinyint(1) NOT NULL,
  PRIMARY KEY (`user_id`,`permission_id`),
  KEY `fk_user_permission_permission` (`permission_id`),
  CONSTRAINT `fk_user_permission_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_user_permission_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_user_permission_allowed` CHECK ((`allowed` in (0,1)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE `veterinarian_patients` (
  `veterinarian_id` bigint unsigned NOT NULL,
  `pet_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`veterinarian_id`,`pet_id`),
  KEY `idx_patient_vet` (`pet_id`,`veterinarian_id`),
  CONSTRAINT `fk_veterinarian_patient_pet` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_veterinarian_patient_veterinarian` FOREIGN KEY (`veterinarian_id`) REFERENCES `veterinarians` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE `veterinarian_specialties` (
  `veterinarian_id` bigint unsigned NOT NULL,
  `specialty_id` int unsigned NOT NULL,
  PRIMARY KEY (`veterinarian_id`,`specialty_id`),
  KEY `idx_specialty_vet` (`specialty_id`,`veterinarian_id`),
  CONSTRAINT `fk_vet_specialty_specialty` FOREIGN KEY (`specialty_id`) REFERENCES `specialties` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_vet_specialty_veterinarian` FOREIGN KEY (`veterinarian_id`) REFERENCES `veterinarians` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE `client_appointment_slots` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `service_id` bigint unsigned NOT NULL,
  `veterinarian_id` bigint unsigned NOT NULL,
  `starts_at` datetime NOT NULL,
  `ends_at` datetime NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `veterinarian_start` (`veterinarian_id`,`starts_at`),
  KEY `service_id` (`service_id`),
  CONSTRAINT `client_appointment_slots_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `client_services` (`id`),
  CONSTRAINT `client_appointment_slots_ibfk_2` FOREIGN KEY (`veterinarian_id`) REFERENCES `veterinarians` (`id`),
  CONSTRAINT `client_appointment_slots_chk_1` CHECK ((`ends_at` > `starts_at`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE `client_appointments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `owner_id` bigint unsigned NOT NULL,
  `pet_id` bigint unsigned NOT NULL,
  `slot_id` bigint unsigned NOT NULL,
  `status` enum('REQUESTED','CONFIRMED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'REQUESTED',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slot_id` (`slot_id`),
  KEY `pet_id` (`pet_id`),
  KEY `owner_appointments` (`owner_id`,`created_at`),
  CONSTRAINT `client_appointments_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`),
  CONSTRAINT `client_appointments_ibfk_2` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`),
  CONSTRAINT `client_appointments_ibfk_3` FOREIGN KEY (`slot_id`) REFERENCES `client_appointment_slots` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE `client_clinical_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `pet_id` bigint unsigned NOT NULL,
  `veterinarian_id` bigint unsigned NOT NULL,
  `kind` enum('medical-history','vaccines','prescriptions','recommendations') NOT NULL,
  `title` varchar(200) NOT NULL,
  `content` text NOT NULL,
  `occurred_at` datetime NOT NULL,
  `next_due_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `veterinarian_id` (`veterinarian_id`),
  KEY `pet_kind` (`pet_id`,`kind`,`occurred_at`),
  CONSTRAINT `client_clinical_records_ibfk_1` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`),
  CONSTRAINT `client_clinical_records_ibfk_2` FOREIGN KEY (`veterinarian_id`) REFERENCES `veterinarians` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE `client_order_items` (
  `order_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `product_name` varchar(200) NOT NULL,
  `quantity` smallint unsigned NOT NULL,
  `price_cents` int unsigned NOT NULL,
  PRIMARY KEY (`order_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `client_order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `client_orders` (`id`),
  CONSTRAINT `client_order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `client_products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE `client_pet_details` (
  `pet_id` bigint unsigned NOT NULL,
  `photo_url` varchar(2048) DEFAULT NULL,
  `weight_kg` decimal(6,2) DEFAULT NULL,
  `breed_name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`pet_id`),
  CONSTRAINT `client_pet_details_ibfk_1` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- petcare:statement
CREATE TABLE professional_types(id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100) NOT NULL UNIQUE,role_id SMALLINT UNSIGNED NOT NULL,is_clinical TINYINT NOT NULL DEFAULT 0,FOREIGN KEY(role_id) REFERENCES roles(id),CHECK(is_clinical IN (0,1))) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- petcare:statement
ALTER TABLE roles ADD professional_type_id BIGINT UNSIGNED NULL, ADD FOREIGN KEY(professional_type_id) REFERENCES professional_types(id);
-- petcare:statement
ALTER TABLE users ADD professional_type_id BIGINT UNSIGNED NULL, ADD FOREIGN KEY(professional_type_id) REFERENCES professional_types(id);
-- petcare:statement
ALTER TABLE specialties ADD is_active TINYINT NOT NULL DEFAULT 1 CHECK(is_active IN (0,1));
-- petcare:statement
ALTER TABLE client_product_categories ADD is_active TINYINT NOT NULL DEFAULT 1 CHECK(is_active IN (0,1));
-- petcare:statement
ALTER TABLE client_services ADD professional_type_id BIGINT UNSIGNED NOT NULL, ADD duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 30, ADD price_cents INT UNSIGNED NULL, ADD requirements TEXT NULL, ADD FOREIGN KEY(professional_type_id) REFERENCES professional_types(id), ADD CHECK(duration_minutes BETWEEN 5 AND 480), ADD CHECK(price_cents IS NULL OR price_cents<=100000000);
-- petcare:statement
CREATE TABLE professional_services(user_id BIGINT UNSIGNED NOT NULL,service_id BIGINT UNSIGNED NOT NULL,PRIMARY KEY(user_id,service_id),FOREIGN KEY(user_id) REFERENCES users(id),FOREIGN KEY(service_id) REFERENCES client_services(id)) ENGINE=InnoDB;
-- petcare:statement
CREATE TABLE professional_blocks(id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,user_id BIGINT UNSIGNED NOT NULL,starts_at DATETIME NOT NULL,ends_at DATETIME NOT NULL,reason VARCHAR(200) NOT NULL,is_active TINYINT NOT NULL DEFAULT 1,FOREIGN KEY(user_id) REFERENCES users(id),CHECK(ends_at>starts_at),INDEX(user_id,starts_at,ends_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- petcare:statement
ALTER TABLE client_appointment_slots ADD professional_user_id BIGINT UNSIGNED NOT NULL, ADD professional_type_id BIGINT UNSIGNED NOT NULL, MODIFY veterinarian_id BIGINT UNSIGNED NULL, ADD INDEX idx_slot_vet(veterinarian_id), DROP INDEX veterinarian_start, ADD active_start DATETIME GENERATED ALWAYS AS (CASE WHEN is_active=1 THEN starts_at ELSE NULL END) STORED, ADD UNIQUE KEY uq_active_professional_start(professional_user_id,active_start), ADD FOREIGN KEY(professional_user_id) REFERENCES users(id), ADD FOREIGN KEY(professional_type_id) REFERENCES professional_types(id);
-- petcare:statement
ALTER TABLE client_appointments MODIFY status ENUM('REQUESTED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'REQUESTED', ADD INDEX idx_appointment_slot(slot_id), DROP INDEX slot_id, ADD occupied_slot_id BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN status<>'CANCELLED' THEN slot_id ELSE NULL END) STORED, ADD UNIQUE KEY uq_occupied_slot(occupied_slot_id);
-- petcare:statement
ALTER TABLE client_products ADD reserved_stock INT UNSIGNED NOT NULL DEFAULT 0, ADD requires_prescription TINYINT NOT NULL DEFAULT 0, ADD species_id SMALLINT UNSIGNED NULL, ADD FOREIGN KEY(species_id) REFERENCES species(id), ADD CHECK(reserved_stock<=stock), ADD CHECK(requires_prescription IN (0,1));
-- petcare:statement
ALTER TABLE client_clinical_records ADD product_id BIGINT UNSIGNED NULL, ADD consultation_id BIGINT UNSIGNED NULL, ADD valid_until DATETIME NULL, ADD weight_kg DECIMAL(6,2) NULL, ADD reason TEXT NULL, ADD diagnosis TEXT NULL, ADD treatment TEXT NULL, ADD FOREIGN KEY(product_id) REFERENCES client_products(id), ADD FOREIGN KEY(consultation_id) REFERENCES client_clinical_records(id), ADD CHECK(weight_kg IS NULL OR weight_kg>0);
-- petcare:statement
ALTER TABLE client_orders MODIFY status ENUM('PLACED','CONFIRMED','PROCESSING','READY','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PLACED';
-- petcare:statement
ALTER TABLE client_order_items ADD pet_id BIGINT UNSIGNED NULL, ADD prescription_id BIGINT UNSIGNED NULL, ADD FOREIGN KEY(pet_id) REFERENCES pets(id), ADD FOREIGN KEY(prescription_id) REFERENCES client_clinical_records(id), ADD CHECK(quantity BETWEEN 1 AND 99);
-- petcare:statement
INSERT INTO roles(code,name) VALUES ('CLIENT','Cliente'),('VETERINARIAN','Veterinario'),('ADMIN','Administrador'),('SUPER_ADMIN','Super administrador'),('GROOMER','Peluquero'),('SECRETARY','Secretaría');
-- petcare:statement
INSERT INTO permission_modules(code,name,sort_order) VALUES ('pets','pets',0),('appointments','appointments',1),('medical_records','medical records',2),('vaccines','vaccines',3),('prescriptions','prescriptions',4),('recommendations','recommendations',5),('users','users',6),('products','products',7),('veterinarians','veterinarians',8),('permissions','permissions',9),('roles','roles',10),('specialties','specialties',11),('professionals','professionals',12),('services','services',13),('schedule','schedule',14),('reservations','reservations',15),('categories','categories',16),('promotions','promotions',17),('professional_types','professional types',18);
-- petcare:statement
INSERT INTO permissions(code,name,description,module_code,is_critical,opens_module) VALUES ('pets.view_assigned','Ver pacientes asignados','Ver pacientes asignados','pets',0,0),('pets.view_all','Ver todos los pacientes','Ver todos los pacientes','pets',0,0),('pets.view_information','Ver información de mascotas','Ver información de mascotas','pets',0,0),('appointments.view_own','Ver sus turnos','Ver sus turnos','appointments',0,0),('appointments.view_all','Ver todos los turnos','Ver todos los turnos','appointments',0,0),('appointments.update_own','Actualizar sus turnos','Actualizar sus turnos','appointments',0,0),('medical_records.view','Ver historial médico','Ver historial médico','medical_records',0,0),('medical_records.create','Crear consultas','Crear consultas','medical_records',0,0),('medical_records.update_own','Editar sus consultas','Editar sus consultas','medical_records',0,0),('medical_records.update_all','Editar consultas ajenas','Editar consultas ajenas','medical_records',0,0),('medical_records.diagnose','Registrar diagnóstico','Registrar diagnóstico','medical_records',0,0),('medical_records.treat','Registrar tratamiento','Registrar tratamiento','medical_records',0,0),('vaccines.view','Ver vacunas','Ver vacunas','vaccines',0,0),('vaccines.create','Registrar vacunas','Registrar vacunas','vaccines',0,0),('prescriptions.view','Ver recetas','Ver recetas','prescriptions',0,0),('prescriptions.create','Crear recetas','Crear recetas','prescriptions',0,0),('recommendations.create','Crear recomendaciones','Crear recomendaciones','recommendations',0,0),('users.view_basic','Ver propietario','Ver propietario','users',0,0),('users.update_client','Editar información del cliente','Editar información del cliente','users',0,0),('products.view','Ver productos','Ver productos','products',0,0),('products.recommend','Recomendar productos','Recomendar productos','products',0,0),('products.update','Modificar productos','Modificar productos','products',0,0),('products.update_price','Modificar precios','Modificar precios','products',0,0),('products.update_stock','Modificar stock','Modificar stock','products',0,0),('users.manage','Gestionar usuarios','Gestionar usuarios','users',1,0),('veterinarians.manage','Gestionar veterinarios','Gestionar veterinarios','veterinarians',1,0),('permissions.manage','Modificar permisos','Modificar permisos','permissions',1,0),('roles.manage','Gestionar roles','Gestionar roles','roles',1,0),('specialties.manage','Gestionar especialidades','Gestionar especialidades','specialties',1,0),('professionals.manage','Gestionar profesionales','Gestionar profesionales','professionals',1,0),('services.manage','Gestionar servicios','Gestionar servicios','services',1,0),('schedule.manage','Gestionar disponibilidad','Gestionar disponibilidad','schedule',1,0),('appointments.manage','Gestionar turnos','Gestionar turnos','appointments',0,0),('reservations.view_all','Ver todas las reservas','Ver todas las reservas','reservations',0,0),('reservations.manage','Gestionar reservas','Gestionar reservas','reservations',0,0),('products.create','Crear productos','Crear productos','products',1,0),('categories.manage','Gestionar categorías','Gestionar categorías','categories',1,0),('promotions.manage','Gestionar promociones','Gestionar promociones','promotions',1,0),('professional_types.manage','Gestionar tipos profesionales','Gestionar tipos profesionales','professional_types',1,0);
-- petcare:statement
INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code='SUPER_ADMIN';
-- petcare:statement
INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code='VETERINARIAN' AND p.code IN ('pets.view_assigned','pets.view_information','appointments.view_own','appointments.update_own','medical_records.view','medical_records.create','medical_records.diagnose','medical_records.treat','vaccines.view','vaccines.create','prescriptions.view','prescriptions.create','recommendations.create','products.view','products.recommend');
-- petcare:statement
INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code='GROOMER' AND p.code IN ('appointments.view_own','appointments.update_own','pets.view_information');
-- petcare:statement
INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code='SECRETARY' AND p.code IN ('appointments.view_all','appointments.manage','reservations.view_all','reservations.manage','users.view_basic');
-- petcare:statement
INSERT INTO species(code,name) VALUES ('DOG','Perro'),('CAT','Gato');
-- petcare:statement
INSERT INTO professional_types(name,role_id,is_clinical) SELECT 'Veterinario',id,1 FROM roles WHERE code='VETERINARIAN';
-- petcare:statement
INSERT INTO professional_types(name,role_id,is_clinical) SELECT 'Peluquería',id,0 FROM roles WHERE code='GROOMER';
-- petcare:statement
UPDATE roles r JOIN professional_types pt ON pt.role_id=r.id SET r.professional_type_id=pt.id;
