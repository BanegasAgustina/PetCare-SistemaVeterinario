-- Persiste una entrega de correo por notificación.
-- IF NOT EXISTS evita duplicar la tabla preexistente en ciertos despliegues;
-- no valida ni repara una tabla homónima con estructura diferente.
-- Eliminar la tabla como rollback borraría la cola y su historial de entregas.
CREATE TABLE IF NOT EXISTS client_notification_email_deliveries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  notification_id BIGINT UNSIGNED NOT NULL,
  status ENUM('PENDING','SENDING','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  next_attempt_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  lease_expires_at DATETIME(3) NULL,
  last_error_code VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_notification_email_delivery (notification_id),
  KEY idx_notification_email_pending (status, next_attempt_at, id),
  CONSTRAINT fk_notification_email_delivery_notification
    FOREIGN KEY (notification_id) REFERENCES client_notifications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
