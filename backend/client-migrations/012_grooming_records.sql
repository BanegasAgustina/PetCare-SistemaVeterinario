-- Historial independiente de servicios de peluquería, vinculado a turnos existentes.
CREATE TABLE IF NOT EXISTS client_grooming_records (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 appointment_id BIGINT UNSIGNED NOT NULL UNIQUE,
 pet_id BIGINT UNSIGNED NOT NULL,
 professional_user_id BIGINT UNSIGNED NOT NULL,
 created_by_user_id BIGINT UNSIGNED NOT NULL,
 updated_by_user_id BIGINT UNSIGNED NOT NULL,
 coat_notes TEXT NULL,
 behavior_notes TEXT NULL,
 care_instructions TEXT NULL,
 created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
 CONSTRAINT fk_grooming_record_appointment FOREIGN KEY (appointment_id) REFERENCES client_appointments(id) ON DELETE RESTRICT,
 CONSTRAINT fk_grooming_record_pet FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE RESTRICT,
 CONSTRAINT fk_grooming_record_professional FOREIGN KEY (professional_user_id) REFERENCES users(id) ON DELETE RESTRICT,
 CONSTRAINT fk_grooming_record_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
 CONSTRAINT fk_grooming_record_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
 KEY idx_grooming_records_pet_time (pet_id, created_at),
 KEY idx_grooming_records_professional_time (professional_user_id, created_at)
);
