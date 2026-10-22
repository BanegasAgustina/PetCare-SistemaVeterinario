-- Transferencias bancarias reales: la intención vence a los cinco minutos, pero el
-- pedido se conserva para revisar comprobantes tardíos. DNI no se persiste.
ALTER TABLE client_orders
  MODIFY COLUMN order_type VARCHAR(32) NOT NULL DEFAULT 'RESERVATION';
-- petcare:statement
ALTER TABLE client_orders
  MODIFY COLUMN payment_status VARCHAR(24) NOT NULL DEFAULT 'NOT_APPLICABLE';
-- petcare:statement
CREATE TABLE IF NOT EXISTS client_store_payment_intents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  owner_id BIGINT UNSIGNED NOT NULL,
  buyer_name VARCHAR(160) NOT NULL,
  buyer_email VARCHAR(254) NOT NULL,
  transfer_reference VARCHAR(120) NULL,
  expires_at TIMESTAMP(3) NOT NULL,
  intent_status ENUM('ACTIVE','EXPIRED') NOT NULL DEFAULT 'ACTIVE',
  proof_object_key VARCHAR(240) NULL,
  proof_content_type VARCHAR(80) NULL,
  proof_size_bytes INT UNSIGNED NULL,
  proof_submitted_at TIMESTAMP(3) NULL,
  review_status ENUM('NOT_SUBMITTED','SUBMITTED','APPROVED','REJECTED') NOT NULL DEFAULT 'NOT_SUBMITTED',
  review_reason VARCHAR(500) NULL,
  verified_by BIGINT UNSIGNED NULL,
  verified_at TIMESTAMP(3) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_client_store_payment_intent_order (order_id,id),
  KEY idx_client_store_payment_intent_owner (owner_id,created_at),
  KEY idx_client_store_payment_intent_review (review_status,expires_at),
  CONSTRAINT fk_client_store_payment_intent_order FOREIGN KEY (order_id) REFERENCES client_orders (id) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT fk_client_store_payment_intent_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT fk_client_store_payment_intent_verifier FOREIGN KEY (verified_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
