ALTER TABLE client_notifications
  ADD COLUMN event_type VARCHAR(40) NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN reference_type VARCHAR(32) NULL,
  ADD COLUMN reference_id BIGINT UNSIGNED NULL,
  ADD COLUMN event_key VARCHAR(191) CHARACTER SET ascii COLLATE ascii_bin NULL,
  ADD UNIQUE KEY uq_client_notifications_event_key (event_key);

CREATE TABLE client_push_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  expo_push_token VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  platform ENUM('android', 'ios') NOT NULL,
  revoked_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_client_push_tokens_token (expo_push_token),
  KEY idx_client_push_tokens_user (user_id, revoked_at),
  CONSTRAINT fk_client_push_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE client_notification_push_deliveries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  notification_id BIGINT UNSIGNED NOT NULL,
  push_token_id BIGINT UNSIGNED NOT NULL,
  status ENUM('PENDING', 'SENDING', 'ACCEPTED', 'DELIVERED', 'FAILED') NOT NULL DEFAULT 'PENDING',
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  next_attempt_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  lease_expires_at DATETIME(3) NULL,
  expo_ticket_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
  receipt_checked_at DATETIME(3) NULL,
  last_error_code VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_notification_push_delivery (notification_id, push_token_id),
  KEY idx_notification_push_pending (status, next_attempt_at, id),
  KEY idx_notification_push_receipts (status, receipt_checked_at, id),
  CONSTRAINT fk_notification_push_delivery_notification
    FOREIGN KEY (notification_id) REFERENCES client_notifications(id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_push_delivery_token
    FOREIGN KEY (push_token_id) REFERENCES client_push_tokens(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE client_notification_email_deliveries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  notification_id BIGINT UNSIGNED NOT NULL,
  status ENUM('PENDING', 'SENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
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
