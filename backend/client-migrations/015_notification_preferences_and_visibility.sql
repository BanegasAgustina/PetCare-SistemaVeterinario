-- Preferencias por cliente y ocultamiento reversible de notificaciones propias.
-- Aplicar únicamente luego de validar el esquema con el operador de Layerbase.
ALTER TABLE client_notifications
  ADD COLUMN IF NOT EXISTS hidden_at DATETIME(3) NULL;
-- petcare:statement
ALTER TABLE client_appointments
  MODIFY COLUMN status ENUM('REQUESTED','CONFIRMED','REJECTED','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'REQUESTED';
-- petcare:statement
CREATE TABLE IF NOT EXISTS client_notification_preferences (
  user_id BIGINT UNSIGNED NOT NULL,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  appointment_reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  order_updates_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id),
  CONSTRAINT fk_client_notification_preferences_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
