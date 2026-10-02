-- Estructuras aditivas de Cliente. Sin seeds ni modificaciones de tablas existentes.
CREATE TABLE IF NOT EXISTS client_pet_details (
 pet_id BIGINT UNSIGNED PRIMARY KEY, photo_url VARCHAR(2048) NULL, weight_kg DECIMAL(6,2) NULL,
 FOREIGN KEY (pet_id) REFERENCES pets(id)
);
-- petcare:statement
CREATE TABLE IF NOT EXISTS client_services (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, description TEXT NULL,
 specialty_id INT UNSIGNED NULL, is_active BOOLEAN NOT NULL DEFAULT TRUE,
 FOREIGN KEY (specialty_id) REFERENCES specialties(id)
);
-- petcare:statement
CREATE TABLE IF NOT EXISTS client_appointment_slots (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, service_id BIGINT UNSIGNED NOT NULL,
 veterinarian_id BIGINT UNSIGNED NOT NULL, starts_at DATETIME NOT NULL, ends_at DATETIME NOT NULL,
 is_active BOOLEAN NOT NULL DEFAULT TRUE,
 FOREIGN KEY (service_id) REFERENCES client_services(id), FOREIGN KEY (veterinarian_id) REFERENCES veterinarians(id),
 UNIQUE KEY veterinarian_start (veterinarian_id, starts_at), CHECK (ends_at > starts_at)
);
-- petcare:statement
CREATE TABLE IF NOT EXISTS client_appointments (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, owner_id BIGINT UNSIGNED NOT NULL, pet_id BIGINT UNSIGNED NOT NULL,
 slot_id BIGINT UNSIGNED NOT NULL UNIQUE, status ENUM('REQUESTED','CONFIRMED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'REQUESTED',
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (owner_id) REFERENCES users(id), FOREIGN KEY (pet_id) REFERENCES pets(id), FOREIGN KEY (slot_id) REFERENCES client_appointment_slots(id),
 INDEX owner_appointments (owner_id,created_at)
);
-- petcare:statement
CREATE TABLE IF NOT EXISTS client_clinical_records (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, pet_id BIGINT UNSIGNED NOT NULL, veterinarian_id BIGINT UNSIGNED NOT NULL,
 kind ENUM('medical-history','vaccines','prescriptions','recommendations') NOT NULL,
 title VARCHAR(200) NOT NULL, content TEXT NOT NULL, occurred_at DATETIME NOT NULL, next_due_at DATETIME NULL,
 FOREIGN KEY (pet_id) REFERENCES pets(id), FOREIGN KEY (veterinarian_id) REFERENCES veterinarians(id), INDEX pet_kind (pet_id,kind,occurred_at)
);
-- petcare:statement
CREATE TABLE IF NOT EXISTS client_product_categories (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE
);
-- petcare:statement
CREATE TABLE IF NOT EXISTS client_products (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, category_id BIGINT UNSIGNED NULL, name VARCHAR(200) NOT NULL,
 description TEXT NULL, image_url VARCHAR(2048) NULL, price_cents INT UNSIGNED NOT NULL, stock INT UNSIGNED NOT NULL DEFAULT 0,
 is_active BOOLEAN NOT NULL DEFAULT TRUE, is_featured BOOLEAN NOT NULL DEFAULT FALSE,
 FOREIGN KEY (category_id) REFERENCES client_product_categories(id), CHECK (price_cents <= 100000000)
);
-- petcare:statement
CREATE TABLE IF NOT EXISTS client_promotions (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, product_id BIGINT UNSIGNED NOT NULL,
 name VARCHAR(200) NOT NULL, price_cents INT UNSIGNED NOT NULL, starts_at DATETIME NOT NULL, ends_at DATETIME NOT NULL,
 is_active BOOLEAN NOT NULL DEFAULT TRUE, FOREIGN KEY (product_id) REFERENCES client_products(id),
 CHECK (ends_at > starts_at), CHECK (price_cents <= 100000000)
);
-- petcare:statement
CREATE TABLE IF NOT EXISTS client_cart_items (
 owner_id BIGINT UNSIGNED NOT NULL, product_id BIGINT UNSIGNED NOT NULL, quantity SMALLINT UNSIGNED NOT NULL,
 PRIMARY KEY (owner_id,product_id), FOREIGN KEY (owner_id) REFERENCES users(id), FOREIGN KEY (product_id) REFERENCES client_products(id),
 CHECK (quantity BETWEEN 1 AND 99)
);
-- petcare:statement
CREATE TABLE IF NOT EXISTS client_orders (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, owner_id BIGINT UNSIGNED NOT NULL,
 request_key CHAR(36) NOT NULL, total_cents BIGINT UNSIGNED NOT NULL,
 status ENUM('PLACED','PROCESSING','READY','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PLACED',
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (owner_id) REFERENCES users(id), UNIQUE KEY owner_request (owner_id,request_key), INDEX owner_orders (owner_id,created_at)
);
-- petcare:statement
CREATE TABLE IF NOT EXISTS client_order_items (
 order_id BIGINT UNSIGNED NOT NULL, product_id BIGINT UNSIGNED NOT NULL, product_name VARCHAR(200) NOT NULL,
 quantity SMALLINT UNSIGNED NOT NULL, price_cents INT UNSIGNED NOT NULL,
 PRIMARY KEY (order_id,product_id), FOREIGN KEY (order_id) REFERENCES client_orders(id), FOREIGN KEY (product_id) REFERENCES client_products(id)
);
-- petcare:statement
CREATE TABLE IF NOT EXISTS client_notifications (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, owner_id BIGINT UNSIGNED NOT NULL,
 title VARCHAR(200) NOT NULL, body TEXT NOT NULL, read_at DATETIME NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (owner_id) REFERENCES users(id), INDEX owner_notifications (owner_id,created_at)
);
