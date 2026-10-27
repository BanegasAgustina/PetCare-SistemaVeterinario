-- Migración aditiva. Aplicar solo después de confirmar que pets.id y users.id son BIGINT UNSIGNED.
-- No actualiza pets, turnos ni registros clínicos existentes.
CREATE TABLE pet_lifecycle_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  pet_id BIGINT UNSIGNED NOT NULL,
  previous_is_active TINYINT(1) NOT NULL,
  new_is_active TINYINT(1) NOT NULL,
  actor_user_id BIGINT UNSIGNED NOT NULL,
  actor_role VARCHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  reason VARCHAR(500) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_pet_lifecycle_history_pet (pet_id, id),
  KEY idx_pet_lifecycle_history_actor (actor_user_id, id),
  CONSTRAINT fk_pet_lifecycle_history_pet FOREIGN KEY (pet_id) REFERENCES pets (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_pet_lifecycle_history_actor FOREIGN KEY (actor_user_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
